import { createMockDb } from '../helpers/mock-drizzle.js'
import { TeamService } from '@/lib/team-service.js'
import {
  buildMcpPromptAccessScope,
  getMcpPrompt,
  listMcpWorkspaces,
  resolveMcpPromptContent,
  searchMcpPrompts,
} from '@/lib/mcp/prompts.js'

jest.mock('@/lib/db.js', () => ({
  db: {},
}))

function collectSqlText(node, parts = []) {
  if (!node || typeof node !== 'object') {
    return parts
  }
  if (typeof node.name === 'string') {
    parts.push(node.name)
  }
  if (typeof node.value === 'string') {
    parts.push(node.value)
  } else if (Array.isArray(node.value)) {
    node.value.forEach((chunk) => {
      if (typeof chunk === 'string') {
        parts.push(chunk)
      }
    })
  }
  if (Array.isArray(node.queryChunks)) {
    node.queryChunks.forEach((chunk) => collectSqlText(chunk, parts))
  }
  return parts
}

const memberships = [
  {
    status: 'active',
    role: 'owner',
    team: { id: 'personal-1', name: 'Personal', is_personal: true, description: '' },
  },
  {
    status: 'active',
    role: 'member',
    team: { id: 'team-1', name: 'Acme', is_personal: false, description: 'Work' },
  },
]

describe('MCP prompt lookup', () => {
  let db

  beforeEach(() => {
    db = createMockDb()
    jest.spyOn(TeamService.prototype, 'listTeamsForUser').mockResolvedValue(memberships)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('未指定团队时应同时覆盖个人空间和共享团队', () => {
    const scope = buildMcpPromptAccessScope({
      userId: 'user-1',
      teamId: null,
      teamIds: ['team-1'],
    })
    const sqlText = collectSqlText(scope).join('').toLowerCase()
    expect(sqlText).toContain('team_id')
    expect(sqlText).toContain('is null')
    expect(sqlText).toContain('created_by')
  })

  it('应该列出个人空间和共享团队', async () => {
    const result = await listMcpWorkspaces('user-1', { db })
    expect(result.workspaces).toEqual([
      expect.objectContaining({ id: null, is_personal: true, name: 'Personal' }),
      expect.objectContaining({ id: 'team-1', name: 'Acme', role: 'member' }),
    ])
  })

  it('应该按斜杠快捷方式搜索并返回摘要', async () => {
    db.enqueueSelect([
      {
        id: 'prompt-1',
        title: 'Code Review',
        description: 'Review PRs',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
      {
        id: 'prompt-2',
        title: 'Weekly report',
        description: 'Status update',
        tags: 'writing',
        version: '1.0.0',
        teamId: 'team-1',
        updatedAt: '2026-09-17T00:00:00.000Z',
      },
    ])

    const result = await searchMcpPrompts('user-1', { query: '/code-review', db })
    expect(result.matches[0]).toMatchObject({
      id: 'prompt-1',
      title: 'Code Review',
    })
    expect(result.matches[0].content).toBeUndefined()
    expect(result.matches[0].score).toBeGreaterThan(result.matches[1].score)
  })

  it('应该按 id 返回完整提示词内容', async () => {
    db.enqueueSelect([
      {
        id: 'prompt-1',
        title: 'Code Review',
        description: 'Review PRs',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        content: 'Review this diff carefully.',
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
    ])

    const prompt = await getMcpPrompt('user-1', { id: 'prompt-1', db })
    expect(prompt).toMatchObject({
      id: 'prompt-1',
      content: 'Review this diff carefully.',
    })
  })

  it('找不到提示词时应返回 404', async () => {
    db.enqueueSelect([])
    await expect(getMcpPrompt('user-1', { id: 'missing', db })).rejects.toThrow('Prompt not found')
  })

  it('缺少 id 时应返回 400', async () => {
    await expect(getMcpPrompt('user-1', { db })).rejects.toThrow('Prompt id is required')
  })

  it('指定共享团队时应只按 team_id 过滤', () => {
    const scope = buildMcpPromptAccessScope({ userId: 'user-1', teamId: 'team-1' })
    const sqlText = collectSqlText(scope).join('').toLowerCase()
    expect(sqlText).toContain('team_id')
    expect(sqlText).not.toContain('is null')
  })

  it('没有共享团队时应退回个人空间', () => {
    const scope = buildMcpPromptAccessScope({ userId: 'user-1', teamIds: [] })
    const sqlText = collectSqlText(scope).join('').toLowerCase()
    expect(sqlText).toContain('is null')
  })

  it('指定个人团队 id 时应按个人空间搜索', async () => {
    db.enqueueSelect([])
    const result = await searchMcpPrompts('user-1', { query: 'sql', teamId: 'personal-1', db })
    expect(result.matches).toEqual([])
    expect(result.hint).toMatch(/No prompts matched/)
  })

  it('非成员访问指定团队时应拒绝', async () => {
    await expect(searchMcpPrompts('user-1', { query: 'sql', teamId: 'team-missing', db }))
      .rejects.toThrow('You are not a member of this team')
  })

  it('查询里的 id 命中时应直接返回完整内容', async () => {
    db.enqueueSelect([
      {
        id: '2c9c1b3a-4d5e-4f6a-8b7c-1234567890ab',
        title: 'SQL helper',
        description: 'Write SQL',
        tags: 'sql',
        version: '1.0.0',
        teamId: null,
        content: 'Write careful SQL.',
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
    ])

    const result = await searchMcpPrompts('user-1', {
      query: 'id:2c9c1b3a-4d5e-4f6a-8b7c-1234567890ab',
      db,
    })
    expect(result.total).toBe(1)
    expect(result.matches[0].content).toBe('Write careful SQL.')
  })

  it('查询里的 id 不存在时应返回空结果', async () => {
    db.enqueueSelect([])
    const result = await searchMcpPrompts('user-1', {
      query: 'id:2c9c1b3a-4d5e-4f6a-8b7c-1234567890ab',
      db,
    })
    expect(result).toEqual({
      query: expect.objectContaining({ id: '2c9c1b3a-4d5e-4f6a-8b7c-1234567890ab' }),
      matches: [],
      total: 0,
    })
  })

  it('唯一高匹配时应直接取出完整提示词', async () => {
    db.enqueueSelect([
      {
        id: 'prompt-1',
        title: 'Code Review',
        description: 'Review PRs',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
    ])
    db.enqueueSelect([
      {
        id: 'prompt-1',
        title: 'Code Review',
        description: 'Review PRs',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        content: 'Review this diff carefully.',
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
    ])

    const resolved = await resolveMcpPromptContent('user-1', { query: '/code-review', db })
    expect(resolved.mode).toBe('exact')
    expect(resolved.prompt.content).toBe('Review this diff carefully.')
  })

  it('多个匹配时应返回候选项', async () => {
    db.enqueueSelect([
      {
        id: 'prompt-1',
        title: 'Review A',
        description: '',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
      {
        id: 'prompt-2',
        title: 'Review B',
        description: '',
        tags: 'dev',
        version: '1.0.0',
        teamId: null,
        updatedAt: '2026-09-17T00:00:00.000Z',
      },
    ])

    const resolved = await resolveMcpPromptContent('user-1', { query: 'review', db })
    expect(resolved.mode).toBe('choices')
    expect(resolved.matches).toHaveLength(2)
  })
})
