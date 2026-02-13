import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Re-export inferred types from schema (available after Phase 2 migration)
// For now, define manually based on schema structure

// ─── Team Types ──────────────────────────────────────────────────────────────

export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamMemberStatus = 'pending' | 'active' | 'left' | 'removed' | 'blocked';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_personal: boolean;
  created_by: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string | null;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_by: string | null;
  invited_at: Date | null;
  joined_at: Date | null;
  left_at: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
}

export interface TeamWithMembership {
  membershipId: string;
  role: TeamRole;
  status: TeamMemberStatus;
  userId: string;
  invitedAt: Date | null;
  joinedAt: Date | null;
  team: Team;
}

// ─── Project Types ───────────────────────────────────────────────────────────

export interface Project {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// ─── Prompt Types ────────────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  team_id: string | null;
  project_id: string | null;
  title: string;
  content: string;
  description: string | null;
  created_by: string | null;
  user_id: string | null;
  version: string | null;
  tags: string | null;
  is_public: boolean;
  cover_img: string | null;
  likes: number;
  created_at: Date;
  updated_at: Date;
}

// ─── Tag Types ───────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  team_id: string | null;
  name: string;
  user_id: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Favorite Types ──────────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  user_id: string;
  prompt_id: string;
  created_at: Date;
}

// ─── Public Prompt Types ─────────────────────────────────────────────────────

export interface PublicPrompt {
  id: string;
  title: string;
  role_category: string;
  content: string;
  category: string | null;
  language: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  likes: number | null;
}

export interface PromptLike {
  id: string;
  prompt_id: string;
  user_id: string;
  created_at: Date;
}

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface PromptContribution {
  id: string;
  title: string;
  role_category: string;
  content: string;
  language: string | null;
  contributor_email: string | null;
  contributor_name: string | null;
  status: ContributionStatus;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  published_prompt_id: string | null;
}

// ─── User Types ──────────────────────────────────────────────────────────────

export type FeedbackType = 'feature_request' | 'bug';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved' | 'rejected';

export interface UserFeedback {
  id: string;
  type: FeedbackType;
  description: string;
  user_id: string | null;
  email: string | null;
  status: FeedbackStatus | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ProviderKey {
  id: string;
  user_id: string;
  provider: string;
  api_key: string;
  created_at: Date;
  updated_at: Date;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiErrorType {
  status: number;
  message: string;
  details?: unknown;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Team Context Types ──────────────────────────────────────────────────────

export interface ResolveTeamContextOptions {
  requireMembership?: boolean;
  allowMissingTeam?: boolean;
  allowedRoles?: TeamRole[];
  allowedStatuses?: TeamMemberStatus[];
}

export interface TeamContext {
  teamId: string | null;
  membership: TeamMember | null;
  db: any;
  teamService: any;
}

// ─── Toast Types ─────────────────────────────────────────────────────────────

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// ─── Language Types ──────────────────────────────────────────────────────────

export type Language = 'zh' | 'en';
