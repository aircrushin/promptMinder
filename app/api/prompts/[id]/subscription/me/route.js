import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import {
  WORKFLOW_EVENT_TYPES,
  addSubscription,
  getPromptByScope,
  getSubscriptionState,
  recordWorkflowEvent,
  removeSubscription,
} from '@/lib/prompt-workflow.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

function ensureTeamContext(teamId) {
  if (!teamId) {
    return NextResponse.json(
      { error: 'Subscriptions are only available in team workspaces' },
      { status: 409 }
    )
  }

  return null
}

export async function GET(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    if (!teamId) {
      return NextResponse.json({ subscribed: false })
    }

    await teamService.requireMembership(teamId, userId)

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const subscribed = await getSubscriptionState(db, {
      teamId,
      lineageId: prompt.lineage_id,
      userId,
    })

    return NextResponse.json({ subscribed })
  } catch (error) {
    return handleApiError(error, 'Unable to load subscription state')
  }
}

export async function POST(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    const teamContextError = ensureTeamContext(teamId)
    if (teamContextError) return teamContextError

    await teamService.requireMembership(teamId, userId)

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    await addSubscription(db, {
      teamId,
      lineageId: prompt.lineage_id,
      userId,
    })

    await recordWorkflowEvent(db, {
      teamId,
      lineageId: prompt.lineage_id,
      eventType: WORKFLOW_EVENT_TYPES.SUBSCRIPTION_CREATED,
      actorUserId: userId,
      payload: {
        prompt_id: prompt.id,
      },
    })

    return NextResponse.json({ subscribed: true })
  } catch (error) {
    return handleApiError(error, 'Unable to subscribe prompt changes')
  }
}

export async function DELETE(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    const teamContextError = ensureTeamContext(teamId)
    if (teamContextError) return teamContextError

    await teamService.requireMembership(teamId, userId)

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    await removeSubscription(db, {
      teamId,
      lineageId: prompt.lineage_id,
      userId,
    })

    await recordWorkflowEvent(db, {
      teamId,
      lineageId: prompt.lineage_id,
      eventType: WORKFLOW_EVENT_TYPES.SUBSCRIPTION_REMOVED,
      actorUserId: userId,
      payload: {
        prompt_id: prompt.id,
      },
    })

    return NextResponse.json({ subscribed: false })
  } catch (error) {
    return handleApiError(error, 'Unable to unsubscribe prompt changes')
  }
}
