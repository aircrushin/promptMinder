import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const catalogSkills = pgTable(
  'catalog_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    externalId: text('external_id').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    source: text('source').notNull(),
    sourceType: text('source_type').notNull(),
    installUrl: text('install_url'),
    skillsShUrl: text('skills_sh_url').notNull(),
    installs: integer('installs').notNull().default(0),
    content: text('content'),
    files: jsonb('files').notNull().default(sql`'[]'::jsonb`),
    contentHash: text('content_hash'),
    licenseSpdx: text('license_spdx'),
    licenseUrl: text('license_url'),
    auditStatus: text('audit_status').notNull().default('unreviewed'),
    auditSummary: text('audit_summary'),
    isCurated: boolean('is_curated').notNull().default(false),
    syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('catalog_skills_external_id_idx').on(table.externalId),
    index('catalog_skills_installs_idx').on(table.installs.desc()),
    index('catalog_skills_name_idx').on(table.name),
    index('catalog_skills_source_idx').on(table.source),
  ]
)
