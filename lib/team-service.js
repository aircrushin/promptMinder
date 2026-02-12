import { ApiError, assert } from './api-error.js'
import { eq, and, inArray, count } from 'drizzle-orm'
import { teams, teamMembers } from '@/drizzle/schema/index.js'
import { toSnakeCase } from './case-utils.js'

export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
}

export const TEAM_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  LEFT: 'left',
  REMOVED: 'removed',
  BLOCKED: 'blocked'
}

const MANAGER_ROLES = [TEAM_ROLES.OWNER, TEAM_ROLES.ADMIN]
const ACTIVE_ROLES = [TEAM_ROLES.MEMBER, TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER]

export class TeamService {
  constructor(db) {
    this.db = db
  }

  async getPersonalTeam(userId) {
    const rows = await this.db
      .select()
      .from(teams)
      .where(and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)))
      .limit(1)

    return rows[0] ? toSnakeCase(rows[0]) : null
  }

  async ensureOwnerMembership(teamId, userId) {
    const rows = await this.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1)

    const existing = rows[0] || null

    if (!existing) {
      const timestamp = new Date()
      await this.db.insert(teamMembers).values({
        teamId,
        userId,
        role: TEAM_ROLES.OWNER,
        status: TEAM_STATUSES.ACTIVE,
        joinedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userId,
      })
      return
    }

    if (existing.role !== TEAM_ROLES.OWNER || existing.status !== TEAM_STATUSES.ACTIVE) {
      await this.db
        .update(teamMembers)
        .set({
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
          joinedAt: existing.joinedAt || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, existing.id))
    }
  }

  async ensurePersonalTeam(userId) {
    let personalTeam = await this.getPersonalTeam(userId)
    if (personalTeam) {
      await this.ensureOwnerMembership(personalTeam.id, userId)
      return personalTeam
    }

    personalTeam = await this.createTeam({
      name: 'Personal workspace',
      description: 'Auto-generated personal space',
      avatarUrl: null,
      isPersonal: true,
    }, userId)

    return personalTeam
  }

  async listTeamsForUser(userId, { includePending = false } = {}) {
    const statuses = includePending ? [TEAM_STATUSES.ACTIVE, TEAM_STATUSES.PENDING] : [TEAM_STATUSES.ACTIVE]

    const rows = await this.db
      .select({
        id: teamMembers.id,
        role: teamMembers.role,
        status: teamMembers.status,
        userId: teamMembers.userId,
        invitedAt: teamMembers.invitedAt,
        joinedAt: teamMembers.joinedAt,
        createdAt: teamMembers.createdAt,
        teamId: teams.id,
        teamName: teams.name,
        teamDescription: teams.description,
        teamAvatarUrl: teams.avatarUrl,
        teamIsPersonal: teams.isPersonal,
        teamOwnerId: teams.ownerId,
        teamCreatedBy: teams.createdBy,
        teamCreatedAt: teams.createdAt,
        teamUpdatedAt: teams.updatedAt,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teamMembers.userId, userId), inArray(teamMembers.status, statuses)))
      .orderBy(teamMembers.createdAt)

    return rows.map((row) => ({
      membershipId: row.id,
      role: row.role,
      status: row.status,
      userId: row.userId,
      invitedAt: row.invitedAt,
      joinedAt: row.joinedAt,
      team: {
        id: row.teamId,
        name: row.teamName,
        description: row.teamDescription,
        avatar_url: row.teamAvatarUrl,
        is_personal: row.teamIsPersonal,
        owner_id: row.teamOwnerId,
        created_by: row.teamCreatedBy,
        created_at: row.teamCreatedAt,
        updated_at: row.teamUpdatedAt,
      }
    }))
  }

  async getTeam(teamId) {
    const rows = await this.db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)

    if (!rows[0]) {
      throw new ApiError(404, 'Team not found')
    }

    return toSnakeCase(rows[0])
  }

  async getTeamMembership(teamId, userId) {
    const rows = await this.db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1)

    return rows[0] ? toSnakeCase(rows[0]) : null
  }

  async requireMembership(teamId, userId, { allowStatuses = [TEAM_STATUSES.ACTIVE], allowRoles = ACTIVE_ROLES } = {}) {
    const membership = await this.getTeamMembership(teamId, userId)

    if (!membership) {
      throw new ApiError(403, 'You are not a member of this team')
    }

    assert(allowStatuses.includes(membership.status), 403, 'Your membership status prohibits this action')
    assert(allowRoles.includes(membership.role), 403, 'Insufficient permissions for this action')

    return membership
  }

  async assertManager(teamId, userId) {
    return this.requireMembership(teamId, userId, {
      allowRoles: MANAGER_ROLES
    })
  }

  async assertOwner(teamId, userId) {
    return this.requireMembership(teamId, userId, {
      allowRoles: [TEAM_ROLES.OWNER]
    })
  }

  async createTeam({ name, description = null, avatarUrl = null, isPersonal = false }, ownerId) {
    assert(name && name.trim().length > 0, 400, 'Team name is required')

    if (isPersonal) {
      await this.ensureNoPersonalTeam(ownerId)
    } else {
      const result = await this.db
        .select({ value: count() })
        .from(teams)
        .where(eq(teams.ownerId, ownerId))

      const teamCount = result[0]?.value || 0

      if (teamCount >= 2) {
        throw new ApiError(403, 'You have reached the maximum limit of 2 teams')
      }
    }

    const inserted = await this.db
      .insert(teams)
      .values({
        name: name.trim(),
        description,
        avatarUrl,
        isPersonal,
        createdBy: ownerId,
        ownerId,
      })
      .returning()

    const team = toSnakeCase(inserted[0])

    try {
      await this.db.insert(teamMembers).values({
        teamId: team.id,
        userId: ownerId,
        role: TEAM_ROLES.OWNER,
        status: TEAM_STATUSES.ACTIVE,
        joinedAt: new Date(),
        createdBy: ownerId,
      })
    } catch (memberError) {
      await this.db.delete(teams).where(eq(teams.id, team.id))
      throw new ApiError(500, 'Failed to create team membership', memberError.message)
    }

    return team
  }

  async ensureNoPersonalTeam(userId) {
    const rows = await this.db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.ownerId, userId), eq(teams.isPersonal, true)))
      .limit(1)

    if (rows[0]) {
      throw new ApiError(409, 'Personal team already exists')
    }
  }

  async updateTeam(teamId, updates, actorUserId) {
    await this.assertManager(teamId, actorUserId)

    const allowedFields = ['name', 'description', 'avatar_url']
    const sanitized = {}
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        sanitized[field] = updates[field]
      }
    }

    if (sanitized.name && sanitized.name.trim().length === 0) {
      throw new ApiError(400, 'Team name cannot be empty')
    }

    if (Object.keys(sanitized).length === 0) {
      const team = await this.getTeam(teamId)
      return team
    }

    if (sanitized.name) {
      sanitized.name = sanitized.name.trim()
    }

    // Convert snake_case keys to camelCase for Drizzle
    const drizzleSet = { updatedAt: new Date() }
    if (sanitized.name !== undefined) drizzleSet.name = sanitized.name
    if (sanitized.description !== undefined) drizzleSet.description = sanitized.description
    if (sanitized.avatar_url !== undefined) drizzleSet.avatarUrl = sanitized.avatar_url

    const result = await this.db
      .update(teams)
      .set(drizzleSet)
      .where(eq(teams.id, teamId))
      .returning()

    if (!result[0]) {
      throw new ApiError(404, 'Team not found or was deleted')
    }

    return toSnakeCase(result[0])
  }

  async deleteTeam(teamId, actorUserId) {
    await this.assertOwner(teamId, actorUserId)

    await this.db.delete(teams).where(eq(teams.id, teamId))
  }

  async inviteMember(teamId, actorUserId, { userId, email, role = TEAM_ROLES.MEMBER }) {
    assert(userId, 400, 'Target user is required')
    assert(email, 400, 'Target email is required')

    const team = await this.getTeam(teamId)
    assert(!team.is_personal, 400, 'Cannot invite members to personal teams')

    await this.assertManager(teamId, actorUserId)

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await this.getTeamMembership(teamId, userId)
    const timestamp = new Date()

    if (existing) {
      if (existing.status === TEAM_STATUSES.PENDING) {
        const result = await this.db
          .update(teamMembers)
          .set({
            role,
            invitedBy: actorUserId,
            invitedAt: timestamp,
            updatedAt: timestamp,
            email: normalizedEmail,
            userId,
          })
          .where(eq(teamMembers.id, existing.id))
          .returning()

        return toSnakeCase(result[0])
      }

      if (existing.status === TEAM_STATUSES.ACTIVE) {
        throw new ApiError(409, 'User is already a team member')
      }

      const result = await this.db
        .update(teamMembers)
        .set({
          role,
          status: TEAM_STATUSES.PENDING,
          invitedBy: actorUserId,
          invitedAt: timestamp,
          joinedAt: null,
          leftAt: null,
          updatedAt: timestamp,
          email: normalizedEmail,
          userId,
        })
        .where(eq(teamMembers.id, existing.id))
        .returning()

      return toSnakeCase(result[0])
    }

    const result = await this.db
      .insert(teamMembers)
      .values({
        teamId,
        userId,
        email: normalizedEmail,
        role,
        status: TEAM_STATUSES.PENDING,
        invitedBy: actorUserId,
        invitedAt: timestamp,
        createdBy: actorUserId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()

    return toSnakeCase(result[0])
  }

  async acceptInvite(teamId, userId, userEmail = null) {
    let membership = await this.getTeamMembership(teamId, userId)

    if (!membership && userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase()
      const rows = await this.db
        .select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.email, normalizedEmail),
          eq(teamMembers.status, TEAM_STATUSES.PENDING)
        ))
        .limit(1)

      membership = rows[0] ? toSnakeCase(rows[0]) : null
    }

    if (!membership) {
      throw new ApiError(404, 'Invite not found')
    }

    assert(membership.status === TEAM_STATUSES.PENDING, 409, 'Invite is no longer pending')

    const timestamp = new Date()
    const updates = {
      status: TEAM_STATUSES.ACTIVE,
      joinedAt: timestamp,
      updatedAt: timestamp,
    }

    if (!membership.user_id) {
      updates.userId = userId
    }

    if (userEmail && !membership.email) {
      updates.email = userEmail.trim().toLowerCase()
    }

    const result = await this.db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, membership.id))
      .returning()

    return toSnakeCase(result[0])
  }

  async updateMember(teamId, targetUserId, actorUserId, { role, status }) {
    const actorMembership = await this.assertManager(teamId, actorUserId)

    const membership = await this.getTeamMembership(teamId, targetUserId)
    if (!membership) {
      throw new ApiError(404, 'Team member not found')
    }

    if (membership.user_id === actorUserId && role && role !== membership.role) {
      throw new ApiError(400, 'Use ownership transfer or leave actions for yourself')
    }

    const updates = { updatedAt: new Date() }

    if (role) {
      if (!MANAGER_ROLES.includes(actorMembership.role)) {
        throw new ApiError(403, 'Only admins or owners can change roles')
      }
      if (!ACTIVE_ROLES.includes(role)) {
        throw new ApiError(400, 'Invalid role specified')
      }
      if (membership.role === TEAM_ROLES.OWNER && role !== TEAM_ROLES.OWNER) {
        throw new ApiError(400, 'Use ownership transfer to change owner role')
      }
      updates.role = role
    }

    if (status) {
      if (status === TEAM_STATUSES.ACTIVE && membership.status === TEAM_STATUSES.PENDING && membership.user_id === actorUserId) {
        throw new ApiError(400, 'Self-activation handled via accept endpoint')
      }
      if (status === TEAM_STATUSES.ACTIVE && membership.status === TEAM_STATUSES.PENDING) {
        updates.status = TEAM_STATUSES.ACTIVE
        updates.joinedAt = new Date()
      } else if (status === TEAM_STATUSES.PENDING) {
        updates.status = TEAM_STATUSES.PENDING
        updates.joinedAt = null
      } else if (status === TEAM_STATUSES.BLOCKED) {
        updates.status = TEAM_STATUSES.BLOCKED
        updates.leftAt = new Date()
      } else if ([TEAM_STATUSES.LEFT, TEAM_STATUSES.REMOVED].includes(status)) {
        updates.status = status
        updates.leftAt = new Date()
      } else {
        throw new ApiError(400, 'Unsupported status transition')
      }
    }

    const result = await this.db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, membership.id))
      .returning()

    return toSnakeCase(result[0])
  }

  async removeMember(teamId, targetUserId, actorUserId) {
    if (targetUserId === actorUserId) {
      const membership = await this.requireMembership(teamId, targetUserId, {
        allowRoles: ACTIVE_ROLES
      })

      if (membership.role === TEAM_ROLES.OWNER) {
        throw new ApiError(400, 'Transfer ownership before leaving the team')
      }

      const result = await this.db
        .update(teamMembers)
        .set({
          status: TEAM_STATUSES.LEFT,
          leftAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(teamMembers.id, membership.id))
        .returning()

      return toSnakeCase(result[0])
    }

    await this.assertManager(teamId, actorUserId)

    const membership = await this.getTeamMembership(teamId, targetUserId)
    if (!membership) {
      throw new ApiError(404, 'Team member not found')
    }

    if (membership.role === TEAM_ROLES.OWNER) {
      throw new ApiError(403, 'Cannot remove the team owner')
    }

    const result = await this.db
      .update(teamMembers)
      .set({
        status: TEAM_STATUSES.REMOVED,
        leftAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, membership.id))
      .returning()

    return toSnakeCase(result[0])
  }

  async transferOwnership(teamId, actorUserId, targetUserId) {
    assert(targetUserId, 400, 'Target user is required')
    const actorMembership = await this.assertOwner(teamId, actorUserId)

    const targetMembership = await this.getTeamMembership(teamId, targetUserId)
    if (!targetMembership || targetMembership.status !== TEAM_STATUSES.ACTIVE) {
      throw new ApiError(400, 'New owner must be an active team member')
    }

    const timestamp = new Date()

    // Demote current owner first
    await this.db
      .update(teamMembers)
      .set({ role: TEAM_ROLES.ADMIN, updatedAt: timestamp })
      .where(eq(teamMembers.id, actorMembership.id))

    try {
      await this.db
        .update(teamMembers)
        .set({ role: TEAM_ROLES.OWNER, status: TEAM_STATUSES.ACTIVE, updatedAt: timestamp })
        .where(eq(teamMembers.id, targetMembership.id))
    } catch (promoteError) {
      // Try to revert
      await this.db
        .update(teamMembers)
        .set({ role: TEAM_ROLES.OWNER, updatedAt: new Date() })
        .where(eq(teamMembers.id, actorMembership.id))
      throw new ApiError(500, 'Failed to promote new owner', promoteError.message)
    }

    try {
      await this.db
        .update(teams)
        .set({ ownerId: targetUserId, updatedAt: timestamp })
        .where(eq(teams.id, teamId))
    } catch (teamUpdateError) {
      // Attempt to revert
      await this.db
        .update(teamMembers)
        .set({ role: TEAM_ROLES.OWNER, updatedAt: new Date() })
        .where(eq(teamMembers.id, actorMembership.id))
      await this.db
        .update(teamMembers)
        .set({ role: targetMembership.role, updatedAt: new Date() })
        .where(eq(teamMembers.id, targetMembership.id))
      throw new ApiError(500, 'Failed to update team owner', teamUpdateError.message)
    }
  }
}
