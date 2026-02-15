import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── public_prompts ───────────────────────────────────────────────────────────

export const publicPrompts = pgTable(
  'public_prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    roleCategory: text('role_category').notNull(),
    content: text('content').notNull(),
    category: text('category').default('通用'),
    language: text('language').default('zh'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    likes: integer('likes').default(0),
  },
  (table) => [
    check('chk_public_prompt_title_not_empty', sql`char_length(trim(${table.title})) > 0`),
    check('chk_public_prompt_content_not_empty', sql`char_length(trim(${table.content})) > 0`),
    index('idx_public_prompts_category').on(table.category),
    index('idx_public_prompts_language').on(table.language),
    index('idx_public_prompts_created_at').on(table.createdAt.desc()),
  ]
)

// ─── prompt_likes ─────────────────────────────────────────────────────────────

export const promptLikes = pgTable(
  'prompt_likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => publicPrompts.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('prompt_likes_unique').on(table.promptId, table.userId),
    index('idx_prompt_likes_prompt_id').on(table.promptId),
    index('idx_prompt_likes_user_id').on(table.userId),
  ]
)

// ─── prompt_contributions ─────────────────────────────────────────────────────

export const promptContributions = pgTable(
  'prompt_contributions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    roleCategory: text('role_category').notNull(),
    content: text('content').notNull(),
    language: text('language').default('zh'),
    contributorEmail: text('contributor_email'),
    contributorName: text('contributor_name'),
    status: text('status').notNull().default('pending'),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: text('reviewed_by'),
    publishedPromptId: uuid('published_prompt_id'),
  },
  (table) => [
    check('valid_status', sql`${table.status} IN ('pending', 'approved', 'rejected')`),
    index('idx_prompt_contributions_status').on(table.status),
    index('idx_prompt_contributions_created_at').on(table.createdAt.desc()),
    index('idx_prompt_contributions_role_category').on(table.roleCategory),
  ]
)
