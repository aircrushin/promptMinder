import {
  assessSkillAudits,
  buildSkillInstallMethods,
  canRedistributeSkill,
  parseSkillFrontmatter,
  resolveSkillPackageUrl,
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

  it('应该按 skills.sh 格式生成 Command 与 Prompt 安装方式', () => {
    const methods = buildSkillInstallMethods({
      slug: 'find-skills',
      source: 'vercel-labs/skills',
      sourceType: 'github',
      installUrl: 'https://github.com/vercel-labs/skills',
    })

    expect(resolveSkillPackageUrl({
      source: 'vercel-labs/skills',
      sourceType: 'github',
    })).toBe('https://github.com/vercel-labs/skills')

    expect(methods).toEqual({
      command: 'npx skills add https://github.com/vercel-labs/skills --skill find-skills',
      prompt: 'Run `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"` and follow the generated skill instructions now. Read its complete output, redirecting it to a temporary file first if necessary. Resolve relative paths from the supporting-files directory it provides.',
    })
  })

  it('缺少 slug 或安装源时不应生成安装方式', () => {
    expect(buildSkillInstallMethods({
      slug: 'lark-approval',
      source: 'open.feishu.cn',
      sourceType: 'well-known',
      installUrl: null,
    })).toBeNull()

    expect(buildSkillInstallMethods({
      source: 'vercel-labs/skills',
      sourceType: 'github',
    })).toBeNull()
  })
})
