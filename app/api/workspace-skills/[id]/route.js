import { NextResponse } from 'next/server';
import { and, eq, isNotNull } from 'drizzle-orm';
import { prompts } from '@/drizzle/schema';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { buildPromptAccessScope, getPromptByScope } from '@/lib/prompt-workflow';
import { handleApiError } from '@/lib/handle-api-error';
import { assert } from '@/lib/api-error';
import { toSnakeCase } from '@/lib/case-utils';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = await requireUserId(request);
    const { db, teamId, teamService } = await resolveTeamContext(request, userId, { requireMembership: false, allowMissingTeam: true });
    if (teamId) await teamService.requireMembership(teamId, userId);
    let prompt = await getPromptByScope(db, { promptId: id, teamId, userId });
    assert(prompt?.skill_package, 404, 'Skill version not found.');
    const version = new URL(request.url).searchParams.get('version');
    if (version) {
      const rows = await db.select().from(prompts).where(and(
        buildPromptAccessScope({ teamId, userId }), eq(prompts.lineageId, prompt.lineage_id),
        eq(prompts.version, version), isNotNull(prompts.skillPackage),
      )).limit(2);
      assert(rows.length > 0, 404, 'Skill version not found.');
      assert(rows.length === 1, 409, 'Ambiguous version label; use the exact prompt ID without --version.');
      prompt = toSnakeCase(rows[0]);
    }
    // Pending proposals live in change_requests and are never installable here.
    return NextResponse.json({ prompt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'Unable to read Skill version.'); }
}
