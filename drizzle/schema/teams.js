import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─── teams ────────────────────────────────────────────────────────────────────

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    avatarUrl: text('avatar_url'),
    isPersonal: boolean('is_personal').notNull().default(false),
    createdBy: text('created_by').notNull(),
    ownerId: text('owner_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_team_name_not_empty', sql`char_length(trim(${table.name})) > 0`),
    check(
      'chk_personal_owner_matches_creator',
      sql`${table.isPersonal} = false OR ${table.createdBy} = ${table.ownerId}`
    ),
    uniqueIndex('idx_teams_personal_owner')
      .on(table.ownerId)
      .where(sql`${table.isPersonal}`),
    index('idx_teams_owner_id').on(table.ownerId),
    index('idx_teams_created_by').on(table.createdBy),
  ]
)

// ─── team_members ─────────────────────────────────────────────────────────────

export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    email: text('email'),
    role: text('role').notNull(),
    status: text('status').notNull().default('active'),
    invitedBy: text('invited_by'),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    leftAt: timestamp('left_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: text('created_by'),
  },
  (table) => [
    check('chk_role_values', sql`${table.role} IN ('owner', 'admin', 'member')`),
    check(
      'chk_status_values',
      sql`${table.status} IN ('pending', 'active', 'left', 'removed', 'blocked')`
    ),
    check(
      'chk_owner_must_be_active',
      sql`${table.role} <> 'owner' OR ${table.status} = 'active'`
    ),
    uniqueIndex('team_members_team_id_user_id_key').on(table.teamId, table.userId),
    index('idx_team_members_team_id').on(table.teamId),
    index('idx_team_members_user_id').on(table.userId),
    uniqueIndex('idx_team_members_single_owner')
      .on(table.teamId)
      .where(sql`${table.role} = 'owner' AND ${table.status} = 'active'`),
    index('idx_team_members_pending')
      .on(table.teamId)
      .where(sql`${table.status} = 'pending'`),
    index('idx_team_members_email').on(table.email),
  ]
)

// ─── projects ─────────────────────────────────────────────────────────────────

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_project_name_not_empty', sql`char_length(trim(${table.name})) > 0`),
    index('idx_projects_team_id').on(table.teamId),
    index('idx_projects_created_by').on(table.createdBy),
    uniqueIndex('idx_projects_team_name').on(table.teamId, sql`lower(${table.name})`),
  ]
)
