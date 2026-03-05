import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { listChangeRequests } from '@/lib/prompt-workflow.js'

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: true,
      allowMissingTeam: false,
    })

    await teamService.requireMembership(teamId, userId)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const mine = searchParams.get('mine') === 'true'

    const requests = await listChangeRequests(db, {
      teamId,
      status,
      mine,
      userId,
    })

    return NextResponse.json({ change_requests: requests })
  } catch (error) {
    return handleApiError(error, 'Unable to load change requests')
  }
}
