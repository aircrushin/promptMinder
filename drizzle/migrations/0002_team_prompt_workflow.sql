ALTER TABLE "teams"
  ADD COLUMN IF NOT EXISTS "approval_enabled" boolean NOT NULL DEFAULT true;

-- Existing teams are migrated with approvals disabled by default.
UPDATE "teams" SET "approval_enabled" = false;

CREATE TABLE IF NOT EXISTS "prompt_lineages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid,
  "name" text NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chk_prompt_lineage_name_not_empty" CHECK (char_length(trim("prompt_lineages"."name")) > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_lineages_team_id_teams_id_fk'
      AND table_name = 'prompt_lineages'
  ) THEN
    ALTER TABLE "prompt_lineages"
      ADD CONSTRAINT "prompt_lineages_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompt_lineages_team_id" ON "prompt_lineages" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_lineages_team_name" ON "prompt_lineages" USING btree ("team_id", lower("name"));

ALTER TABLE "prompts"
  ADD COLUMN IF NOT EXISTS "lineage_id" uuid;

INSERT INTO "prompt_lineages" ("team_id", "name", "created_by", "created_at", "updated_at")
SELECT
  p."team_id",
  p."title",
  COALESCE(MIN(p."created_by"), MIN(p."user_id")),
  MIN(p."created_at"),
  MAX(p."updated_at")
FROM "prompts" p
LEFT JOIN "prompt_lineages" pl
  ON pl."team_id" IS NOT DISTINCT FROM p."team_id"
  AND pl."name" = p."title"
WHERE pl."id" IS NULL
GROUP BY p."team_id", p."title";

UPDATE "prompts" p
SET "lineage_id" = pl."id"
FROM "prompt_lineages" pl
WHERE pl."team_id" IS NOT DISTINCT FROM p."team_id"
  AND pl."name" = p."title"
  AND p."lineage_id" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'prompts_lineage_id_prompt_lineages_id_fk'
      AND table_name = 'prompts'
  ) THEN
    ALTER TABLE "prompts"
      ADD CONSTRAINT "prompts_lineage_id_prompt_lineages_id_fk"
      FOREIGN KEY ("lineage_id") REFERENCES "public"."prompt_lineages"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompts_lineage_id" ON "prompts" USING btree ("lineage_id");

ALTER TABLE "prompts"
  ALTER COLUMN "lineage_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "prompt_change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "lineage_id" uuid NOT NULL,
  "base_prompt_id" uuid,
  "request_type" text NOT NULL,
  "proposed_title" text NOT NULL,
  "proposed_content" text NOT NULL,
  "proposed_description" text,
  "proposed_tags" text,
  "proposed_version" text,
  "proposed_project_id" uuid,
  "status" text DEFAULT 'pending' NOT NULL,
  "submitter_user_id" text NOT NULL,
  "reviewed_by_user_id" text,
  "review_note" text,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chk_prompt_change_request_type" CHECK ("prompt_change_requests"."request_type" IN ('create_prompt', 'create_version')),
  CONSTRAINT "chk_prompt_change_request_status" CHECK ("prompt_change_requests"."status" IN ('pending', 'approved', 'rejected', 'withdrawn'))
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_requests_team_id_teams_id_fk'
      AND table_name = 'prompt_change_requests'
  ) THEN
    ALTER TABLE "prompt_change_requests"
      ADD CONSTRAINT "prompt_change_requests_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_requests_lineage_id_prompt_lineages_id_fk'
      AND table_name = 'prompt_change_requests'
  ) THEN
    ALTER TABLE "prompt_change_requests"
      ADD CONSTRAINT "prompt_change_requests_lineage_id_prompt_lineages_id_fk"
      FOREIGN KEY ("lineage_id") REFERENCES "public"."prompt_lineages"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_requests_base_prompt_id_prompts_id_fk'
      AND table_name = 'prompt_change_requests'
  ) THEN
    ALTER TABLE "prompt_change_requests"
      ADD CONSTRAINT "prompt_change_requests_base_prompt_id_prompts_id_fk"
      FOREIGN KEY ("base_prompt_id") REFERENCES "public"."prompts"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompt_change_requests_team_id" ON "prompt_change_requests" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_requests_lineage_id" ON "prompt_change_requests" USING btree ("lineage_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_requests_status" ON "prompt_change_requests" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_requests_submitter" ON "prompt_change_requests" USING btree ("submitter_user_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_requests_created_at" ON "prompt_change_requests" USING btree ("created_at" DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS "prompt_change_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "change_request_id" uuid NOT NULL,
  "team_id" uuid NOT NULL,
  "author_user_id" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chk_prompt_change_comment_not_empty" CHECK (char_length(trim("prompt_change_comments"."content")) > 0)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_comments_change_request_id_prompt_change_requests_id_fk'
      AND table_name = 'prompt_change_comments'
  ) THEN
    ALTER TABLE "prompt_change_comments"
      ADD CONSTRAINT "prompt_change_comments_change_request_id_prompt_change_requests_id_fk"
      FOREIGN KEY ("change_request_id") REFERENCES "public"."prompt_change_requests"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_comments_team_id_teams_id_fk'
      AND table_name = 'prompt_change_comments'
  ) THEN
    ALTER TABLE "prompt_change_comments"
      ADD CONSTRAINT "prompt_change_comments_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompt_change_comments_change_request_id" ON "prompt_change_comments" USING btree ("change_request_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_comments_team_id" ON "prompt_change_comments" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_comments_created_at" ON "prompt_change_comments" USING btree ("created_at");

CREATE TABLE IF NOT EXISTS "prompt_change_comment_mentions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comment_id" uuid NOT NULL,
  "mentioned_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_change_comment_mentions_comment_id_prompt_change_comments_id_fk'
      AND table_name = 'prompt_change_comment_mentions'
  ) THEN
    ALTER TABLE "prompt_change_comment_mentions"
      ADD CONSTRAINT "prompt_change_comment_mentions_comment_id_prompt_change_comments_id_fk"
      FOREIGN KEY ("comment_id") REFERENCES "public"."prompt_change_comments"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_prompt_change_comment_mention" ON "prompt_change_comment_mentions" USING btree ("comment_id", "mentioned_user_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_comment_mentions_comment_id" ON "prompt_change_comment_mentions" USING btree ("comment_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_change_comment_mentions_user_id" ON "prompt_change_comment_mentions" USING btree ("mentioned_user_id");

CREATE TABLE IF NOT EXISTS "prompt_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "lineage_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_subscriptions_team_id_teams_id_fk'
      AND table_name = 'prompt_subscriptions'
  ) THEN
    ALTER TABLE "prompt_subscriptions"
      ADD CONSTRAINT "prompt_subscriptions_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_subscriptions_lineage_id_prompt_lineages_id_fk'
      AND table_name = 'prompt_subscriptions'
  ) THEN
    ALTER TABLE "prompt_subscriptions"
      ADD CONSTRAINT "prompt_subscriptions_lineage_id_prompt_lineages_id_fk"
      FOREIGN KEY ("lineage_id") REFERENCES "public"."prompt_lineages"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "unique_prompt_subscription" ON "prompt_subscriptions" USING btree ("team_id", "lineage_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_subscriptions_team_id" ON "prompt_subscriptions" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_subscriptions_lineage_id" ON "prompt_subscriptions" USING btree ("lineage_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_subscriptions_user_id" ON "prompt_subscriptions" USING btree ("user_id");

CREATE TABLE IF NOT EXISTS "in_app_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'in_app_notifications_team_id_teams_id_fk'
      AND table_name = 'in_app_notifications'
  ) THEN
    ALTER TABLE "in_app_notifications"
      ADD CONSTRAINT "in_app_notifications_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_user_id" ON "in_app_notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_team_id" ON "in_app_notifications" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_is_read" ON "in_app_notifications" USING btree ("is_read");
CREATE INDEX IF NOT EXISTS "idx_in_app_notifications_created_at" ON "in_app_notifications" USING btree ("created_at" DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS "prompt_workflow_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "lineage_id" uuid NOT NULL,
  "change_request_id" uuid,
  "event_type" text NOT NULL,
  "actor_user_id" text NOT NULL,
  "payload_json" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_workflow_events_team_id_teams_id_fk'
      AND table_name = 'prompt_workflow_events'
  ) THEN
    ALTER TABLE "prompt_workflow_events"
      ADD CONSTRAINT "prompt_workflow_events_team_id_teams_id_fk"
      FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_workflow_events_lineage_id_prompt_lineages_id_fk'
      AND table_name = 'prompt_workflow_events'
  ) THEN
    ALTER TABLE "prompt_workflow_events"
      ADD CONSTRAINT "prompt_workflow_events_lineage_id_prompt_lineages_id_fk"
      FOREIGN KEY ("lineage_id") REFERENCES "public"."prompt_lineages"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prompt_workflow_events_change_request_id_prompt_change_requests_id_fk'
      AND table_name = 'prompt_workflow_events'
  ) THEN
    ALTER TABLE "prompt_workflow_events"
      ADD CONSTRAINT "prompt_workflow_events_change_request_id_prompt_change_requests_id_fk"
      FOREIGN KEY ("change_request_id") REFERENCES "public"."prompt_change_requests"("id")
      ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_prompt_workflow_events_team_id" ON "prompt_workflow_events" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_workflow_events_lineage_id" ON "prompt_workflow_events" USING btree ("lineage_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_workflow_events_change_request_id" ON "prompt_workflow_events" USING btree ("change_request_id");
CREATE INDEX IF NOT EXISTS "idx_prompt_workflow_events_created_at" ON "prompt_workflow_events" USING btree ("created_at" DESC NULLS LAST);
