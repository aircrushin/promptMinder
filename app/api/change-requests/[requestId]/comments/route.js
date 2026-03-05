import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import {
  createCommentOnChangeRequest,
  getChangeRequestById,
  listCommentsByRequest,
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

    const changeRequest = await getChangeRequestById(db, requestId)
    if (!changeRequest || changeRequest.team_id !== teamId) {
      return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    }

    const comments = await listCommentsByRequest(db, requestId)
    return NextResponse.json({ comments })
  } catch (error) {
    return handleApiError(error, 'Unable to load comments')
  }
}

export async function POST(request, { params }) {
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

    const comment = await createCommentOnChangeRequest(db, {
      request: changeRequest,
      content: body?.content || '',
      authorUserId: userId,
      mentionUserIds: Array.isArray(body?.mention_user_ids) ? body.mention_user_ids : [],
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to add comment')
  }
}
