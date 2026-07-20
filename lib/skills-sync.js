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

function cleanYamlValue(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function parseSkillFrontmatter(content = '') {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return {}

  const lines = match[1].split(/\r?\n/)
  const result = {}

  for (let index = 0; index < lines.length; index += 1) {
    const field = lines[index].match(/^(name|description):\s*(.*)$/)
    if (!field) continue

    const [, key, rawValue] = field
    if (rawValue === '|' || rawValue === '>') {
      const parts = []
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        parts.push(lines[index + 1].trim())
        index += 1
      }
      result[key] = parts.join(rawValue === '>' ? ' ' : '\n').trim()
    } else {
      result[key] = cleanYamlValue(rawValue)
    }
  }

  return result
}

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

