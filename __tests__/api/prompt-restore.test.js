/** @jest-environment node */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/prompts/[id]/restore/route'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import {
  createChangeRequest,
  createPromptDirect,
  getPromptByScope,
  isTeamApprovalEnabled,
  recordWorkflowEvent,
} from '@/lib/prompt-workflow.js'
import { createTeamServiceMock } from '../helpers/mock-drizzle.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('@/lib/team-request.js', () => ({
  resolveTeamContext: jest.fn(),
}))

jest.mock('@/lib/prompt-workflow.js', () => ({
  WORKFLOW_EVENT_TYPES: {
    VERSION_RESTORED: 'version_restored',
  },
  createChangeRequest: jest.fn(),
  createPromptDirect: jest.fn(),
  getPromptByScope: jest.fn(),
  isTeamApprovalEnabled: jest.fn(),
  recordWorkflowEvent: jest.fn(),
}))

describe('/api/prompts/[id]/restore', () => {
  const teamService = createTeamServiceMock({
    requireMembership: jest.fn().mockResolvedValue({ role: 'owner', status: 'active' }),
  })

  const source = {
    id: 'prompt-old',
    title: '助手',
    content: '旧内容',
    description: 'desc',
    tags: 'a,b',
    version: '1.0.0',
    lineage_id: 'line-1',
    project_id: null,
    cover_img: null,
    is_public: false,
    created_by: 'user-1',
    user_id: 'user-1',
    team_id: 'team-1',
  }

  const latest = {
    id: 'prompt-latest',
    title: '助手',
    content: '新内容',
    description: 'desc',
    tags: 'a,b',
    version: '1.1.0',
    lineage_id: 'line-1',
    project_id: null,
    cover_img: null,
    is_public: false,
    created_by: 'user-1',
    user_id: 'user-1',
    team_id: 'team-1',
    created_at: '2026-07-18T10:00:00.000Z',
  }

  function mockSiblingQuery(db, siblings) {
    const orderBy = jest.fn().mockResolvedValue(
      siblings.map((item) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        description: item.description,
        tags: item.tags,
        version: item.version,
        lineageId: item.lineage_id,
        projectId: item.project_id,
        coverImg: item.cover_img,
        isPublic: item.is_public,
        createdBy: item.created_by,
        userId: item.user_id,
        teamId: item.team_id,
        createdAt: item.created_at || '2026-07-18T09:00:00.000Z',
      }))
    )
    const where = jest.fn().mockReturnValue({ orderBy })
    const from = jest.fn().mockReturnValue({ where })
    db.select.mockReturnValue({ from })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
  })

  it('恢复最新版本应返回 409', async () => {
    const db = { select: jest.fn() }
    resolveTeamContext.mockResolvedValue({ teamId: 'team-1', db, teamService })
    getPromptByScope.mockResolvedValue(latest)
    mockSiblingQuery(db, [latest, source])

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/prompt-latest/restore', { method: 'POST' }),
      { params: Promise.resolve({ id: 'prompt-latest' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toMatch(/already the latest/i)
  })

  it('无权限用户不能恢复', async () => {
    const db = { select: jest.fn() }
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService: createTeamServiceMock({
        requireMembership: jest.fn().mockResolvedValue({ role: 'member', status: 'active' }),
      }),
    })
    getPromptByScope.mockResolvedValue({
      ...source,
      created_by: 'other-user',
      user_id: 'other-user',
    })

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/prompt-old/restore', { method: 'POST' }),
      { params: Promise.resolve({ id: 'prompt-old' }) }
    )

    expect(response.status).toBe(403)
  })

  it('开启审批时应提交 change request', async () => {
    const db = { select: jest.fn() }
    resolveTeamContext.mockResolvedValue({ teamId: 'team-1', db, teamService })
    getPromptByScope.mockResolvedValue(source)
    mockSiblingQuery(db, [latest, source])
    isTeamApprovalEnabled.mockResolvedValue(true)
    createChangeRequest.mockResolvedValue({ id: 'cr-restore', status: 'pending' })

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/prompt-old/restore', { method: 'POST' }),
      { params: Promise.resolve({ id: 'prompt-old' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.mode).toBe('approval_required')
    expect(createChangeRequest).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        teamId: 'team-1',
        lineageId: 'line-1',
        requestType: 'create_version',
        proposal: expect.objectContaining({
          content: '旧内容',
          title: '助手',
        }),
      })
    )
    expect(data.change_request.id).toBe('cr-restore')
  })

  it('关闭审批时应直接创建新版本', async () => {
    const db = { select: jest.fn() }
    resolveTeamContext.mockResolvedValue({ teamId: 'team-1', db, teamService })
    getPromptByScope.mockResolvedValue(source)
    mockSiblingQuery(db, [latest, source])
    isTeamApprovalEnabled.mockResolvedValue(false)
    createPromptDirect.mockResolvedValue({
      id: 'prompt-restored',
      version: '1.1.1',
      lineage_id: 'line-1',
      content: '旧内容',
    })
    recordWorkflowEvent.mockResolvedValue(undefined)

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/prompt-old/restore', { method: 'POST' }),
      { params: Promise.resolve({ id: 'prompt-old' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.mode).toBe('restored')
    expect(data.prompt.id).toBe('prompt-restored')
    expect(createPromptDirect).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        teamId: 'team-1',
        lineageId: 'line-1',
        data: expect.objectContaining({
          content: '旧内容',
          version: '1.1.1',
        }),
      })
    )
    expect(recordWorkflowEvent).toHaveBeenCalled()
  })
})
