import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import {
  createChangeRequest,
  ensureLineage,
  isTeamApprovalEnabled,
} from '@/lib/prompt-workflow.js'

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: true,
      allowMissingTeam: false,
    })

    await teamService.requireMembership(teamId, userId)

    const approvalEnabled = await isTeamApprovalEnabled(db, teamId)
    if (!approvalEnabled) {
      return NextResponse.json({ error: 'Approval workflow is disabled for this team' }, { status: 409 })
    }

    const payload = await request.json()

    if (!payload?.title || !payload?.content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const lineageId = await ensureLineage(db, {
      teamId,
      title: payload.title,
      userId,
    })

    const changeRequest = await createChangeRequest(db, {
      teamId,
      lineageId,
      requestType: 'create_prompt',
      submitterUserId: userId,
      proposal: {
        title: payload.title,
        content: payload.content,
        description: payload.description || null,
        tags: payload.tags || null,
        version: payload.version || null,
        projectId: payload.projectId || null,
      },
    })

    return NextResponse.json({ change_request: changeRequest }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create prompt change request')
  }
}
