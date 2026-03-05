import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { TeamService } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { getTeamApprovalSettings, setTeamApprovalSettings } from '@/lib/prompt-workflow.js'

async function getTeamId(paramsPromise) {
  const { teamId } = await paramsPromise
  if (!teamId) {
    throw new Error('Team id missing in route params')
  }
  return teamId
}

export async function GET(_request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()

    const teamService = new TeamService(db)
    await teamService.requireMembership(teamId, userId)

    const settings = await getTeamApprovalSettings(db, teamId)
    return NextResponse.json(settings)
  } catch (error) {
    return handleApiError(error, 'Unable to load team workflow settings')
  }
}

export async function PATCH(request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()
    const body = await request.json()

    if (typeof body?.approval_enabled !== 'boolean') {
      return NextResponse.json({ error: 'approval_enabled must be a boolean' }, { status: 400 })
    }

    const teamService = new TeamService(db)
    await teamService.assertManager(teamId, userId)

    const settings = await setTeamApprovalSettings(db, teamId, body.approval_enabled)
    return NextResponse.json(settings)
  } catch (error) {
    return handleApiError(error, 'Unable to update team workflow settings')
  }
}
