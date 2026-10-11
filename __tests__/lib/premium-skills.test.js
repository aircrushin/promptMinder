import fs from 'node:fs'
import path from 'node:path'
import { getPremiumSkillMeta, PREMIUM_COLLECTION, PREMIUM_INTENT_LEVELS } from '@/lib/premium-skills-data'

describe('Premium Collection', () => {
  test('ships five distinct curated skills with reviewable source files', () => {
    expect(PREMIUM_COLLECTION.skills).toHaveLength(5)
    expect(new Set(PREMIUM_COLLECTION.skills.map((skill) => skill.slug)).size).toBe(5)

    for (const skill of PREMIUM_COLLECTION.skills) {
      const filePath = path.join(process.cwd(), 'skills', 'premium', skill.slug, 'SKILL.md')
      expect(fs.existsSync(filePath)).toBe(true)
      expect(fs.readFileSync(filePath, 'utf8')).toMatch(new RegExp(`^---\\nname: ${skill.slug}\\n`))
      expect(getPremiumSkillMeta(skill.slug)).toEqual(skill)
    }
  })

  test('offers explicit intent levels for the waitlist experiment', () => {
    expect(PREMIUM_INTENT_LEVELS.map((level) => level.value)).toEqual([
      'notify',
      'early_access',
      'ready_to_buy',
    ])
  })
})
