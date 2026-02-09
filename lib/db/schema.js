import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const teamRoleEnum = pgEnum('team_role', ['owner', 'admin', 'member']);
export const teamStatusEnum = pgEnum('team_status', ['pending', 'active', 'left', 'removed', 'blocked']);
export const contributionStatusEnum = pgEnum('contribution_status', ['pending', 'approved', 'rejected']);

// ==================== Teams Table ====================
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),
  isPersonal: boolean('is_personal').default(false).notNull(),
  ownerId: text('owner_id').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Team Members Table ====================
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id'),
  email: text('email'),
  role: teamRoleEnum('role').default('member').notNull(),
  status: teamStatusEnum('status').default('pending').notNull(),
  invitedBy: text('invited_by'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  leftAt: timestamp('left_at', { withTimezone: true }),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Prompts Table ====================
export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(),
  userId: text('user_id').notNull(),
  version: text('version'),
  tags: text('tags'),
  isPublic: boolean('is_public').default(false).notNull(),
  coverImg: text('cover_img'),
  likes: integer('likes').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Public Prompts Table ====================
export const publicPrompts = pgTable('public_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  tags: text('tags'),
  category: text('category'),
  coverImg: text('cover_img'),
  likes: integer('likes').default(0).notNull(),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Tags Table ====================
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Favorites Table ====================
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Likes Table ====================
export const likes = pgTable('likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserLike: sql`UNIQUE(${table.userId}, ${table.promptId})`,
}));

// ==================== Prompt Versions Table ====================
export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  version: text('version').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Contributions Table ====================
export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  promptId: uuid('prompt_id').references(() => prompts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  description: text('description'),
  tags: text('tags'),
  roleCategory: text('role_category'),
  language: text('language').default('zh'),
  contributorEmail: text('contributor_email'),
  contributorName: text('contributor_name'),
  status: contributionStatusEnum('status').default('pending').notNull(),
  adminNote: text('admin_note'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Provider Keys Table ====================
export const providerKeys = pgTable('provider_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  provider: text('provider').notNull(),
  apiKey: text('api_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Feedback Table ====================
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  type: text('type').notNull(),
  description: text('description').notNull(),
  email: text('email'),
  rating: integer('rating'),
  metadata: jsonb('metadata'),
  status: text('status').default('pending').notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==================== Relations ====================
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  prompts: many(prompts),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ one, many }) => ({
  team: one(teams, {
    fields: [prompts.teamId],
    references: [teams.id],
  }),
  versions: many(promptVersions),
  favorites: many(favorites),
  likes: many(likes),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  prompt: one(prompts, {
    fields: [favorites.promptId],
    references: [prompts.id],
  }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  prompt: one(prompts, {
    fields: [likes.promptId],
    references: [prompts.id],
  }),
}));

export const promptVersionsRelations = relations(promptVersions, ({ one }) => ({
  prompt: one(prompts, {
    fields: [promptVersions.promptId],
    references: [prompts.id],
  }),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  prompt: one(prompts, {
    fields: [contributions.promptId],
    references: [prompts.id],
  }),
}));
