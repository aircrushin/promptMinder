CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_id TEXT,  -- legacy个人标签关联
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
