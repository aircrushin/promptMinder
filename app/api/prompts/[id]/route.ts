// @ts-nocheck
import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { handleApiError } from '@/lib/handle-api-error'
import { resolveTeamContext } from '@/lib/team-request'
import { TEAM_ROLES } from '@/lib/team-service'
import { eq, or, and } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index'
import { toSnakeCase } from '@/lib/case-utils'

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

export async function GET(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    const conditions = [eq(prompts.id, id)]
    if (teamId) {
      conditions.push(eq(prompts.teamId, teamId))
    } else {
      conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
    }

    const rows = await db.select().from(prompts).where(and(...conditions)).limit(1)
    const prompt = rows[0] ? toSnakeCase(rows[0]) : null

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    return handleApiError(error, 'Unable to load prompt')
  }
}

export async function POST(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    const conditions = [eq(prompts.id, id)]
    if (teamId) {
      conditions.push(eq(prompts.teamId, teamId))
    } else {
      conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
    }

    const rows = await db.select().from(prompts).where(and(...conditions)).limit(1)
    const prompt = rows[0] ? toSnakeCase(rows[0]) : null

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (!isCreator(prompt, userId) && !ensureManagerPermission(membership)) {
      return NextResponse.json({ error: 'Only the creator or team managers can update this prompt' }, { status: 403 })
    }

    const payload = await request.json()

    const updateData = { updatedAt: new Date() }

    if (payload.title !== undefined) updateData.title = payload.title
    if (payload.content !== undefined) updateData.content = payload.content
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.is_public !== undefined) updateData.isPublic = payload.is_public
    if (payload.tags !== undefined) updateData.tags = payload.tags
    if (payload.image_url !== undefined || payload.cover_img !== undefined) {
      updateData.coverImg = payload.cover_img ?? payload.image_url
    }
    if (payload.version !== undefined) updateData.version = payload.version
    if (payload.projectId !== undefined) updateData.projectId = payload.projectId

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ message: 'No changes supplied' })
    }

    const updateConditions = [eq(prompts.id, id)]
    if (prompt.team_id) {
      updateConditions.push(eq(prompts.teamId, prompt.team_id))
    }

    await db.update(prompts).set(updateData).where(and(...updateConditions))

    return NextResponse.json({ message: 'Prompt updated successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to update prompt')
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    const conditions = [eq(prompts.id, id)]
    if (teamId) {
      conditions.push(eq(prompts.teamId, teamId))
    } else {
      conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
    }

    const rows = await db
      .select({ id: prompts.id, createdBy: prompts.createdBy, userId: prompts.userId, teamId: prompts.teamId })
      .from(prompts)
      .where(and(...conditions))
      .limit(1)
    const prompt = rows[0] ? toSnakeCase(rows[0]) : null

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const canDelete = isCreator(prompt, userId) || ensureManagerPermission(membership)
    if (!canDelete) {
      return NextResponse.json({ error: 'Only the creator or team managers can delete this prompt' }, { status: 403 })
    }

    const deleteConditions = [eq(prompts.id, id)]
    if (prompt.team_id) {
      deleteConditions.push(eq(prompts.teamId, prompt.team_id))
    }

    await db.delete(prompts).where(and(...deleteConditions))

    return NextResponse.json({ message: 'Prompt deleted successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to delete prompt')
  }
}
