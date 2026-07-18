/** @jest-environment node */

import { GET, POST } from '@/app/api/cli-tokens/route'
import { DELETE } from '@/app/api/cli-tokens/[id]/route'
import { requireUserId } from '@/lib/auth.js'
import { db } from '@/lib/db.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('@/lib/db.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}))

describe('/api/cli-tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user_123')
  })

  it('应该返回当前用户的 CLI token 列表', async () => {
    const orderBy = jest.fn().mockResolvedValue([
      {
        id: 'token-1',
        name: 'agent-prod',
        createdAt: '2026-04-04T10:00:00.000Z',
        lastUsedAt: null,
        revokedAt: null,
      },
    ])
    const where = jest.fn().mockReturnValue({ orderBy })
    const from = jest.fn().mockReturnValue({ where })
    db.select.mockReturnValue({ from })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      tokens: [
        {
          id: 'token-1',
          name: 'agent-prod',
          created_at: '2026-04-04T10:00:00.000Z',
          last_used_at: null,
          revoked_at: null,
          is_revoked: false,
        },
      ],
    })
  })

  it('应该创建 CLI token 并返回一次性明文', async () => {
    const returning = jest.fn().mockResolvedValue([
      {
        id: 'token-2',
        name: 'agent-prod',
        createdAt: '2026-04-04T10:00:00.000Z',
        lastUsedAt: null,
        revokedAt: null,
      },
    ])
    const values = jest.fn().mockReturnValue({ returning })
    db.insert.mockReturnValue({ values })

    const request = {
      json: jest.fn().mockResolvedValue({ name: 'agent-prod' }),
    }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.token).toEqual({
      id: 'token-2',
      name: 'agent-prod',
      created_at: '2026-04-04T10:00:00.000Z',
      last_used_at: null,
      revoked_at: null,
      is_revoked: false,
    })
    expect(data.plain_text_token).toMatch(/^pm_[a-f0-9]{48}$/)
  })

  it('应该拒绝空的 token 名称', async () => {
    const request = {
      json: jest.fn().mockResolvedValue({ name: '   ' }),
    }

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Token name is required')
  })

  it('应该删除当前用户的 token', async () => {
    const returning = jest.fn().mockResolvedValue([{ id: 'token-3' }])
    const where = jest.fn().mockReturnValue({ returning })
    const set = jest.fn().mockReturnValue({ where })
    db.update.mockReturnValue({ set })

    const response = await DELETE({}, { params: Promise.resolve({ id: 'token-3' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ success: true })
  })
})
