import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { resolveTeamContext } from '@/lib/team-request'
import { handleApiError } from '@/lib/handle-api-error'
import { TEAM_ROLES } from '@/lib/team-service'
import { eq, or, and } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index'
import { toSnakeCase } from '@/lib/case-utils'

export async function POST(request, { params }) {
  try {
    const { id: promptId } = await params
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt id is required' }, { status: 400 })
    }

    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    const conditions = [eq(prompts.id, promptId)]
    if (teamId) {
      conditions.push(eq(prompts.teamId, teamId))
    } else {
      conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
    }

    const rows = await db
      .select({ id: prompts.id, createdBy: prompts.createdBy, userId: prompts.userId, teamId: prompts.teamId, isPublic: prompts.isPublic })
      .from(prompts)
      .where(and(...conditions))
      .limit(1)
    const prompt = rows[0] ? toSnakeCase(rows[0]) : null

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const isOwner = prompt.created_by === userId || prompt.user_id === userId
    const canShare = isOwner || [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership?.role)

    if (!canShare) {
      return NextResponse.json({ error: '只有创建者或团队管理员可以分享提示词' }, { status: 403 })
    }

    if (prompt.is_public) {
      return NextResponse.json({ message: 'Prompt already shared' })
    }

    const updateConditions = [eq(prompts.id, promptId)]
    if (prompt.team_id) {
      updateConditions.push(eq(prompts.teamId, prompt.team_id))
    }

    await db.update(prompts).set({ isPublic: true, updatedAt: new Date() }).where(and(...updateConditions))

    return NextResponse.json({ message: 'Prompt shared successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to share prompt')
  }
}
