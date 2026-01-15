-- 公开提示词表 - 用于存储在public区域展示的提示词
CREATE TABLE IF NOT EXISTS public_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    role_category TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT '通用',
    language TEXT DEFAULT 'zh',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_public_prompt_title_not_empty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT chk_public_prompt_content_not_empty CHECK (char_length(trim(content)) > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_public_prompts_category ON public_prompts(category);
CREATE INDEX IF NOT EXISTS idx_public_prompts_language ON public_prompts(language);
CREATE INDEX IF NOT EXISTS idx_public_prompts_created_at ON public_prompts(created_at DESC);

-- 添加注释
COMMENT ON TABLE public_prompts IS '公开提示词表 - 用于在public页面展示的提示词';
COMMENT ON COLUMN public_prompts.title IS '提示词标题';
COMMENT ON COLUMN public_prompts.role_category IS '角色/类别';
COMMENT ON COLUMN public_prompts.content IS '提示词内容';
COMMENT ON COLUMN public_prompts.category IS '分类';
COMMENT ON COLUMN public_prompts.language IS '语言 (zh/en)';
COMMENT ON COLUMN public_prompts.created_by IS '创建者邮箱';
