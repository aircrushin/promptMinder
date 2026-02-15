import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { teams, projects } from './teams'

// ─── prompts ──────────────────────────────────────────────────────────────────

export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    description: text('description'),
    createdBy: text('created_by'),
    userId: text('user_id'),
    version: text('version'),
    tags: text('tags'),
    isPublic: boolean('is_public').notNull().default(false),
    coverImg: text('cover_img'),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_prompt_title_not_empty', sql`char_length(trim(${table.title})) > 0`),
    index('idx_prompts_team_id').on(table.teamId),
    index('idx_prompts_created_by').on(table.createdBy),
    index('idx_prompts_project_id').on(table.projectId),
  ]
)

// ─── tags ─────────────────────────────────────────────────────────────────────

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    userId: text('user_id'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('tags_name_team_id_user_id_key').on(table.name, table.teamId, table.userId),
    check('chk_tag_name_not_empty', sql`char_length(trim(${table.name})) > 0`),
    check(
      'chk_tag_scope',
      sql`(${table.teamId} IS NOT NULL AND ${table.userId} IS NULL) OR (${table.teamId} IS NULL AND ${table.userId} IS NOT NULL)`
    ),
    index('idx_tags_team_id').on(table.teamId),
    index('idx_tags_user_id').on(table.userId),
  ]
)

// ─── favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    promptId: uuid('prompt_id')
      .notNull()
      .references(() => prompts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_user_prompt_favorite').on(table.userId, table.promptId),
    index('idx_favorites_user_id').on(table.userId),
    index('idx_favorites_prompt_id').on(table.promptId),
    index('idx_favorites_created_at').on(table.createdAt.desc()),
  ]
)
