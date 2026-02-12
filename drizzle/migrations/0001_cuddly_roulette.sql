ALTER TABLE "prompts" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "created_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;