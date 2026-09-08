import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { getPromptByScope } from '@/lib/prompt-workflow';
import { catalogSkillPackage } from '@/lib/skill-package';
import { getCatalogSkill } from '@/lib/skills-catalog';
import { assert } from '@/lib/api-error';
import { handleApiError } from '@/lib/handle-api-error';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = await requireUserId(request);
    const { db, teamId, teamService } = await resolveTeamContext(request, userId, { requireMembership: false, allowMissingTeam: true });
    if (teamId) await teamService.requireMembership(teamId, userId);
    const prompt = await getPromptByScope(db, { promptId: id, teamId, userId });
    assert(prompt?.skill_package, 404, 'Skill not found.');
    const catalogId = prompt.skill_package.source?.catalog_id;
    assert(catalogId, 400, 'This package is not linked to the catalog.');
    return NextResponse.json({ skill_package: catalogSkillPackage(await getCatalogSkill(catalogId)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'Unable to compare upstream snapshot.'); }
}
