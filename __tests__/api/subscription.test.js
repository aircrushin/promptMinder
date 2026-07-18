/** @jest-environment node */

import { NextRequest } from 'next/server'
import { DELETE, GET, POST } from '@/app/api/prompts/[id]/subscription/me/route'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import {
  WORKFLOW_EVENT_TYPES,
  addSubscription,
  getPromptByScope,
  getSubscriptionState,
  recordWorkflowEvent,
  removeSubscription,
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
    SUBSCRIPTION_CREATED: 'subscription_created',
    SUBSCRIPTION_REMOVED: 'subscription_removed',
  },
  addSubscription: jest.fn(),
  getPromptByScope: jest.fn(),
  getSubscriptionState: jest.fn(),
  recordWorkflowEvent: jest.fn(),
  removeSubscription: jest.fn(),
}))

describe('/api/prompts/[id]/subscription/me', () => {
  const teamService = createTeamServiceMock()
  const db = { tag: 'mock-db' }

  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
  })

  it('个人空间 GET 应返回未订阅', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: null,
      db,
      teamService,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me'),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ subscribed: false })
  })

  it('应该返回团队空间订阅状态', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
    getPromptByScope.mockResolvedValue({ id: 'p1', lineage_id: 'line-1' })
    getSubscriptionState.mockResolvedValue(true)

    const response = await GET(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me'),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.subscribed).toBe(true)
  })

  it('个人空间不允许订阅', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: null,
      db,
      teamService,
    })

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me', { method: 'POST' }),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toMatch(/team workspaces/i)
  })

  it('应该订阅提示词变更', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
    getPromptByScope.mockResolvedValue({ id: 'p1', lineage_id: 'line-1' })
    addSubscription.mockResolvedValue(undefined)
    recordWorkflowEvent.mockResolvedValue(undefined)

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me', { method: 'POST' }),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(addSubscription).toHaveBeenCalledWith(db, {
      teamId: 'team-1',
      lineageId: 'line-1',
      userId: 'user-1',
    })
    expect(recordWorkflowEvent).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        eventType: WORKFLOW_EVENT_TYPES.SUBSCRIPTION_CREATED,
        actorUserId: 'user-1',
      })
    )
    expect(data).toEqual({ subscribed: true })
  })

  it('应该取消订阅', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
    getPromptByScope.mockResolvedValue({ id: 'p1', lineage_id: 'line-1' })
    removeSubscription.mockResolvedValue(undefined)
    recordWorkflowEvent.mockResolvedValue(undefined)

    const response = await DELETE(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(removeSubscription).toHaveBeenCalledWith(db, {
      teamId: 'team-1',
      lineageId: 'line-1',
      userId: 'user-1',
    })
    expect(data).toEqual({ subscribed: false })
  })

  it('提示词不存在时应返回 404', async () => {
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
    getPromptByScope.mockResolvedValue(null)

    const response = await POST(
      new NextRequest('http://localhost/api/prompts/p1/subscription/me', { method: 'POST' }),
      { params: Promise.resolve({ id: 'p1' }) }
    )
    expect(response.status).toBe(404)
  })
})
