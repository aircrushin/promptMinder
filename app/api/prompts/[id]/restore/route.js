import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { TEAM_ROLES } from '@/lib/team-service.js'
import { ApiError, assert } from '@/lib/api-error.js'
import { prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { allocateNextVersion } from '@/lib/prompt-versions.js'
import {
  WORKFLOW_EVENT_TYPES,
  buildPromptAccessScope,
  createChangeRequest,
  createPromptDirect,
  getPromptByScope,
  isTeamApprovalEnabled,
  recordWorkflowEvent,
} from '@/lib/prompt-workflow.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

function isCreator(prompt, userId) {
  return prompt.created_by === userId || prompt.user_id === userId
}

function ensureManagerPermission(membership) {
  return membership && [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership.role)
}

async function listSiblingVersions(db, { teamId, userId, source }) {
  if (teamId && source.lineage_id) {
    const rows = await db
      .select()
      .from(prompts)
      .where(and(eq(prompts.teamId, teamId), eq(prompts.lineageId, source.lineage_id)))
      .orderBy(desc(prompts.createdAt))
    return rows.map(toSnakeCase)
  }

  const rows = await db
    .select()
    .from(prompts)
    .where(
      and(
        eq(prompts.title, source.title),
        buildPromptAccessScope({ teamId: null, userId })
      )
    )
    .orderBy(desc(prompts.createdAt))

  return rows.map(toSnakeCase)
}

export async function POST(request, { params }) {
  try {
    const sourceId = await getPromptId(params)
    const userId = await requireUserId(request)
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    const source = await getPromptByScope(db, { promptId: sourceId, teamId, userId })
    assert(source, 404, 'Prompt version not found')

    const canRestore = isCreator(source, userId) || ensureManagerPermission(membership)
    assert(canRestore, 403, 'Only the creator or team managers can restore this version')

    const siblings = await listSiblingVersions(db, { teamId, userId, source })
    assert(siblings.length > 0, 404, 'Prompt version not found')

    const latest = siblings[0]
    assert(latest.id !== source.id, 409, 'This version is already the latest')

    const nextVersion = allocateNextVersion(
      siblings.map((item) => item.version),
      latest.version
    )

    const proposal = {
      title: latest.title,
      content: source.content,
      description: source.description || null,
      tags: source.tags || null,
      version: nextVersion,
      projectId: latest.project_id || source.project_id || null,
      is_public: latest.is_public ?? false,
      cover_img: source.cover_img || latest.cover_img || null,
    }

    if (teamId && (await isTeamApprovalEnabled(db, teamId))) {
      const changeRequest = await createChangeRequest(db, {
        teamId,
        lineageId: source.lineage_id || latest.lineage_id,
        basePromptId: latest.id,
        requestType: 'create_version',
        submitterUserId: userId,
        proposal: {
          title: proposal.title,
          content: proposal.content,
          description: proposal.description,
          tags: proposal.tags,
          version: proposal.version,
          projectId: proposal.projectId,
        },
      })

      return NextResponse.json({
        mode: 'approval_required',
        change_request: changeRequest,
        restored_from: {
          id: source.id,
          version: source.version,
        },
        proposed_version: nextVersion,
      })
    }

    const restored = await createPromptDirect(db, {
      teamId: teamId || null,
      userId,
      lineageId: source.lineage_id || latest.lineage_id || null,
      data: proposal,
    })

    if (teamId && restored.lineage_id) {
      await recordWorkflowEvent(db, {
        teamId,
        lineageId: restored.lineage_id,
        eventType: WORKFLOW_EVENT_TYPES.VERSION_RESTORED,
        actorUserId: userId,
        payload: {
          restored_from_id: source.id,
          restored_from_version: source.version,
          new_prompt_id: restored.id,
          new_version: restored.version,
        },
      })
    }

    return NextResponse.json({
      mode: 'restored',
      prompt: restored,
      restored_from: {
        id: source.id,
        version: source.version,
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error, error.message)
    }
    return handleApiError(error, 'Unable to restore prompt version')
  }
}
