import { GET, POST } from '@/app/api/prompts/route'
import { queries } from '@/lib/db/queries'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Mock the queries module
jest.mock('@/lib/db/queries')

// Mock Clerk authentication
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn()
}))

// Mock Supabase for team context
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

// Mock NextRequest
class MockNextRequest {
  constructor(url, options = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this._body = options.body
  }

  async json() {
    return JSON.parse(this._body || '{}')
  }
}

global.NextRequest = MockNextRequest

describe('/api/prompts', () => {
  const mockUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
    auth.mockResolvedValue({ userId: mockUserId })
  })

  describe('GET /api/prompts', () => {
    it('should return prompts list successfully', async () => {
      const mockPrompts = [
        {
          id: 'prompt-1',
          title: 'Test Prompt 1',
          content: 'Content 1',
          userId: mockUserId,
          tags: ['test'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: 'prompt-2',
          title: 'Test Prompt 2',
          content: 'Content 2',
          userId: mockUserId,
          tags: ['development'],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        }
      ]

      queries.prompts.getAll.mockResolvedValue({
        prompts: mockPrompts,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1
        }
      })

      const request = new MockNextRequest('http://localhost:3000/api/prompts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.prompts).toHaveLength(2)
      expect(data.prompts[0].title).toBe('Test Prompt 1')
      expect(data.pagination.total).toBe(2)
      expect(queries.prompts.getAll).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        teamId: null,
        page: 1,
        limit: 10
      }))
    })

    it('should filter prompts by tag', async () => {
      const mockPrompts = [
        {
          id: 'prompt-1',
          title: 'Test Prompt',
          content: 'Content',
          userId: mockUserId,
          tags: ['test'],
          createdAt: new Date()
        }
      ]

      queries.prompts.getAll.mockResolvedValue({
        prompts: mockPrompts,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      })

      const request = new MockNextRequest('http://localhost:3000/api/prompts?tag=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.prompts).toHaveLength(1)
      expect(queries.prompts.getAll).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        tag: 'test'
      }))
    })

    it('should search prompts by keyword', async () => {
      const mockPrompts = [
        {
          id: 'prompt-1',
          title: 'React Component',
          content: 'Create a React component',
          userId: mockUserId,
          tags: ['react'],
          createdAt: new Date()
        }
      ]

      queries.prompts.getAll.mockResolvedValue({
        prompts: mockPrompts,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1
        }
      })

      const request = new MockNextRequest('http://localhost:3000/api/prompts?search=react')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.prompts).toHaveLength(1)
      expect(queries.prompts.getAll).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        search: 'react'
      }))
    })

    it('should handle pagination correctly', async () => {
      const mockPrompts = [
        {
          id: 'prompt-3',
          title: 'Prompt 3',
          content: 'Content 3',
          userId: mockUserId,
          createdAt: new Date()
        }
      ]

      queries.prompts.getAll.mockResolvedValue({
        prompts: mockPrompts,
        pagination: {
          page: 2,
          limit: 2,
          total: 5,
          totalPages: 3
        }
      })

      const request = new MockNextRequest('http://localhost:3000/api/prompts?page=2&limit=2')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(2)
      expect(data.pagination.totalPages).toBe(3)
      expect(queries.prompts.getAll).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        limit: 2
      }))
    })

    it('should return 401 when user is not authenticated', async () => {
      auth.mockResolvedValue({ userId: null })

      const request = new MockNextRequest('http://localhost:3000/api/prompts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      queries.prompts.getAll.mockRejectedValue(new Error('Database connection failed'))

      const request = new MockNextRequest('http://localhost:3000/api/prompts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/prompts', () => {
    it('should create a new prompt successfully', async () => {
      const newPromptData = {
        title: 'New Prompt',
        content: 'This is a new prompt content',
        tags: ['new', 'test'],
        description: 'A test description'
      }

      const createdPrompt = {
        id: 'generated-uuid',
        ...newPromptData,
        userId: mockUserId,
        createdBy: mockUserId,
        teamId: null,
        projectId: null,
        version: null,
        isPublic: false,
        coverImg: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      }

      queries.prompts.create.mockResolvedValue(createdPrompt)

      const request = new MockNextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('generated-uuid')
      expect(data.title).toBe('New Prompt')
      expect(data.content).toBe('This is a new prompt content')
      expect(queries.prompts.create).toHaveBeenCalledWith(expect.objectContaining({
        title: newPromptData.title,
        content: newPromptData.content,
        description: newPromptData.description,
        tags: newPromptData.tags,
        createdBy: mockUserId,
        userId: mockUserId,
        isPublic: false
      }))
    })

    it('should create prompt with custom fields', async () => {
      const newPromptData = {
        title: 'Custom Prompt',
        content: 'Custom content',
        tags: 'custom-tag',
        description: null,
        is_public: true,
        cover_img: 'http://example.com/image.jpg',
        version: '1.0.0'
      }

      const createdPrompt = {
        id: 'prompt-123',
        title: newPromptData.title,
        content: newPromptData.content,
        tags: newPromptData.tags,
        description: newPromptData.description,
        isPublic: true,
        coverImg: newPromptData.cover_img,
        version: newPromptData.version,
        createdBy: mockUserId,
        userId: mockUserId
      }

      queries.prompts.create.mockResolvedValue(createdPrompt)

      const request = new MockNextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.isPublic).toBe(true)
      expect(data.coverImg).toBe('http://example.com/image.jpg')
    })

    it('should return 401 when user is not authenticated', async () => {
      auth.mockResolvedValue({ userId: null })

      const request = new MockNextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test', content: 'Test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBeDefined()
    })

    it('should handle database errors during creation', async () => {
      const newPromptData = {
        title: 'New Prompt',
        content: 'Content'
      }

      queries.prompts.create.mockRejectedValue(new Error('Insert failed'))

      const request = new MockNextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle invalid JSON data', async () => {
      const request = new MockNextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })

    it('should handle missing team context gracefully', async () => {
      // When teamId is provided but user is not a member, should return 403
      const teamId = 'team-123'
      const newPromptData = {
        title: 'Team Prompt',
        content: 'Team content'
      }

      // Mock team context resolution failure (no membership)
      const { createClient } = require('@supabase/supabase-js')
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not a member' }
          })
        }))
      }
      createClient.mockReturnValue(mockSupabase)

      const request = new MockNextRequest(`http://localhost:3000/api/prompts?teamId=${teamId}`, {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)

      // Should fail with 403 since user is not a team member
      expect(response.status).toBe(403)
    })
  })
})
