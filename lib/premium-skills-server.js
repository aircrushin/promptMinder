import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPremiumSkillMeta } from '@/lib/premium-skills-data'

async function readPremiumContent(slug) {
  switch (slug) {
    case 'prompt-architect':
      return readFile(path.join(process.cwd(), 'skills', 'premium', 'prompt-architect', 'SKILL.md'), 'utf8')
    case 'research-synthesizer':
      return readFile(path.join(process.cwd(), 'skills', 'premium', 'research-synthesizer', 'SKILL.md'), 'utf8')
    case 'evaluation-lab':
      return readFile(path.join(process.cwd(), 'skills', 'premium', 'evaluation-lab', 'SKILL.md'), 'utf8')
    case 'agent-launch-checklist':
      return readFile(path.join(process.cwd(), 'skills', 'premium', 'agent-launch-checklist', 'SKILL.md'), 'utf8')
    case 'content-repurposer':
      return readFile(path.join(process.cwd(), 'skills', 'premium', 'content-repurposer', 'SKILL.md'), 'utf8')
    default:
      return null
  }
}

export async function getPremiumSkill(slug) {
  const meta = getPremiumSkillMeta(slug)
  if (!meta) return null

  const content = await readPremiumContent(slug)
  if (!content) return null
  return { ...meta, content }
}
