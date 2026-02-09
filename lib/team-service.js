import { ApiError, assert } from './api-error.js';
import { queries } from './db/index.js';

export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const TEAM_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  LEFT: 'left',
  REMOVED: 'removed',
  BLOCKED: 'blocked'
};

const MANAGER_ROLES = [TEAM_ROLES.OWNER, TEAM_ROLES.ADMIN];
const ACTIVE_ROLES = [TEAM_ROLES.MEMBER, TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER];

export class TeamService {
  constructor() {
    // Drizzle queries don't require a connection parameter
    // They use the singleton db instance internally
  }

  async getPersonalTeam(userId) {
    try {
      return await queries.teams.getPersonalTeam(userId);
    } catch (error) {
      throw new ApiError(500, 'Failed to load personal team', error.message);
    }
  }

  async ensureOwnerMembership(teamId, userId) {
    try {
      const membership = await queries.teamMembers.getMembership(teamId, userId);

      if (!membership) {
        const timestamp = new Date().toISOString();
        await queries.teamMembers.create({
          teamId,
          userId,
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
          joinedAt: timestamp,
          createdBy: userId,
        });
        return;
      }

      if (membership.role !== TEAM_ROLES.OWNER || membership.status !== TEAM_STATUSES.ACTIVE) {
        await queries.teamMembers.update(membership.id, {
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
          joinedAt: membership.joinedAt || new Date().toISOString(),
        });
      }
    } catch (error) {
      throw new ApiError(500, 'Failed to ensure owner membership', error.message);
    }
  }

  async ensurePersonalTeam(userId) {
    let personalTeam = await this.getPersonalTeam(userId);
    if (personalTeam) {
      await this.ensureOwnerMembership(personalTeam.id, userId);
      return personalTeam;
    }

    personalTeam = await this.createTeam({
      name: 'Personal workspace',
      description: 'Auto-generated personal space',
      avatarUrl: null,
      isPersonal: true,
    }, userId);

    return personalTeam;
  }

  async listTeamsForUser(userId, { includePending = false } = {}) {
    try {
      const memberships = await queries.teamMembers.getByUserId(userId, { includePending });

      return memberships.map((row) => ({
        membershipId: row.id,
        role: row.role,
        status: row.status,
        userId: row.userId,
        invitedAt: row.invitedAt,
        joinedAt: row.joinedAt,
        team: row.team
      }));
    } catch (error) {
      throw new ApiError(500, 'Failed to load teams', error.message);
    }
  }

  async getTeam(teamId) {
    try {
      const team = await queries.teams.getById(teamId);

      if (!team) {
        throw new ApiError(404, 'Team not found');
      }

      return team;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to load team', error.message);
    }
  }

  async getTeamMembership(teamId, userId) {
    try {
      return await queries.teamMembers.getMembership(teamId, userId);
    } catch (error) {
      throw new ApiError(500, 'Failed to verify team membership', error.message);
    }
  }

  async requireMembership(teamId, userId, { allowStatuses = [TEAM_STATUSES.ACTIVE], allowRoles = ACTIVE_ROLES } = {}) {
    const membership = await this.getTeamMembership(teamId, userId);

    if (!membership) {
      throw new ApiError(403, 'You are not a member of this team');
    }

    assert(allowStatuses.includes(membership.status), 403, 'Your membership status prohibits this action');
    assert(allowRoles.includes(membership.role), 403, 'Insufficient permissions for this action');

    return membership;
  }

  async assertManager(teamId, userId) {
    return this.requireMembership(teamId, userId, {
      allowRoles: MANAGER_ROLES
    });
  }

  async assertOwner(teamId, userId) {
    return this.requireMembership(teamId, userId, {
      allowRoles: [TEAM_ROLES.OWNER]
    });
  }

  async createTeam({ name, description = null, avatarUrl = null, isPersonal = false }, ownerId) {
    assert(name && name.trim().length > 0, 400, 'Team name is required');

    if (isPersonal) {
      await this.ensureNoPersonalTeam(ownerId);
    } else {
      // Check team limit for non-personal teams
      const count = await queries.teams.countNonPersonalTeams(ownerId);

      if (count >= 2) {
        throw new ApiError(403, 'You have reached the maximum limit of 2 teams');
      }
    }

    try {
      const team = await queries.teams.create({
        name: name.trim(),
        description,
        avatarUrl,
        isPersonal,
        createdBy: ownerId,
        ownerId: ownerId
      });

      const membershipPayload = {
        teamId: team.id,
        userId: ownerId,
        role: TEAM_ROLES.OWNER,
        status: TEAM_STATUSES.ACTIVE,
        joinedAt: new Date().toISOString(),
        createdBy: ownerId
      };

      try {
        await queries.teamMembers.create(membershipPayload);
      } catch (memberError) {
        // Best effort rollback so we do not leave orphan teams without owner membership
        await queries.teams.delete(team.id);
        throw new ApiError(500, 'Failed to create team membership', memberError.message);
      }

      return team;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create team', error.message);
    }
  }

  async ensureNoPersonalTeam(userId) {
    try {
      const hasPersonal = await queries.teams.hasPersonalTeam(userId);

      if (hasPersonal) {
        throw new ApiError(409, 'Personal team already exists');
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Unable to verify personal team status', error.message);
    }
  }

  async updateTeam(teamId, updates, actorUserId) {
    await this.assertManager(teamId, actorUserId);

    const allowedFields = ['name', 'description', 'avatar_url'];
    const sanitized = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        sanitized[field] = updates[field];
      }
    }

    if (sanitized.name && sanitized.name.trim().length === 0) {
      throw new ApiError(400, 'Team name cannot be empty');
    }

    if (Object.keys(sanitized).length === 0) {
      const team = await this.getTeam(teamId);
      return team;
    }

    if (sanitized.name) {
      sanitized.name = sanitized.name.trim();
    }

    try {
      const team = await queries.teams.update(teamId, sanitized);
      return team;
    } catch (error) {
      throw new ApiError(500, 'Failed to update team', error.message);
    }
  }

  async deleteTeam(teamId, actorUserId) {
    await this.assertOwner(teamId, actorUserId);

    try {
      await queries.teams.delete(teamId);
    } catch (error) {
      throw new ApiError(500, 'Failed to delete team', error.message);
    }
  }

  async inviteMember(teamId, actorUserId, { userId, email, role = TEAM_ROLES.MEMBER }) {
    assert(userId, 400, 'Target user is required');
    assert(email, 400, 'Target email is required');

    const team = await this.getTeam(teamId);
    assert(!team.isPersonal, 400, 'Cannot invite members to personal teams');

    await this.assertManager(teamId, actorUserId);

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.getTeamMembership(teamId, userId);
    const timestamp = new Date().toISOString();

    if (existing) {
      if (existing.status === TEAM_STATUSES.PENDING) {
        const updated = await queries.teamMembers.update(existing.id, {
          role,
          invitedBy: actorUserId,
          invitedAt: timestamp,
          email: normalizedEmail,
          userId
        });

        return updated;
      }

      if (existing.status === TEAM_STATUSES.ACTIVE) {
        throw new ApiError(409, 'User is already a team member');
      }

      const updated = await queries.teamMembers.update(existing.id, {
        role,
        status: TEAM_STATUSES.PENDING,
        invitedBy: actorUserId,
        invitedAt: timestamp,
        joinedAt: null,
        leftAt: null,
        email: normalizedEmail,
        userId
      });

      return updated;
    }

    const payload = {
      teamId,
      userId,
      email: normalizedEmail,
      role,
      status: TEAM_STATUSES.PENDING,
      invitedBy: actorUserId,
      invitedAt: timestamp,
      createdBy: actorUserId
    };

    try {
      const member = await queries.teamMembers.create(payload);
      return member;
    } catch (error) {
      throw new ApiError(500, 'Failed to invite member', error.message);
    }
  }

  async acceptInvite(teamId, userId, userEmail = null) {
    let membership = await this.getTeamMembership(teamId, userId);

    if (!membership && userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase();
      const pendingInvite = await queries.teamMembers.getPendingByEmail(teamId, normalizedEmail);
      membership = pendingInvite;
    }

    if (!membership) {
      throw new ApiError(404, 'Invite not found');
    }

    assert(membership.status === TEAM_STATUSES.PENDING, 409, 'Invite is no longer pending');

    const timestamp = new Date().toISOString();
    const updates = {
      status: TEAM_STATUSES.ACTIVE,
      joinedAt: timestamp,
    };

    if (!membership.userId) {
      updates.userId = userId;
    }

    if (userEmail && !membership.email) {
      updates.email = userEmail.trim().toLowerCase();
    }

    try {
      const updated = await queries.teamMembers.update(membership.id, updates);
      return updated;
    } catch (error) {
      throw new ApiError(500, 'Failed to accept invite', error.message);
    }
  }

  async updateMember(teamId, targetUserId, actorUserId, { role, status }) {
    const actorMembership = await this.assertManager(teamId, actorUserId);

    const membership = await this.getTeamMembership(teamId, targetUserId);
    if (!membership) {
      throw new ApiError(404, 'Team member not found');
    }

    if (membership.userId === actorUserId && role && role !== membership.role) {
      throw new ApiError(400, 'Use ownership transfer or leave actions for yourself');
    }

    const updates = {};

    if (role) {
      if (!MANAGER_ROLES.includes(actorMembership.role)) {
        throw new ApiError(403, 'Only admins or owners can change roles');
      }
      if (!ACTIVE_ROLES.includes(role)) {
        throw new ApiError(400, 'Invalid role specified');
      }
      if (membership.role === TEAM_ROLES.OWNER && role !== TEAM_ROLES.OWNER) {
        throw new ApiError(400, 'Use ownership transfer to change owner role');
      }
      updates.role = role;
    }

    if (status) {
      if (status === TEAM_STATUSES.ACTIVE && membership.status === TEAM_STATUSES.PENDING && membership.userId === actorUserId) {
        throw new ApiError(400, 'Self-activation handled via accept endpoint');
      }
      if (status === TEAM_STATUSES.ACTIVE && membership.status === TEAM_STATUSES.PENDING) {
        updates.status = TEAM_STATUSES.ACTIVE;
        updates.joinedAt = new Date().toISOString();
      } else if (status === TEAM_STATUSES.PENDING) {
        updates.status = TEAM_STATUSES.PENDING;
        updates.joinedAt = null;
      } else if (status === TEAM_STATUSES.BLOCKED) {
        updates.status = TEAM_STATUSES.BLOCKED;
        updates.leftAt = new Date().toISOString();
      } else if ([TEAM_STATUSES.LEFT, TEAM_STATUSES.REMOVED].includes(status)) {
        updates.status = status;
        updates.leftAt = new Date().toISOString();
      } else {
        throw new ApiError(400, 'Unsupported status transition');
      }
    }

    try {
      const updated = await queries.teamMembers.update(membership.id, updates);
      return updated;
    } catch (error) {
      throw new ApiError(500, 'Failed to update team member', error.message);
    }
  }

  async removeMember(teamId, targetUserId, actorUserId) {
    if (targetUserId === actorUserId) {
      const membership = await this.requireMembership(teamId, targetUserId, {
        allowRoles: ACTIVE_ROLES
      });

      if (membership.role === TEAM_ROLES.OWNER) {
        throw new ApiError(400, 'Transfer ownership before leaving the team');
      }

      try {
        const updated = await queries.teamMembers.update(membership.id, {
          status: TEAM_STATUSES.LEFT,
          leftAt: new Date().toISOString(),
        });
        return updated;
      } catch (error) {
        throw new ApiError(500, 'Failed to leave team', error.message);
      }
    }

    await this.assertManager(teamId, actorUserId);

    const membership = await this.getTeamMembership(teamId, targetUserId);
    if (!membership) {
      throw new ApiError(404, 'Team member not found');
    }

    if (membership.role === TEAM_ROLES.OWNER) {
      throw new ApiError(403, 'Cannot remove the team owner');
    }

    try {
      const updated = await queries.teamMembers.update(membership.id, {
        status: TEAM_STATUSES.REMOVED,
        leftAt: new Date().toISOString(),
      });
      return updated;
    } catch (error) {
      throw new ApiError(500, 'Failed to remove member', error.message);
    }
  }

  async transferOwnership(teamId, actorUserId, targetUserId) {
    assert(targetUserId, 400, 'Target user is required');
    const actorMembership = await this.assertOwner(teamId, actorUserId);

    const targetMembership = await this.getTeamMembership(teamId, targetUserId);
    if (!targetMembership || targetMembership.status !== TEAM_STATUSES.ACTIVE) {
      throw new ApiError(400, 'New owner must be an active team member');
    }

    const timestamp = new Date().toISOString();

    try {
      // Demote current owner first to satisfy unique constraint
      await queries.teamMembers.update(actorMembership.id, {
        role: TEAM_ROLES.ADMIN,
      });

      try {
        await queries.teamMembers.update(targetMembership.id, {
          role: TEAM_ROLES.OWNER,
          status: TEAM_STATUSES.ACTIVE,
        });

        await queries.teams.update(teamId, {
          ownerId: targetUserId,
        });
      } catch (error) {
        // Try to revert original owner on failure
        await queries.teamMembers.update(actorMembership.id, {
          role: TEAM_ROLES.OWNER,
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to transfer ownership', error.message);
    }
  }
}
