import { createMockDb } from '../helpers/mock-drizzle.js'
import { TeamService } from '@/lib/team-service.js'
import { createChangeRequest, createPromptDirect, ensureLineage, isTeamApprovalEnabled } from '@/lib/prompt-workflow.js'
import { prepareSkillVersion } from '@/lib/skill-version.js'
import { createMcpPrompt, deleteMcpPrompt, updateMcpPrompt } from '@/lib/mcp/mutations.js'

jest.mock('@/lib/db.js', () => ({
  db: {},
}))

jest.mock('@/lib/prompt-workflow.js', () => {
  const actual = jest.requireActual('@/lib/prompt-workflow.js')
  return {
    ...actual,
    createPromptDirect: jest.fn(),
    createChangeRequest: jest.fn(),
    ensureLineage: jest.fn(),
    isTeamApprovalEnabled: jest.fn(),
  }
})

jest.mock('@/lib/skill-version.js', () => ({
  prepareSkillVersion: jest.fn(),
}))

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
  {
    status: 'active',
    role: 'admin',
    team: { id: 'team-2', name: 'Studio', is_personal: false, description: '' },
  },
]

const personalPrompt = {
  id: 'prompt-1',
  title: 'Code Review',
  description: 'Review PRs',
  tags: 'dev',
  version: '1.0.0',
  teamId: null,
  content: 'Review this diff carefully.',
  updatedAt: '2026-09-18T00:00:00.000Z',
  createdBy: 'user-1',
  userId: 'user-1',
  lineageId: 'line-1',
  skillPackage: null,
  projectId: null,
}

describe('MCP prompt mutations', () => {
  let db

  beforeEach(() => {
    db = createMockDb()
    jest.spyOn(TeamService.prototype, 'listTeamsForUser').mockResolvedValue(memberships)
    createPromptDirect.mockReset()
    createChangeRequest.mockReset()
    ensureLineage.mockReset()
    isTeamApprovalEnabled.mockReset()
    prepareSkillVersion.mockReset()
    isTeamApprovalEnabled.mockResolvedValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('应该在个人空间直接创建提示词', async () => {
    createPromptDirect.mockResolvedValue({
      id: 'prompt-new',
      title: 'Weekly report',
      description: '',
      tags: 'writing',
      version: '1.0.0',
      team_id: null,
      content: 'Write the weekly report.',
    })

    const result = await createMcpPrompt('user-1', {
      title: 'Weekly report',
      content: 'Write the weekly report.',
      tags: 'writing',
      version: '1.0.0',
      db,
    })

    expect(result.mode).toBe('created')
    expect(result.prompt).toMatchObject({
      id: 'prompt-new',
      title: 'Weekly report',
      content: 'Write the weekly report.',
    })
    expect(createPromptDirect).toHaveBeenCalledWith(db, {
      teamId: null,
      userId: 'user-1',
      data: {
        title: 'Weekly report',
        content: 'Write the weekly report.',
        description: null,
        tags: 'writing',
        version: '1.0.0',
      },
    })
  })

  it('开启审批的团队创建时应返回待审批请求', async () => {
    isTeamApprovalEnabled.mockResolvedValue(true)
    ensureLineage.mockResolvedValue('line-9')
    createChangeRequest.mockResolvedValue({
      id: 'cr-1',
      status: 'pending',
      request_type: 'create_prompt',
      proposed_title: 'Team prompt',
    })

    const result = await createMcpPrompt('user-1', {
      title: 'Team prompt',
      content: 'Shared content',
      teamId: 'team-1',
      db,
    })

    expect(result.mode).toBe('approval_required')
    expect(result.change_request).toMatchObject({ id: 'cr-1', status: 'pending' })
    expect(createPromptDirect).not.toHaveBeenCalled()
  })

  it('缺少标题或内容时应拒绝创建', async () => {
    await expect(createMcpPrompt('user-1', { title: '  ', content: 'body', db }))
      .rejects.toThrow('Title is required')
    await expect(createMcpPrompt('user-1', { title: 'Title', content: '', db }))
      .rejects.toThrow('Content is required')
  })

  it('应该更新自己的个人提示词', async () => {
    db.enqueueSelect([personalPrompt])
    prepareSkillVersion.mockResolvedValue({
      title: 'Code Review v2',
      content: 'Review this diff more carefully.',
      description: 'Review PRs',
      tags: 'dev',
      version: '1.0.1',
      skill_package: null,
    })

    const result = await updateMcpPrompt('user-1', {
      id: 'prompt-1',
      title: 'Code Review v2',
      content: 'Review this diff more carefully.',
      version: '1.0.1',
      db,
    })

    expect(result.mode).toBe('updated')
    expect(result.prompt.title).toBe('Code Review v2')
    expect(result.prompt.content).toBe('Review this diff more carefully.')
    expect(db.update).toHaveBeenCalled()
  })

  it('未提供任何变更字段时应拒绝更新', async () => {
    await expect(updateMcpPrompt('user-1', { id: 'prompt-1', db }))
      .rejects.toThrow('At least one field to update is required')
  })

  it('非创建者且非管理员更新团队提示词时应拒绝', async () => {
    db.enqueueSelect([{
      ...personalPrompt,
      id: 'prompt-team',
      teamId: 'team-1',
      createdBy: 'other-user',
      userId: 'other-user',
    }])

    await expect(updateMcpPrompt('user-1', {
      id: 'prompt-team',
      teamId: 'team-1',
      title: 'Nope',
      db,
    })).rejects.toThrow('Only the creator or team managers can update this prompt')
  })

  it('应该删除自己的提示词', async () => {
    db.enqueueSelect([personalPrompt])

    const result = await deleteMcpPrompt('user-1', {
      id: 'prompt-1',
      confirm: true,
      db,
    })

    expect(result).toEqual({
      mode: 'deleted',
      id: 'prompt-1',
      title: 'Code Review',
    })
    expect(db.delete).toHaveBeenCalled()
  })

  it('未确认删除时应拒绝', async () => {
    await expect(deleteMcpPrompt('user-1', { id: 'prompt-1', db }))
      .rejects.toThrow('Set confirm=true to permanently delete this prompt')
    expect(db.delete).not.toHaveBeenCalled()
  })

  it('非创建者删除团队提示词时应拒绝', async () => {
    db.enqueueSelect([{
      ...personalPrompt,
      id: 'prompt-team',
      teamId: 'team-1',
      createdBy: 'other-user',
      userId: 'other-user',
    }])

    await expect(deleteMcpPrompt('user-1', {
      id: 'prompt-team',
      teamId: 'team-1',
      confirm: true,
      db,
    })).rejects.toThrow('Only the creator or team managers can delete this prompt')
  })
})
