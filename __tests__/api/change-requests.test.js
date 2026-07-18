/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/change-requests/[requestId]/route'
import { GET as GET_COMMENTS, POST as POST_COMMENT } from '@/app/api/change-requests/[requestId]/comments/route'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import {
  applyChangeRequestAction,
  createCommentOnChangeRequest,
  getChangeRequestById,
  getChangeRequestDetail,
  listCommentsByRequest,
} from '@/lib/prompt-workflow.js'
import { createTeamServiceMock } from '../helpers/mock-drizzle.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('@/lib/team-request.js', () => ({
  resolveTeamContext: jest.fn(),
}))

jest.mock('@/lib/prompt-workflow.js', () => ({
  applyChangeRequestAction: jest.fn(),
  createCommentOnChangeRequest: jest.fn(),
  getChangeRequestById: jest.fn(),
  getChangeRequestDetail: jest.fn(),
  listCommentsByRequest: jest.fn(),
}))

describe('/api/change-requests/[requestId]', () => {
  const teamService = createTeamServiceMock()
  const db = { tag: 'mock-db' }

  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
  })

  it('应该返回审批详情', async () => {
    getChangeRequestDetail.mockResolvedValue({
      request: { id: 'cr-1', team_id: 'team-1', status: 'pending' },
      base_prompt: { id: 'p1', content: 'old' },
    })

    const response = await GET(new NextRequest('http://localhost/api/change-requests/cr-1'), {
      params: Promise.resolve({ requestId: 'cr-1' }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.request.id).toBe('cr-1')
    expect(data.base_prompt.id).toBe('p1')
  })

  it('跨团队访问审批单应返回 404', async () => {
    getChangeRequestDetail.mockResolvedValue({
      request: { id: 'cr-1', team_id: 'other-team' },
      base_prompt: null,
    })

    const response = await GET(new NextRequest('http://localhost/api/change-requests/cr-1'), {
      params: Promise.resolve({ requestId: 'cr-1' }),
    })
    expect(response.status).toBe(404)
  })

  it('缺少 action 时应返回 400', async () => {
    getChangeRequestById.mockResolvedValue({ id: 'cr-1', team_id: 'team-1', status: 'pending' })

    const response = await PATCH(
      new NextRequest('http://localhost/api/change-requests/cr-1', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ requestId: 'cr-1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('action is required')
  })

  it('审批通过前应校验管理员权限', async () => {
    getChangeRequestById.mockResolvedValue({ id: 'cr-1', team_id: 'team-1', status: 'pending' })
    applyChangeRequestAction.mockResolvedValue({
      request: { id: 'cr-1', status: 'approved' },
      published_prompt: { id: 'p-new' },
    })

    const response = await PATCH(
      new NextRequest('http://localhost/api/change-requests/cr-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'approve', review_note: 'LGTM' }),
      }),
      { params: Promise.resolve({ requestId: 'cr-1' }) }
    )
    const data = await response.json()

    expect(teamService.assertManager).toHaveBeenCalledWith('team-1', 'user-1')
    expect(applyChangeRequestAction).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        action: 'approve',
        actorUserId: 'user-1',
        reviewNote: 'LGTM',
      })
    )
    expect(response.status).toBe(200)
    expect(data.published_prompt.id).toBe('p-new')
  })

  it('撤回操作不需要管理员权限', async () => {
    getChangeRequestById.mockResolvedValue({ id: 'cr-1', team_id: 'team-1', status: 'pending' })
    applyChangeRequestAction.mockResolvedValue({
      request: { id: 'cr-1', status: 'withdrawn' },
      published_prompt: null,
    })

    const response = await PATCH(
      new NextRequest('http://localhost/api/change-requests/cr-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'withdraw' }),
      }),
      { params: Promise.resolve({ requestId: 'cr-1' }) }
    )

    expect(teamService.assertManager).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
  })
})

describe('/api/change-requests/[requestId]/comments', () => {
  const teamService = createTeamServiceMock()
  const db = { tag: 'mock-db' }

  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
    resolveTeamContext.mockResolvedValue({
      teamId: 'team-1',
      db,
      teamService,
    })
  })

  it('应该返回评论列表', async () => {
    getChangeRequestById.mockResolvedValue({ id: 'cr-1', team_id: 'team-1' })
    listCommentsByRequest.mockResolvedValue([
      { id: 'c1', content: 'hi', mention_user_ids: ['user-2'] },
    ])

    const response = await GET_COMMENTS(
      new NextRequest('http://localhost/api/change-requests/cr-1/comments'),
      { params: Promise.resolve({ requestId: 'cr-1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.comments[0].mention_user_ids).toEqual(['user-2'])
  })

  it('应该创建带 @提及 的评论', async () => {
    getChangeRequestById.mockResolvedValue({ id: 'cr-1', team_id: 'team-1' })
    createCommentOnChangeRequest.mockResolvedValue({
      id: 'c1',
      content: '请看 @user-2',
      mention_user_ids: ['user-2'],
    })

    const response = await POST_COMMENT(
      new NextRequest('http://localhost/api/change-requests/cr-1/comments', {
        method: 'POST',
        body: JSON.stringify({
          content: '请看 @user-2',
          mention_user_ids: ['user-2'],
        }),
      }),
      { params: Promise.resolve({ requestId: 'cr-1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(createCommentOnChangeRequest).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        content: '请看 @user-2',
        authorUserId: 'user-1',
        mentionUserIds: ['user-2'],
      })
    )
    expect(data.comment.mention_user_ids).toEqual(['user-2'])
  })
})
