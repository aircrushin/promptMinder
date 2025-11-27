import { ApiError } from './api-error.js'
import { TEAM_ROLES, TEAM_STATUSES, TeamService } from './team-service.js'
import { createSupabaseServerClient } from './supabaseServer.js'

export function extractTeamId(request) {
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

export async function resolveTeamContext(
  request,
  userId,
  {
    requireMembership = true,
    allowMissingTeam = false,
    allowedRoles = [TEAM_ROLES.MEMBER, TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER],
    allowedStatuses = [TEAM_STATUSES.ACTIVE],
  } = {},
) {
  const teamId = extractTeamId(request)
  const supabase = createSupabaseServerClient()
  const teamService = new TeamService(supabase)

  if (!teamId) {
    if (allowMissingTeam) {
      return { teamId: null, membership: null, supabase, teamService }
    }
    throw new ApiError(400, 'Team identifier is required')
  }

  if (!requireMembership) {
    return { teamId, membership: null, supabase, teamService }
  }

  const membership = await teamService.requireMembership(teamId, userId, {
    allowRoles: allowedRoles,
    allowStatuses,
  })

  return { teamId, membership, supabase, teamService }
}
