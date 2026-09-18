import { createMockDb } from '../helpers/mock-drizzle.js'
import { TeamService } from '@/lib/team-service.js'
import {
  buildMcpPromptAccessScope,
  getMcpPrompt,
  listMcpWorkspaces,
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
})
