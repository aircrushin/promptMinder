import { NextResponse } from 'next/server'
import { and, desc, eq, or } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { getPromptByScope } from '@/lib/prompt-workflow.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

export async function GET(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId()

    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const prompt = await getPromptByScope(db, { promptId, teamId, userId })

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    let rows = []

    if (teamId) {
      rows = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.teamId, teamId), eq(prompts.lineageId, prompt.lineage_id)))
        .orderBy(desc(prompts.createdAt))
    } else {
      rows = await db
        .select()
        .from(prompts)
        .where(
          and(
            eq(prompts.title, prompt.title),
            or(eq(prompts.createdBy, userId), eq(prompts.userId, userId))
          )
        )
        .orderBy(desc(prompts.createdAt))
    }

    return NextResponse.json({ versions: rows.map(toSnakeCase) })
  } catch (error) {
    return handleApiError(error, 'Unable to load prompt versions')
  }
}
