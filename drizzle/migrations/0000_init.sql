CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"prompt_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_prompt_favorite" UNIQUE("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_project_name_not_empty" CHECK (char_length(trim("projects"."name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "prompt_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"role_category" text NOT NULL,
	"content" text NOT NULL,
	"language" text DEFAULT 'zh',
	"contributor_email" text,
	"contributor_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"published_prompt_id" uuid,
	CONSTRAINT "valid_status" CHECK ("prompt_contributions"."status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "prompt_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_likes_unique" UNIQUE("prompt_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"project_id" uuid,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"user_id" text,
	"version" text,
	"tags" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"cover_img" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_prompt_title_not_empty" CHECK (char_length(trim("prompts"."title")) > 0)
);
--> statement-breakpoint
CREATE TABLE "provider_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"api_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"role_category" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT '通用',
	"language" text DEFAULT 'zh',
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"likes" integer DEFAULT 0,
	CONSTRAINT "chk_public_prompt_title_not_empty" CHECK (char_length(trim("public_prompts"."title")) > 0),
	CONSTRAINT "chk_public_prompt_content_not_empty" CHECK (char_length(trim("public_prompts"."content")) > 0)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"name" text NOT NULL,
	"user_id" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_team_id_user_id_key" UNIQUE("name","team_id","user_id"),
	CONSTRAINT "chk_tag_name_not_empty" CHECK (char_length(trim("tags"."name")) > 0),
	CONSTRAINT "chk_tag_scope" CHECK (("tags"."team_id" IS NOT NULL AND "tags"."user_id" IS NULL) OR ("tags"."team_id" IS NULL AND "tags"."user_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "chk_role_values" CHECK ("team_members"."role" IN ('owner', 'admin', 'member')),
	CONSTRAINT "chk_status_values" CHECK ("team_members"."status" IN ('pending', 'active', 'left', 'removed', 'blocked')),
	CONSTRAINT "chk_owner_must_be_active" CHECK ("team_members"."role" <> 'owner' OR "team_members"."status" = 'active')
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"avatar_url" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_team_name_not_empty" CHECK (char_length(trim("teams"."name")) > 0),
	CONSTRAINT "chk_personal_owner_matches_creator" CHECK ("teams"."is_personal" = false OR "teams"."created_by" = "teams"."owner_id")
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar(255),
	"email" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_feedback_type_check" CHECK ("user_feedback"."type" IN ('feature_request', 'bug')),
	CONSTRAINT "user_feedback_status_check" CHECK ("user_feedback"."status" IN ('pending', 'reviewed', 'resolved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_likes" ADD CONSTRAINT "prompt_likes_prompt_id_public_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."public_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_favorites_user_id" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_prompt_id" ON "favorites" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_created_at" ON "favorites" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_projects_team_id" ON "projects" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_projects_created_by" ON "projects" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_projects_team_name" ON "projects" USING btree ("team_id",lower("name"));--> statement-breakpoint
CREATE INDEX "idx_prompt_contributions_status" ON "prompt_contributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prompt_contributions_created_at" ON "prompt_contributions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_prompt_contributions_role_category" ON "prompt_contributions" USING btree ("role_category");--> statement-breakpoint
CREATE INDEX "idx_prompt_likes_prompt_id" ON "prompt_likes" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_likes_user_id" ON "prompt_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_team_id" ON "prompts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_prompts_created_by" ON "prompts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_prompts_project_id" ON "prompts" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_keys_user_provider_idx" ON "provider_keys" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "provider_keys_user_idx" ON "provider_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_public_prompts_category" ON "public_prompts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_public_prompts_language" ON "public_prompts" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_public_prompts_created_at" ON "public_prompts" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_tags_team_id" ON "tags" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_tags_user_id" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_team_id" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_user_id" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_team_members_single_owner" ON "team_members" USING btree ("team_id") WHERE "team_members"."role" = 'owner' AND "team_members"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_team_members_pending" ON "team_members" USING btree ("team_id") WHERE "team_members"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_team_members_email" ON "team_members" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teams_personal_owner" ON "teams" USING btree ("owner_id") WHERE "teams"."is_personal";--> statement-breakpoint
CREATE INDEX "idx_teams_owner_id" ON "teams" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_teams_created_by" ON "teams" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "user_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_created_at" ON "user_feedback" USING btree ("created_at" DESC NULLS LAST);