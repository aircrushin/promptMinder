import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── user_feedback ────────────────────────────────────────────────────────────

export const userFeedback = pgTable(
  'user_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(),
    description: text('description').notNull(),
    userId: varchar('user_id', { length: 255 }),
    email: varchar('email', { length: 255 }),
    status: varchar('status', { length: 50 }).default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check('user_feedback_type_check', sql`${table.type} IN ('feature_request', 'bug')`),
    check(
      'user_feedback_status_check',
      sql`${table.status} IN ('pending', 'reviewed', 'resolved', 'rejected')`
    ),
    index('idx_feedback_status').on(table.status),
    index('idx_feedback_created_at').on(table.createdAt.desc()),
  ]
)

// ─── provider_keys ────────────────────────────────────────────────────────────

export const providerKeys = pgTable(
  'provider_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    provider: text('provider').notNull(),
    apiKey: text('api_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`timezone('utc', now())`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`timezone('utc', now())`),
  },
  (table) => [
    uniqueIndex('provider_keys_user_provider_idx').on(table.userId, table.provider),
    index('provider_keys_user_idx').on(table.userId),
  ]
)
