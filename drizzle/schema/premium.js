import { pgTable, uuid, text, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const premiumCollectionInterest = pgTable(
  'premium_collection_interest',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skillSlug: text('skill_slug').notNull(),
    email: text('email').notNull(),
    userId: text('user_id'),
    interestLevel: text('interest_level').notNull().default('notify'),
    source: text('source').notNull().default('/skills'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('premium_interest_level_check', sql`${table.interestLevel} IN ('notify', 'early_access', 'ready_to_buy')`),
    uniqueIndex('premium_interest_email_skill_idx').on(sql`lower(${table.email})`, table.skillSlug),
    index('premium_interest_skill_idx').on(table.skillSlug),
    index('premium_interest_level_idx').on(table.interestLevel),
    index('premium_interest_created_at_idx').on(table.createdAt.desc()),
  ]
)
