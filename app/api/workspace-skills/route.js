import { NextResponse } from 'next/server';
import { and, desc, ilike, isNotNull } from 'drizzle-orm';
import { prompts } from '@/drizzle/schema';
import { requireUserId } from '@/lib/auth';
import { resolveTeamContext } from '@/lib/team-request';
import { buildPromptAccessScope, createChangeRequest, createPromptDirect, ensureLineage, isTeamApprovalEnabled } from '@/lib/prompt-workflow';
import { catalogSkillPackage, normalizeSkillPackage } from '@/lib/skill-package';
import { parseSkillFrontmatter } from '@/lib/skills-sync';
import { getCatalogSkill } from '@/lib/skills-catalog';
import { handleApiError } from '@/lib/handle-api-error';
import { assert } from '@/lib/api-error';

export async function GET(request) {
  try {
    const userId = await requireUserId(request);
    const { db, teamId, teamService } = await resolveTeamContext(request, userId, { requireMembership: false, allowMissingTeam: true });
    if (teamId) await teamService.requireMembership(teamId, userId);
    const search = new URL(request.url).searchParams.get('search')?.slice(0, 100);
    const rows = await db.select({ id: prompts.id, title: prompts.title, description: prompts.description, version: prompts.version, lineage_id: prompts.lineageId })
      .from(prompts).where(and(buildPromptAccessScope({ teamId, userId }), isNotNull(prompts.skillPackage), search ? ilike(prompts.title, `%${search}%`) : undefined))
      .orderBy(desc(prompts.createdAt)).limit(200);
    return NextResponse.json({ skills: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return handleApiError(error, 'Unable to list workspace Skills.'); }
}

export async function POST(request) {
  try {
    const userId = await requireUserId(request);
    const { db, teamId, teamService } = await resolveTeamContext(request, userId, { requireMembership: false, allowMissingTeam: true });
    if (teamId) await teamService.requireMembership(teamId, userId);
    const payload = await request.json();
    const skill = payload.catalog_id
      ? catalogSkillPackage(await getCatalogSkill(payload.catalog_id))
      : normalizeSkillPackage(payload.skill_package);
    const content = skill.files.find((file) => file.path === 'SKILL.md').contents;
    const metadata = parseSkillFrontmatter(content);
    const title = payload.title || metadata.name;
    assert(typeof title === 'string' && title.trim() && title.length <= 200, 400, 'Invalid Skill title.');
    assert(!payload.version || (typeof payload.version === 'string' && payload.version.length <= 100), 400, 'Invalid version.');
    const data = { title, content, description: metadata.description, version: payload.version || '1.0.0', skill_package: skill, is_public: false };
    if (await isTeamApprovalEnabled(db, teamId)) {
      const lineageId = await ensureLineage(db, { teamId, userId, title });
      const changeRequest = await createChangeRequest(db, { teamId, lineageId, requestType: 'create_prompt', submitterUserId: userId, proposal: data });
      return NextResponse.json({ mode: 'approval_required', change_request: changeRequest }, { status: 201 });
    }
    return NextResponse.json({ prompt: await createPromptDirect(db, { teamId, userId, data }) }, { status: 201 });
  } catch (error) { return handleApiError(error, 'Unable to import workspace Skill.'); }
}
