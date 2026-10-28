import { NextRequest } from 'next/server'
import { POST } from '@/app/api/contributions/route.js'
import { db } from '@/lib/db.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn().mockResolvedValue('test-user-id'),
}))
jest.mock('@/lib/db.js', () => ({
  db: { insert: jest.fn() },
}))
jest.mock('@/drizzle/schema/index.js', () => ({ promptContributions: {} }))

describe('/api/contributions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.insert.mockReturnValue({
      values: jest.fn(() => ({
        returning: jest.fn().mockResolvedValue([{
          id: 'generated-uuid', title: 'Test prompt', roleCategory: 'Developer', content: 'Content',
          language: 'zh', contributorEmail: null, contributorName: null, status: 'pending',
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        }]),
      })),
    })
  })

  it('validates required fields before writing', async () => {
    const request = new NextRequest('http://localhost/api/contributions', {
      method: 'POST', body: JSON.stringify({ role: 'Developer', content: 'Content' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Title is required' })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('creates a contribution in the current Drizzle schema', async () => {
    const request = new NextRequest('http://localhost/api/contributions', {
      method: 'POST', body: JSON.stringify({ title: 'Test prompt', role: 'Developer', content: 'Content' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      message: 'Contribution submitted successfully', id: 'generated-uuid', status: 'pending',
    })
  })
})
