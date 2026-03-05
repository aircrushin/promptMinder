import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import {
  createChangeRequest,
  getPromptByScope,
  isTeamApprovalEnabled,
  listChangeRequestsByLineage,
} from '@/lib/prompt-workflow.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

function normalizeProposal(prompt, payload = {}) {
  return {
    title: payload.title ?? prompt.title,
    content: payload.content ?? prompt.content,
    description: payload.description ?? prompt.description,
    tags: payload.tags ?? prompt.tags,
    version: payload.version ?? prompt.version,
    projectId: payload.projectId ?? prompt.project_id ?? null,
  }
}

export async function GET(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: true,
      allowMissingTeam: false,
    })

    await teamService.requireMembership(teamId, userId)

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    const requests = await listChangeRequestsByLineage(db, {
      teamId,
      lineageId: prompt.lineage_id,
      status,
    })

    return NextResponse.json({ change_requests: requests })
  } catch (error) {
    return handleApiError(error, 'Unable to load change requests')
  }
}

export async function POST(request, { params }) {
  try {
    const promptId = await getPromptId(params)
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

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const payload = await request.json().catch(() => ({}))
    const proposal = normalizeProposal(prompt, payload)

    const changeRequest = await createChangeRequest(db, {
      teamId,
      lineageId: prompt.lineage_id,
      basePromptId: prompt.id,
      requestType: 'create_version',
      submitterUserId: userId,
      proposal,
    })

    return NextResponse.json({ change_request: changeRequest }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create change request')
  }
}
