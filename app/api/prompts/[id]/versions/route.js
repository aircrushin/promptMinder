import { NextResponse } from 'next/server'
import { desc, getTableColumns, isNotNull } from 'drizzle-orm'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { buildPromptVersionScope, getPromptByScope } from '@/lib/prompt-workflow.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

const summaryColumns = { ...getTableColumns(prompts), hasSkillPackage: isNotNull(prompts.skillPackage) };
delete summaryColumns.skillPackage;

export async function GET(request, { params }) {
  try {
    const promptId = await getPromptId(params)
    const userId = await requireUserId(request)

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

    const rows = await db.select(summaryColumns).from(prompts)
      .where(buildPromptVersionScope({ prompt, teamId, userId }))
      .orderBy(desc(prompts.createdAt));

    return NextResponse.json({ versions: rows.map(toSnakeCase) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return handleApiError(error, 'Unable to load prompt versions')
  }
}
