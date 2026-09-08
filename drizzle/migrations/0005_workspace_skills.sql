ALTER TABLE prompts ADD COLUMN skill_package jsonb;
ALTER TABLE prompt_change_requests ADD COLUMN proposed_skill_package jsonb;
