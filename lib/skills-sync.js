import skillPackage from '../packages/promptminder-cli/lib/skill-package.js';
export const { parseSkillFrontmatter } = skillPackage;

export const REDISTRIBUTABLE_LICENSES = new Set([
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'Unlicense',
])

export function assessSkillAudits(audits = [], { curated = false } = {}) {
  if (!audits.length) {
    return {
      status: curated ? 'curated' : 'unreviewed',
      summary: curated ? 'Official curated source' : 'No security audit available',
    }
  }

  const blocked = audits.some((audit) =>
    audit.status === 'fail' || ['HIGH', 'CRITICAL'].includes(audit.riskLevel)
  )
  const review = audits.some((audit) =>
    audit.status === 'warn' || audit.riskLevel === 'MEDIUM'
  )

  return {
    status: blocked ? 'blocked' : review ? 'review' : 'passed',
    summary: audits
      .map((audit) => `${audit.provider}: ${audit.summary || audit.status}`)
      .join(' · ')
      .slice(0, 1000),
  }
}

export function canRedistributeSkill({ licenseSpdx, auditStatus }) {
  return REDISTRIBUTABLE_LICENSES.has(licenseSpdx) &&
    ['curated', 'passed'].includes(auditStatus)
}

/**
 * Resolve the package URL used by `npx skills add/use`, matching skills.sh.
 * Prefers installUrl; falls back to https://github.com/<owner>/<repo> for GitHub sources.
 */
export function resolveSkillPackageUrl({ source, sourceType, installUrl } = {}) {
  if (typeof installUrl === 'string' && installUrl.trim()) {
    return installUrl.trim().replace(/\/+$/, '')
  }
  if (sourceType === 'github' && typeof source === 'string' && /^[^/]+\/[^/]+$/.test(source)) {
    return `https://github.com/${source}`
  }
  return null
}

/**
 * Build Command + Prompt install snippets for a skill ID, matching skills.sh.
 *
 * Command: npx skills add https://github.com/<owner>/<repo> --skill <slug>
 * Prompt:  Run `npx skills use "..." --skill "..."` and follow the generated skill instructions...
 */
export function buildSkillInstallMethods({ slug, source, sourceType, installUrl } = {}) {
  if (typeof slug !== 'string' || !slug.trim()) return null

  const packageUrl = resolveSkillPackageUrl({ source, sourceType, installUrl })
  if (!packageUrl) return null

  const skillId = slug.trim()
  return {
    command: `npx skills add ${packageUrl} --skill ${skillId}`,
    prompt: `Run \`npx skills use "${packageUrl}" --skill "${skillId}"\` and follow the generated skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary. Resolve relative paths from the supporting-files directory it provides.`,
  }
}
