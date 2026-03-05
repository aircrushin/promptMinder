import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  unique,
  check,
  jsonb,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { teams, teamMembers } from './teams.js'
import { prompts, promptLineages } from './prompts.js'

// ─── prompt_change_requests ──────────────────────────────────────────────────

export const promptChangeRequests = pgTable(
  'prompt_change_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    lineageId: uuid('lineage_id')
      .notNull()
      .references(() => promptLineages.id, { onDelete: 'cascade' }),
    basePromptId: uuid('base_prompt_id').references(() => prompts.id, { onDelete: 'set null' }),
    requestType: text('request_type').notNull(),
    proposedTitle: text('proposed_title').notNull(),
    proposedContent: text('proposed_content').notNull(),
    proposedDescription: text('proposed_description'),
    proposedTags: text('proposed_tags'),
    proposedVersion: text('proposed_version'),
    proposedProjectId: uuid('proposed_project_id'),
    status: text('status').notNull().default('pending'),
    submitterUserId: text('submitter_user_id').notNull(),
    reviewedByUserId: text('reviewed_by_user_id'),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'chk_prompt_change_request_type',
      sql`${table.requestType} IN ('create_prompt', 'create_version')`
    ),
    check(
      'chk_prompt_change_request_status',
      sql`${table.status} IN ('pending', 'approved', 'rejected', 'withdrawn')`
    ),
    index('idx_prompt_change_requests_team_id').on(table.teamId),
    index('idx_prompt_change_requests_lineage_id').on(table.lineageId),
    index('idx_prompt_change_requests_status').on(table.status),
    index('idx_prompt_change_requests_submitter').on(table.submitterUserId),
    index('idx_prompt_change_requests_created_at').on(table.createdAt.desc()),
  ]
)

// ─── prompt_change_comments ──────────────────────────────────────────────────

export const promptChangeComments = pgTable(
  'prompt_change_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    changeRequestId: uuid('change_request_id')
      .notNull()
      .references(() => promptChangeRequests.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    authorUserId: text('author_user_id').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_prompt_change_comment_not_empty', sql`char_length(trim(${table.content})) > 0`),
    index('idx_prompt_change_comments_change_request_id').on(table.changeRequestId),
    index('idx_prompt_change_comments_team_id').on(table.teamId),
    index('idx_prompt_change_comments_created_at').on(table.createdAt),
  ]
)

// ─── prompt_change_comment_mentions ──────────────────────────────────────────

export const promptChangeCommentMentions = pgTable(
  'prompt_change_comment_mentions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => promptChangeComments.id, { onDelete: 'cascade' }),
    mentionedUserId: text('mentioned_user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_prompt_change_comment_mention').on(table.commentId, table.mentionedUserId),
    index('idx_prompt_change_comment_mentions_comment_id').on(table.commentId),
    index('idx_prompt_change_comment_mentions_user_id').on(table.mentionedUserId),
  ]
)

// ─── prompt_subscriptions ────────────────────────────────────────────────────

export const promptSubscriptions = pgTable(
  'prompt_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    lineageId: uuid('lineage_id')
      .notNull()
      .references(() => promptLineages.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('unique_prompt_subscription').on(table.teamId, table.lineageId, table.userId),
    index('idx_prompt_subscriptions_team_id').on(table.teamId),
    index('idx_prompt_subscriptions_lineage_id').on(table.lineageId),
    index('idx_prompt_subscriptions_user_id').on(table.userId),
  ]
)

// ─── in_app_notifications ────────────────────────────────────────────────────

export const inAppNotifications = pgTable(
  'in_app_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_in_app_notifications_user_id').on(table.userId),
    index('idx_in_app_notifications_team_id').on(table.teamId),
    index('idx_in_app_notifications_is_read').on(table.isRead),
    index('idx_in_app_notifications_created_at').on(table.createdAt.desc()),
  ]
)

// ─── prompt_workflow_events ──────────────────────────────────────────────────

export const promptWorkflowEvents = pgTable(
  'prompt_workflow_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    lineageId: uuid('lineage_id')
      .notNull()
      .references(() => promptLineages.id, { onDelete: 'cascade' }),
    changeRequestId: uuid('change_request_id').references(() => promptChangeRequests.id, {
      onDelete: 'set null',
    }),
    eventType: text('event_type').notNull(),
    actorUserId: text('actor_user_id').notNull(),
    payloadJson: jsonb('payload_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_prompt_workflow_events_team_id').on(table.teamId),
    index('idx_prompt_workflow_events_lineage_id').on(table.lineageId),
    index('idx_prompt_workflow_events_change_request_id').on(table.changeRequestId),
    index('idx_prompt_workflow_events_created_at').on(table.createdAt.desc()),
  ]
)

// Team-member reference helper index table usage to keep imports alive in migrations generation
// eslint-disable-next-line no-unused-vars
const _teamMembersRef = teamMembers
