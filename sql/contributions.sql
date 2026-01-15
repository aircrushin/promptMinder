-- 创建 prompt_contributions 表
-- 用于存储用户贡献的提示词，需要审核后才能发布到公共合集

CREATE TABLE prompt_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL, -- 角色/类别
    content TEXT NOT NULL,
    language TEXT DEFAULT 'zh', -- 语言 (zh/en)
    contributor_email TEXT, -- 贡献者邮箱（可选）
    contributor_name TEXT, -- 贡献者姓名（可选）
    status TEXT NOT NULL DEFAULT 'pending', -- 状态: pending, approved, rejected
    admin_notes TEXT, -- 管理员审核备注
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ, -- 审核时间
    reviewed_by TEXT, -- 审核人员ID
    published_prompt_id UUID, -- 发布后对应的prompt ID（如果审核通过）
    
    
    -- 添加约束
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 创建索引以提高查询性能
CREATE INDEX idx_prompt_contributions_status ON prompt_contributions(status);
CREATE INDEX idx_prompt_contributions_created_at ON prompt_contributions(created_at DESC);
CREATE INDEX idx_prompt_contributions_role_category ON prompt_contributions(role_category);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_prompt_contributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_contributions_updated_at
    BEFORE UPDATE ON prompt_contributions
    FOR EACH ROW
    EXECUTE FUNCTION update_prompt_contributions_updated_at();

-- 启用行级安全策略 (RLS)
ALTER TABLE prompt_contributions ENABLE ROW LEVEL SECURITY;

-- 创建策略：任何人都可以插入贡献
CREATE POLICY "Anyone can insert contributions" ON prompt_contributions
    FOR INSERT WITH CHECK (true);

-- 创建策略：只有管理员可以查看和更新所有贡献
CREATE POLICY "Admins can view all contributions" ON prompt_contributions
    FOR SELECT USING (
        -- 这里需要根据你的用户角色系统调整
        -- 例如：auth.jwt() ->> 'role' = 'admin'
        true -- 暂时允许所有查看，后续可以根据需要调整
    );

CREATE POLICY "Admins can update contributions" ON prompt_contributions
    FOR UPDATE USING (
        -- 这里需要根据你的用户角色系统调整
        -- 例如：auth.jwt() ->> 'role' = 'admin'
        true -- 暂时允许所有更新，后续可以根据需要调整
    );

-- 添加注释
COMMENT ON TABLE prompt_contributions IS '用户贡献的提示词表，需要管理员审核';
COMMENT ON COLUMN prompt_contributions.title IS '提示词标题';
COMMENT ON COLUMN prompt_contributions.role_category IS '角色或类别，如"写作助手"、"代码帮手"等';
COMMENT ON COLUMN prompt_contributions.content IS '提示词内容';
COMMENT ON COLUMN prompt_contributions.status IS '审核状态：pending(待审核)、approved(已通过)、rejected(已拒绝)';
COMMENT ON COLUMN prompt_contributions.published_prompt_id IS '如果审核通过，对应发布的prompt表中的ID';

-- 创建管理员审核视图，方便查看待审核的贡献
CREATE VIEW pending_contributions AS
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

COMMENT ON VIEW pending_contributions IS '待审核贡献视图，显示内容预览和等待天数';

-- 创建贡献统计视图
CREATE VIEW contribution_stats AS
SELECT 
    status,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM prompt_contributions 
GROUP BY status, DATE_TRUNC('day', created_at)
ORDER BY date DESC;

COMMENT ON VIEW contribution_stats IS '贡献统计视图，按状态和日期分组';

-- 常用查询示例（注释形式）
/*
-- 1. 插入新的贡献
INSERT INTO prompt_contributions (title, role_category, content, contributor_email, contributor_name) 
VALUES ('写作助手', '内容创作', '你是一个专业的写作助手...', 'user@example.com', '张三');

-- 2. 查看所有待审核的贡献
SELECT * FROM pending_contributions;

-- 3. 审核通过某个贡献
UPDATE prompt_contributions 
SET status = 'approved', 
    reviewed_at = NOW(), 
    reviewed_by = 'admin_user_id',
    admin_notes = '质量很好，已通过审核'
WHERE id = 'contribution_uuid';

-- 4. 拒绝某个贡献
UPDATE prompt_contributions 
SET status = 'rejected', 
    reviewed_at = NOW(), 
    reviewed_by = 'admin_user_id',
    admin_notes = '内容不够具体，请重新提交'
WHERE id = 'contribution_uuid';

-- 5. 查看贡献统计
SELECT * FROM contribution_stats WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- 6. 查找特定类别的贡献
SELECT * FROM prompt_contributions 
WHERE role_category ILIKE '%写作%' 
AND status = 'pending';
*/ 