import skillPackage from '@/packages/promptminder-cli/lib/skill-package';
import { ApiError, assert } from '@/lib/api-error';
import { canRedistributeSkill } from '@/lib/skills-sync';

export const { decodeSkillFile, mergeSkillFiles } = skillPackage;

export function normalizeSkillPackage(value) {
  try { return skillPackage.normalizeSkillPackage(value); }
  catch (error) { throw new ApiError(400, error.message); }
}

// The prompt body is the canonical SKILL.md; attachments are never implicitly removed.
export function resolveSkillPackage(payload, current = {}) {
  const value = payload.skill_package === undefined ? current.skill_package : payload.skill_package;
  assert(!current.skill_package || value, 400, 'An existing Skill package cannot be removed.');
  if (value == null) return null;
  const normalized = normalizeSkillPackage(value);
  if (payload.content !== undefined) {
    return normalizeSkillPackage({ ...normalized, files: normalized.files.map((file) => (
      file.path === 'SKILL.md' ? { ...file, contents: payload.content } : file
    )) });
  }
  return normalized;
}

export function catalogSkillPackage(skill) {
  assert(skill, 404, 'Skill not found.');
  assert(skill.content && canRedistributeSkill(skill), 403, 'This Skill is not available for import.');
  const files = skill.files.map((file) => ({ ...file, executable: file.executable ?? file.contents.startsWith('#!') }));
  const main = files.find((file) => file.path === 'SKILL.md');
  assert(!main || main.contents === skill.content, 409, 'Inconsistent catalog snapshot.');
  if (!main) files.unshift({ path: 'SKILL.md', contents: skill.content });
  return normalizeSkillPackage({ format: 1, files, source: {
    catalog_id: skill.id, url: skill.installUrl, license: skill.licenseSpdx,
    revision: skill.contentHash, synced_at: String(skill.syncedAt),
    scope: 'Stored text-file snapshot; may omit upstream files or binary assets.',
  } });
}
