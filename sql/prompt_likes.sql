-- 用户点赞表 - 用于跟踪用户对提示词的点赞
CREATE TABLE IF NOT EXISTS prompt_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES public_prompts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT prompt_likes_unique UNIQUE(prompt_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_likes_user_id ON prompt_likes(user_id);

-- 添加注释
COMMENT ON TABLE prompt_likes IS '用户点赞表 - 用于跟踪用户对提示词的点赞';
COMMENT ON COLUMN prompt_likes.prompt_id IS '提示词ID';
COMMENT ON COLUMN prompt_likes.user_id IS '用户ID (Clerk user ID)';
COMMENT ON COLUMN prompt_likes.created_at IS '点赞时间';
