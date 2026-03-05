import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import {
  applyChangeRequestAction,
  getChangeRequestById,
  getChangeRequestDetail,
} from '@/lib/prompt-workflow.js'

async function getRequestId(paramsPromise) {
  const { requestId } = await paramsPromise
  if (!requestId) {
    throw new Error('requestId missing in route params')
  }
  return requestId
}

export async function GET(request, { params }) {
  try {
    const requestId = await getRequestId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: true,
      allowMissingTeam: false,
    })

    await teamService.requireMembership(teamId, userId)

    const detail = await getChangeRequestDetail(db, requestId)

    if (detail.request.team_id !== teamId) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    return NextResponse.json(detail)
  } catch (error) {
    return handleApiError(error, 'Unable to load change request')
  }
}

export async function PATCH(request, { params }) {
  try {
    const requestId = await getRequestId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: true,
      allowMissingTeam: false,
    })

    await teamService.requireMembership(teamId, userId)

    const changeRequest = await getChangeRequestById(db, requestId)
    if (!changeRequest || changeRequest.team_id !== teamId) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action
    const reviewNote = body?.review_note || null

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    if (action === 'approve' || action === 'reject') {
      await teamService.assertManager(teamId, userId)
    }

    const result = await applyChangeRequestAction(db, {
      request: changeRequest,
      action,
      actorUserId: userId,
      reviewNote,
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'Unable to review change request')
  }
}
