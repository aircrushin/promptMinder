import {
  assessSkillAudits,
  canRedistributeSkill,
  parseSkillFrontmatter,
} from '@/lib/skills-sync.js'

describe('skills sync policy', () => {
  it('应该解析 Skill 的名称和多行描述', () => {
    expect(parseSkillFrontmatter(`---
name: "release-notes"
description: >
  Generate release notes
  from git history.
---
# Instructions`)).toEqual({
      name: 'release-notes',
      description: 'Generate release notes from git history.',
    })
  })

  it('应该拒绝高风险或许可证不明确的内容同步', () => {
    const blocked = assessSkillAudits([
      { provider: 'Scanner', status: 'fail', riskLevel: 'HIGH', summary: 'Unsafe command' },
    ])

    expect(blocked.status).toBe('blocked')
    expect(canRedistributeSkill({ licenseSpdx: 'MIT', auditStatus: blocked.status })).toBe(false)
    expect(canRedistributeSkill({ licenseSpdx: 'NOASSERTION', auditStatus: 'passed' })).toBe(false)
    expect(canRedistributeSkill({ licenseSpdx: 'Apache-2.0', auditStatus: 'passed' })).toBe(true)
  })

  it('应该允许许可证明确的官方精选 Skill', () => {
    const assessment = assessSkillAudits([], { curated: true })

    expect(assessment.status).toBe('curated')
    expect(canRedistributeSkill({ licenseSpdx: 'MIT', auditStatus: assessment.status })).toBe(true)
  })
})
