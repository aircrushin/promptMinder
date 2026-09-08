import { pgTable, uuid, text, jsonb, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { teams } from './teams.js';
import { promptChangeRequests } from './workflow.js';

export const evaluationSuites = pgTable('evaluation_suites', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull(),
  name: text('name').notNull(),
  cases: jsonb('cases').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('evaluation_suites_scope_idx').on(table.teamId, table.createdBy)]);

export const evaluationReports = pgTable('evaluation_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull(),
  changeRequestId: uuid('change_request_id').references(() => promptChangeRequests.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('running'),
  data: jsonb('data').notNull(),
  reviews: jsonb('reviews').notNull().default({}),
  revision: integer('revision').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('evaluation_reports_scope_idx').on(table.teamId, table.createdBy), index('evaluation_reports_request_idx').on(table.changeRequestId)]);
