import { and, desc, eq } from 'drizzle-orm';
import { prompts } from '@/drizzle/schema';
import { buildPromptAccessScope } from '@/lib/prompt-workflow';
import { resolveSkillPackage } from '@/lib/skill-package';
import { allocateNextVersion } from '@/lib/prompt-versions';
import { assert } from '@/lib/api-error';

export async function prepareSkillVersion(db, payload, prompt, { teamId, userId }) {
  const skill = resolveSkillPackage(payload, prompt);
  const proposal = {
    title: payload.title ?? prompt.title,
    content: skill ? skill.files.find((file) => file.path === 'SKILL.md').contents : payload.content ?? prompt.content,
    description: payload.description ?? prompt.description,
    tags: payload.tags ?? prompt.tags,
    version: payload.version ?? prompt.version,
    projectId: payload.projectId ?? prompt.project_id ?? null,
    skill_package: skill,
  };
  if (skill) {
    const versions = await db.select({ version: prompts.version }).from(prompts)
      .where(and(eq(prompts.lineageId, prompt.lineage_id), buildPromptAccessScope({ teamId, userId })))
      .orderBy(desc(prompts.createdAt));
    if (!payload.version || payload.version === prompt.version) {
      proposal.version = allocateNextVersion(versions.map((row) => row.version), versions[0]?.version);
    } else {
      assert(typeof payload.version === 'string' && payload.version.length <= 100
        && !versions.some((row) => row.version === payload.version), 409, 'Version already exists or is invalid.');
    }
  }
  return proposal;
}
