import { ApiError, assert } from './api-error.js'
import { TEAM_CONFIG } from './constants.js'

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
  constructor(supabase) {
    this.supabase = supabase
  }

  async getPersonalTeam(userId) {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_personal', true)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Failed to load personal team', error.message)
    }

    return data || null
  }

  async ensureOwnerMembership(teamId, userId) {
    const { data, error } = await this.supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Failed to verify owner membership', error.message)
    }

    if (!data) {
      const timestamp = new Date().toISOString()
      const { error: insertError } = await this.supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: userId,
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
          joined_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp,
          created_by: userId,
        }])

      if (insertError) {
        throw new ApiError(500, 'Failed to ensure owner membership', insertError.message)
      }

      return
    }

    if (data.role !== TEAM_ROLES.OWNER || data.status !== TEAM_STATUSES.ACTIVE) {
      const { error: updateError } = await this.supabase
        .from('team_members')
        .update({
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
          joined_at: data.joined_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      if (updateError) {
        throw new ApiError(500, 'Failed to normalize owner membership', updateError.message)
      }
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

    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        id,
        role,
        status,
        user_id,
        invited_at,
        joined_at,
        team:teams (
          id,
          name,
          description,
          avatar_url,
          is_personal,
          owner_id,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .in('status', statuses)
      .order('created_at', { ascending: true })

    if (error) {
      throw new ApiError(500, 'Failed to load teams', error.message)
    }

    return (data || []).map((row) => ({
      membershipId: row.id,
      role: row.role,
      status: row.status,
      userId: row.user_id,
      invitedAt: row.invited_at,
      joinedAt: row.joined_at,
      team: row.team
    }))
  }

  async getTeam(teamId) {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Failed to load team', error.message)
    }

    if (!data) {
      throw new ApiError(404, 'Team not found')
    }

    return data
  }

  async getTeamMembership(teamId, userId) {
    const { data, error } = await this.supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Failed to verify team membership', error.message)
    }

    return data || null
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
      // Check team limit for non-personal teams
      const { count, error } = await this.supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
      
      if (error) {
        throw new ApiError(500, 'Failed to check team limit', error.message)
      }

      if (count >= TEAM_CONFIG.MAX_TEAMS_PER_USER) {
        throw new ApiError(403, `You have reached the maximum limit of ${TEAM_CONFIG.MAX_TEAMS_PER_USER} teams`)
      }
    }

    const insertPayload = {
      name: name.trim(),
      description,
      avatar_url: avatarUrl,
      is_personal: isPersonal,
      created_by: ownerId,
      owner_id: ownerId
    }

    const { data: teamRows, error: createError } = await this.supabase
      .from('teams')
      .insert([insertPayload])
      .select()
      .single()

    if (createError) {
      throw new ApiError(500, 'Failed to create team', createError.message)
    }

    const team = teamRows

    const membershipPayload = {
      team_id: team.id,
      user_id: ownerId,
      role: TEAM_ROLES.OWNER,
      status: TEAM_STATUSES.ACTIVE,
      joined_at: new Date().toISOString(),
      created_by: ownerId
    }

    const { error: memberError } = await this.supabase
      .from('team_members')
      .insert([membershipPayload])

    if (memberError) {
      // Best effort rollback so we do not leave orphan teams without owner membership
      await this.supabase.from('teams').delete().eq('id', team.id)
      throw new ApiError(500, 'Failed to create team membership', memberError.message)
    }

    return team
  }

  async ensureNoPersonalTeam(userId) {
    const { data, error } = await this.supabase
      .from('teams')
      .select('id')
      .eq('owner_id', userId)
      .eq('is_personal', true)
      .maybeSingle()

    if (error) {
      throw new ApiError(500, 'Unable to verify personal team status', error.message)
    }

    if (data) {
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

    sanitized.updated_at = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('teams')
      .update(sanitized)
      .eq('id', teamId)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to update team', error.message)
    }

    return data
  }

  async deleteTeam(teamId, actorUserId) {
    await this.assertOwner(teamId, actorUserId)

    const { error } = await this.supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (error) {
      throw new ApiError(500, 'Failed to delete team', error.message)
    }
  }

  async inviteMember(teamId, actorUserId, { userId, email, role = TEAM_ROLES.MEMBER }) {
    assert(userId, 400, 'Target user is required')

    const team = await this.getTeam(teamId)
    assert(!team.is_personal, 400, 'Cannot invite members to personal teams')

    await this.assertManager(teamId, actorUserId)

    const normalizedEmail = email ? email.trim().toLowerCase() : null

    const existing = await this.getTeamMembership(teamId, userId)
    const timestamp = new Date().toISOString()

    if (existing) {
      if (existing.status === TEAM_STATUSES.PENDING) {
        const { data, error } = await this.supabase
          .from('team_members')
          .update({
            role,
            invited_by: actorUserId,
            invited_at: timestamp,
            updated_at: timestamp,
            email: normalizedEmail,
            user_id: userId
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          throw new ApiError(500, 'Failed to refresh invite', error.message)
        }

        return data
      }

      if (existing.status === TEAM_STATUSES.ACTIVE) {
        throw new ApiError(409, 'User is already a team member')
      }

      const { data, error } = await this.supabase
        .from('team_members')
        .update({
          role,
          status: TEAM_STATUSES.PENDING,
          invited_by: actorUserId,
          invited_at: timestamp,
          joined_at: null,
          left_at: null,
          updated_at: timestamp,
          email: normalizedEmail,
          user_id: userId
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw new ApiError(500, 'Failed to re-invite user', error.message)
      }

      return data
    }

    const payload = {
      team_id: teamId,
      user_id: userId,
      email: normalizedEmail,
      role,
      status: TEAM_STATUSES.PENDING,
      invited_by: actorUserId,
      invited_at: timestamp,
      created_by: actorUserId,
      created_at: timestamp,
      updated_at: timestamp
    }

    const { data, error } = await this.supabase
      .from('team_members')
      .insert([payload])
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to invite member', error.message)
    }

    return data
  }

  async acceptInvite(teamId, userId, userEmail = null) {
    let membership = await this.getTeamMembership(teamId, userId)

    if (!membership && userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase()
      const { data, error } = await this.supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', normalizedEmail)
        .eq('status', TEAM_STATUSES.PENDING)
        .maybeSingle()

      if (error) {
        throw new ApiError(500, 'Failed to verify invite by email', error.message)
      }

      membership = data || null
    }

    if (!membership) {
      throw new ApiError(404, 'Invite not found')
    }

    assert(membership.status === TEAM_STATUSES.PENDING, 409, 'Invite is no longer pending')

    const timestamp = new Date().toISOString()
    const updates = {
      status: TEAM_STATUSES.ACTIVE,
      joined_at: timestamp,
      updated_at: timestamp,
    }

    if (!membership.user_id) {
      updates.user_id = userId
    }

    if (userEmail && !membership.email) {
      updates.email = userEmail.trim().toLowerCase()
    }

    const { data, error } = await this.supabase
      .from('team_members')
      .update(updates)
      .eq('id', membership.id)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to accept invite', error.message)
    }

    return data
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

    const updates = { updated_at: new Date().toISOString() }

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
        updates.joined_at = new Date().toISOString()
      } else if (status === TEAM_STATUSES.PENDING) {
        updates.status = TEAM_STATUSES.PENDING
        updates.joined_at = null
      } else if (status === TEAM_STATUSES.BLOCKED) {
        updates.status = TEAM_STATUSES.BLOCKED
        updates.left_at = new Date().toISOString()
      } else if ([TEAM_STATUSES.LEFT, TEAM_STATUSES.REMOVED].includes(status)) {
        updates.status = status
        updates.left_at = new Date().toISOString()
      } else {
        throw new ApiError(400, 'Unsupported status transition')
      }
    }

    const { data, error } = await this.supabase
      .from('team_members')
      .update(updates)
      .eq('id', membership.id)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to update team member', error.message)
    }

    return data
  }

  async removeMember(teamId, targetUserId, actorUserId) {
    if (targetUserId === actorUserId) {
      const membership = await this.requireMembership(teamId, targetUserId, {
        allowRoles: ACTIVE_ROLES
      })

      if (membership.role === TEAM_ROLES.OWNER) {
        throw new ApiError(400, 'Transfer ownership before leaving the team')
      }

      const { data, error } = await this.supabase
        .from('team_members')
        .update({
          status: TEAM_STATUSES.LEFT,
          left_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', membership.id)
        .select()
        .single()

      if (error) {
        throw new ApiError(500, 'Failed to leave team', error.message)
      }

      return data
    }

    await this.assertManager(teamId, actorUserId)

    const membership = await this.getTeamMembership(teamId, targetUserId)
    if (!membership) {
      throw new ApiError(404, 'Team member not found')
    }

    if (membership.role === TEAM_ROLES.OWNER) {
      throw new ApiError(403, 'Cannot remove the team owner')
    }

    const { data, error } = await this.supabase
      .from('team_members')
      .update({
        status: TEAM_STATUSES.REMOVED,
        left_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.id)
      .select()
      .single()

    if (error) {
      throw new ApiError(500, 'Failed to remove member', error.message)
    }

    return data
  }

  async transferOwnership(teamId, actorUserId, targetUserId) {
    assert(targetUserId, 400, 'Target user is required')
    const actorMembership = await this.assertOwner(teamId, actorUserId)

    const targetMembership = await this.getTeamMembership(teamId, targetUserId)
    if (!targetMembership || targetMembership.status !== TEAM_STATUSES.ACTIVE) {
      throw new ApiError(400, 'New owner must be an active team member')
    }

    const timestamp = new Date().toISOString()

    // Demote current owner first to satisfy unique constraint
    const { error: demoteError } = await this.supabase
      .from('team_members')
      .update({
        role: TEAM_ROLES.ADMIN,
        updated_at: timestamp
      })
      .eq('id', actorMembership.id)

    if (demoteError) {
      throw new ApiError(500, 'Failed to update current owner role', demoteError.message)
    }

    const { error: promoteError } = await this.supabase
      .from('team_members')
      .update({
        role: TEAM_ROLES.OWNER,
        status: TEAM_STATUSES.ACTIVE,
        updated_at: timestamp
      })
      .eq('id', targetMembership.id)

    if (promoteError) {
      // Try to revert original owner on failure
      await this.supabase
        .from('team_members')
        .update({ role: TEAM_ROLES.OWNER, updated_at: new Date().toISOString() })
        .eq('id', actorMembership.id)

      throw new ApiError(500, 'Failed to promote new owner', promoteError.message)
    }

    const { error: teamUpdateError } = await this.supabase
      .from('teams')
      .update({
        owner_id: targetUserId,
        updated_at: timestamp
      })
      .eq('id', teamId)

    if (teamUpdateError) {
      // Attempt to revert state if team update fails
      await this.supabase
        .from('team_members')
        .update({ role: TEAM_ROLES.OWNER, updated_at: new Date().toISOString() })
        .eq('id', actorMembership.id)
      await this.supabase
        .from('team_members')
        .update({ role: targetMembership.role, updated_at: new Date().toISOString() })
        .eq('id', targetMembership.id)

      throw new ApiError(500, 'Failed to update team owner', teamUpdateError.message)
    }
  }
}
