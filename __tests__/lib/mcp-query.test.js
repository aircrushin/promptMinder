import { isUuid, parsePromptQuery, rankPrompt, sanitizeLikeTerm, slugify } from '@/lib/mcp/query.js'

describe('MCP prompt query parser', () => {
  it('应该把斜杠快捷方式解析成标题搜索', () => {
    expect(parsePromptQuery('/code-review')).toEqual({
      raw: '/code-review',
      shortcut: 'code-review',
      search: 'code review',
      tag: null,
      id: null,
      teamId: null,
    })
  })

  it('应该解析标签、团队和模糊中文查询', () => {
    expect(parsePromptQuery('tag:writing 帮我找周报')).toMatchObject({
      tag: 'writing',
      search: '帮我找周报',
    })
    expect(parsePromptQuery('#sql /weekly-report')).toMatchObject({
      tag: 'sql',
      shortcut: 'weekly-report',
      search: 'weekly report',
    })
    expect(parsePromptQuery('team:11111111-1111-4111-8111-111111111111 周报')).toMatchObject({
      teamId: '11111111-1111-4111-8111-111111111111',
      search: '周报',
    })
  })

  it('应该把完整 UUID 当成精确 id', () => {
    const id = '2c9c1b3a-4d5e-4f6a-8b7c-1234567890ab'
    expect(parsePromptQuery(id)).toMatchObject({ id, search: '' })
    expect(parsePromptQuery(`id:${id}`)).toMatchObject({ id, search: '' })
    expect(isUuid(id)).toBe(true)
  })

  it('空查询应返回空结构', () => {
    expect(parsePromptQuery('   ')).toEqual({
      raw: '',
      shortcut: null,
      search: '',
      tag: null,
      id: null,
      teamId: null,
    })
  })

  it('空的结构化 token 应被忽略', () => {
    expect(parsePromptQuery('tag: 帮我找周报')).toMatchObject({
      tag: null,
      search: 'tag: 帮我找周报',
    })
  })

  it('应该给斜杠标题匹配更高分', () => {
    const parsed = parsePromptQuery('/code-review')
    const exact = rankPrompt({ id: '1', title: 'Code Review', tags: 'dev' }, parsed)
    const fuzzy = rankPrompt({ id: '2', title: 'Review checklist', tags: 'dev' }, parsed)
    const tagged = rankPrompt({ id: '3', title: 'Other', tags: 'code-review', description: 'code review notes' }, parsed)
    expect(exact).toBeGreaterThan(fuzzy)
    expect(tagged).toBeGreaterThan(0)
    expect(rankPrompt({ id: parsed.id || 'x', title: 'Any' }, { ...parsed, id: 'x' })).toBe(1000)
  })

  it('应该清理 LIKE 通配符并生成 slug', () => {
    expect(sanitizeLikeTerm('100%_off')).toBe('100 off')
    expect(slugify('Code Review Helper')).toBe('code-review-helper')
  })
})
