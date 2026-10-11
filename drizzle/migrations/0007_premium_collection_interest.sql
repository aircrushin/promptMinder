CREATE TABLE IF NOT EXISTS "premium_collection_interest" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "skill_slug" text NOT NULL,
  "email" text NOT NULL,
  "user_id" text,
  "interest_level" text DEFAULT 'notify' NOT NULL,
  "source" text DEFAULT '/skills' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "premium_interest_level_check" CHECK ("premium_collection_interest"."interest_level" IN ('notify', 'early_access', 'ready_to_buy'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "premium_interest_email_skill_idx" ON "premium_collection_interest" USING btree (lower("email"), "skill_slug");
CREATE INDEX IF NOT EXISTS "premium_interest_skill_idx" ON "premium_collection_interest" USING btree ("skill_slug");
CREATE INDEX IF NOT EXISTS "premium_interest_level_idx" ON "premium_collection_interest" USING btree ("interest_level");
CREATE INDEX IF NOT EXISTS "premium_interest_created_at_idx" ON "premium_collection_interest" USING btree ("created_at" DESC);
