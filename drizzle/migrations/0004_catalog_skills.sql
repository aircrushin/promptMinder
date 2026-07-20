CREATE TABLE IF NOT EXISTS "catalog_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "external_id" text NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "source" text NOT NULL,
  "source_type" text NOT NULL,
  "install_url" text,
  "skills_sh_url" text NOT NULL,
  "installs" integer DEFAULT 0 NOT NULL,
  "content" text,
  "files" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "content_hash" text,
  "license_spdx" text,
  "license_url" text,
  "audit_status" text DEFAULT 'unreviewed' NOT NULL,
  "audit_summary" text,
  "is_curated" boolean DEFAULT false NOT NULL,
  "synced_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "catalog_skills_external_id_idx" ON "catalog_skills" USING btree ("external_id");
CREATE INDEX IF NOT EXISTS "catalog_skills_installs_idx" ON "catalog_skills" USING btree ("installs" DESC);
CREATE INDEX IF NOT EXISTS "catalog_skills_name_idx" ON "catalog_skills" USING btree ("name");
CREATE INDEX IF NOT EXISTS "catalog_skills_source_idx" ON "catalog_skills" USING btree ("source");
