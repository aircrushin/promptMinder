-- public_tags 表：存储公共标签，所有用户都可以使用
CREATE TABLE IF NOT EXISTS public_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_public_tags_category ON public_tags(category);
CREATE INDEX IF NOT EXISTS idx_public_tags_is_active ON public_tags(is_active);
CREATE INDEX IF NOT EXISTS idx_public_tags_sort_order ON public_tags(sort_order);

-- 插入常用提示词标签
INSERT INTO public_tags (name, description, category, sort_order) VALUES
-- 通用类别
('Chatbot', '聊天机器人相关提示词', 'general', 1),
('Writing', '写作辅助提示词', 'general', 2),
('Translation', '翻译相关提示词', 'general', 3),
('Summarization', '文本摘要提示词', 'general', 4),
('Analysis', '分析类提示词', 'general', 5),

-- 角色类别
('Roleplay', '角色扮演提示词', 'role', 10),
('Expert', '专家角色提示词', 'role', 11),
('Assistant', '助手角色提示词', 'role', 12),
('Mentor', '导师角色提示词', 'role', 13),

-- 内容创作类别
('Creative', '创意写作提示词', 'content', 20),
('Marketing', '营销文案提示词', 'content', 21),
('Social Media', '社交媒体提示词', 'content', 22),
('Email', '邮件写作提示词', 'content', 23),
('Blog', '博客文章提示词', 'content', 24),
('Story', '故事创作提示词', 'content', 25),

-- 技术类别
('Coding', '编程辅助提示词', 'tech', 30),
('Debug', '调试排错提示词', 'tech', 31),
('Code Review', '代码审查提示词', 'tech', 32),
('Documentation', '文档生成提示词', 'tech', 33),
('SQL', '数据库相关提示词', 'tech', 34),

-- 学习类别
('Learning', '学习辅助提示词', 'education', 40),
('Explanation', '概念解释提示词', 'education', 41),
('Quiz', '测验生成提示词', 'education', 42),
('Study Plan', '学习计划提示词', 'education', 43),

-- 商业类别
('Business', '商业分析提示词', 'business', 50),
('Strategy', '战略规划提示词', 'business', 51),
('Research', '市场研究提示词', 'business', 52),
('Presentation', '演示文稿提示词', 'business', 53),

-- 生活类别
('Health', '健康生活提示词', 'lifestyle', 60),
('Fitness', '健身运动提示词', 'lifestyle', 61),
('Cooking', '烹饪食谱提示词', 'lifestyle', 62),
('Travel', '旅行规划提示词', 'lifestyle', 63),

-- 其他类别
('Fun', '娱乐趣味提示词', 'other', 70),
('Brainstorming', '头脑风暴提示词', 'other', 71),
('Decision', '决策辅助提示词', 'other', 72),
('Productivity', '效率提升提示词', 'other', 73)
ON CONFLICT (name) DO NOTHING;
