import { ApiError } from './api-error'
import { TEAM_ROLES, TEAM_STATUSES, TeamService } from './team-service'
import { db } from './db'

export function extractTeamId(request: Request): string | null {
  const headerValue = request.headers.get('x-team-id') || request.headers.get('X-Team-Id')
  if (headerValue && headerValue !== 'null' && headerValue !== 'undefined') {
    return headerValue
  }

  const url = new URL(request.url)
  const queryValue = url.searchParams.get('teamId') || url.searchParams.get('team_id')
  if (queryValue && queryValue !== 'null' && queryValue !== 'undefined') {
    return queryValue
  }

  return null
}

interface ResolveTeamContextOptions {
  requireMembership?: boolean;
  allowMissingTeam?: boolean;
  allowedRoles?: string[];
  allowedStatuses?: string[];
}

export async function resolveTeamContext(
  request: Request,
  userId: string,
  {
    requireMembership = true,
    allowMissingTeam = false,
    allowedRoles = [TEAM_ROLES.MEMBER, TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER],
    allowedStatuses = [TEAM_STATUSES.ACTIVE],
  }: ResolveTeamContextOptions = {},
) {
  const teamId = extractTeamId(request)
  const teamService = new TeamService(db)

  if (!teamId) {
    if (allowMissingTeam) {
      return { teamId: null, membership: null, db, teamService }
    }
    throw new ApiError(400, 'Team identifier is required')
  }

  if (!requireMembership) {
    return { teamId, membership: null, db, teamService }
  }

  const membership = await teamService.requireMembership(teamId, userId, {
    allowRoles: allowedRoles,
    allowStatuses: allowedStatuses,
  })

  return { teamId, membership, db, teamService }
}
