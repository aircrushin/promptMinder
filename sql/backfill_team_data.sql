-- Backfill script for migrating existing data to team-based schema
-- Note: Users are allowed to have no team. We do NOT auto-create
-- personal teams for users who don't have one. Existing teams will
-- still be linked where possible.

-- 1. Ensure memberships exist for all team owners.
INSERT INTO team_members (team_id, user_id, role, status, joined_at, created_by)
SELECT t.id, t.owner_id, 'owner', 'active', COALESCE(t.created_at, NOW()), t.created_by
FROM teams t
WHERE NOT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = t.id
      AND tm.user_id = t.owner_id
);

-- 2. Assign prompts to teams by matching owner personal teams.
UPDATE prompts p
SET team_id = t.id,
    created_by = COALESCE(p.created_by, p.user_id)
FROM teams t
WHERE t.owner_id = COALESCE(p.created_by, p.user_id)
  AND t.is_personal
  AND (p.team_id IS NULL OR p.team_id = t.id);

-- 3. Assign projects to teams.
UPDATE projects pr
SET team_id = t.id,
    created_by = COALESCE(pr.created_by, t.owner_id)
FROM teams t
WHERE pr.team_id IS NULL
  AND COALESCE(pr.created_by, t.owner_id) = t.owner_id
  AND t.is_personal;

-- 4. Assign tags to teams when they were previously user-specific.
UPDATE tags tg
SET team_id = t.id,
    created_by = COALESCE(tg.created_by, tg.user_id)
FROM teams t
WHERE t.owner_id = COALESCE(tg.created_by, tg.user_id)
  AND t.is_personal
  AND tg.team_id IS NULL;

-- 5. Default created_by on prompts/projects if missing.
UPDATE prompts SET created_by = user_id WHERE created_by IS NULL;
UPDATE projects pr
SET created_by = tm.user_id
FROM team_members tm
WHERE pr.created_by IS NULL
  AND tm.team_id = pr.team_id
  AND tm.role = 'owner';
UPDATE tags SET created_by = COALESCE(created_by, user_id);

-- 6. Mark orphaned rows for manual review (example of detection query).
-- SELECT id FROM prompts WHERE team_id IS NULL;
-- SELECT id FROM projects WHERE team_id IS NULL;
-- SELECT id FROM tags WHERE team_id IS NULL;
