-- =====================================================
-- PromptMinder 数据库初始化脚本
-- 此脚本在 Docker 容器首次启动时自动执行
-- =====================================================

-- 创建 PostgREST 所需的角色
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOLOGIN;
    END IF;
END
$$;

-- =====================================================
-- 1. 用户表 (users) - 本地认证
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 清理过期会话的函数
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. 团队表 (teams)
-- =====================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_personal BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_team_name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_personal_owner_matches_creator CHECK (is_personal = false OR created_by = owner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_personal_owner ON teams(owner_id) WHERE is_personal;
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- 团队成员关系表
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'left', 'removed', 'blocked')),
    invited_by TEXT,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    UNIQUE(team_id, user_id),
    CONSTRAINT chk_owner_must_be_active CHECK (role <> 'owner' OR status = 'active')
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_single_owner ON team_members(team_id) WHERE role = 'owner' AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_team_members_pending ON team_members(team_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- =====================================================
-- 3. 项目表 (projects)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_project_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_team_name ON projects(team_id, lower(name));

-- =====================================================
-- 4. 提示词表 (prompts)
-- =====================================================
CREATE TABLE IF NOT EXISTS prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    user_id TEXT,
    version TEXT,
    tags TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    cover_img TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_prompt_title_not_empty CHECK (char_length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_prompts_team_id ON prompts(team_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON prompts(project_id);

-- =====================================================
-- 5. 标签表 (tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_id TEXT,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, team_id, user_id),
    CONSTRAINT chk_tag_name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_tag_scope CHECK (
        (team_id IS NOT NULL AND user_id IS NULL)
        OR (team_id IS NULL AND user_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_tags_team_id ON tags(team_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- =====================================================
-- 6. 贡献表 (prompt_contributions)
-- =====================================================
CREATE TABLE IF NOT EXISTS prompt_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL,
    content TEXT NOT NULL,
    contributor_email TEXT,
    contributor_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    published_prompt_id UUID,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_prompt_contributions_status ON prompt_contributions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_contributions_created_at ON prompt_contributions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_contributions_role_category ON prompt_contributions(role_category);

-- 贡献表更新触发器
CREATE OR REPLACE FUNCTION update_prompt_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prompt_contributions_updated_at ON prompt_contributions;
CREATE TRIGGER trigger_update_prompt_contributions_updated_at
    BEFORE UPDATE ON prompt_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_contributions_updated_at();

-- 启用行级安全策略
ALTER TABLE prompt_contributions ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "Anyone can insert contributions" ON prompt_contributions;
CREATE POLICY "Anyone can insert contributions" ON prompt_contributions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all contributions" ON prompt_contributions;
CREATE POLICY "Admins can view all contributions" ON prompt_contributions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update contributions" ON prompt_contributions;
CREATE POLICY "Admins can update contributions" ON prompt_contributions
    FOR UPDATE USING (true);

-- 注释
COMMENT ON TABLE prompt_contributions IS '用户贡献的提示词表，需要管理员审核';
COMMENT ON COLUMN prompt_contributions.title IS '提示词标题';
COMMENT ON COLUMN prompt_contributions.role_category IS '角色或类别';
COMMENT ON COLUMN prompt_contributions.content IS '提示词内容';
COMMENT ON COLUMN prompt_contributions.status IS '审核状态：pending/approved/rejected';

-- 管理员审核视图
CREATE OR REPLACE VIEW pending_contributions AS
SELECT 
    id,
    title,
    role_category,
    CASE 
        WHEN LENGTH(content) > 100 THEN LEFT(content, 100) || '...'
        ELSE content
    END as content_preview,
    contributor_email,
    contributor_name,
    created_at,
    EXTRACT(DAY FROM NOW() - created_at) as days_pending
FROM prompt_contributions 
WHERE status = 'pending'
ORDER BY created_at ASC;

-- 贡献统计视图
CREATE OR REPLACE VIEW contribution_stats AS
SELECT 
    status,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM prompt_contributions 
GROUP BY status, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- =====================================================
-- 7. 权限设置
-- =====================================================

-- 授予 schema 使用权限
GRANT USAGE ON SCHEMA public TO anon, service_role;

-- service_role 拥有完整权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- anon 只有读取权限（用于公开数据）
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 设置默认权限（对未来创建的表生效）
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- 允许角色切换
GRANT anon, service_role TO authenticator;

-- =====================================================
-- 初始化完成
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'PromptMinder 数据库初始化完成！';
END
$$;
