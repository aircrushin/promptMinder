CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_personal BOOLEAN NOT NULL DEFAULT false, -- 是否为个人团队
    created_by TEXT NOT NULL, -- 创建者
    owner_id TEXT NOT NULL, -- 当前团队拥有者
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_team_name_not_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_personal_owner_matches_creator CHECK (is_personal = false OR created_by = owner_id)
);

-- 限制每个用户仅能拥有一个个人团队
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_personal_owner ON teams(owner_id) WHERE is_personal;
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- 团队成员关系表
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')), -- 成员角色
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

-- 修改 projects 表，添加 team_id
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- 修改 prompts 表，添加 team_id
ALTER TABLE prompts
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- 修改 tags 表，添加 team_id
ALTER TABLE tags
    ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_prompts_team_id ON prompts(team_id);
CREATE INDEX IF NOT EXISTS idx_tags_team_id ON tags(team_id);
