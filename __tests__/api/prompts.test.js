import { createClient } from '@supabase/supabase-js'

// Mock the route handlers
const mockGET = jest.fn()
const mockPOST = jest.fn()

jest.mock('@/app/api/prompts/route', () => ({
  GET: mockGET,
  POST: mockPOST
}))

// Mock dependencies
jest.mock('@supabase/supabase-js')

// Mock local auth
const mockGetCurrentUserId = jest.fn()
jest.mock('@/lib/local-auth/session.js', () => ({
  getCurrentUserId: () => mockGetCurrentUserId()
}))

describe('/api/prompts', () => {
  let mockSupabase

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    }
    
    createClient.mockReturnValue(mockSupabase)
    
    // Mock auth
    mockGetCurrentUserId.mockResolvedValue('test-user-id')
  })

  describe('GET /api/prompts', () => {
    it('应该成功获取用户的提示词列表', async () => {
      const mockPrompts = [
        {
          id: '1',
          title: '测试提示词1',
          content: '这是测试内容1',
          user_id: 'test-user-id',
          tags: ['测试'],
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2', 
          title: '测试提示词2',
          content: '这是测试内容2',
          user_id: 'test-user-id',
          tags: ['开发'],
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockPrompts,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/prompts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPrompts)
      expect(mockSupabase.from).toHaveBeenCalledWith('prompts')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'test-user-id')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('应该根据标签过滤提示词', async () => {
      const mockPrompts = [
        {
          id: '1',
          title: '测试提示词',
          content: '这是测试内容',
          user_id: 'test-user-id',
          tags: ['测试'],
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.order.mockResolvedValue({
        data: mockPrompts,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/prompts?tag=测试')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockPrompts)
      expect(mockSupabase.ilike).toHaveBeenCalledWith('tags', '%测试%')
    })

    it('应该处理数据库错误', async () => {
      const mockError = { message: '数据库连接失败' }
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: mockError
      })

      const request = new NextRequest('http://localhost:3000/api/prompts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: '数据库连接失败' })
    })
  })

  describe('POST /api/prompts', () => {
    it('应该成功创建新的提示词', async () => {
      const newPromptData = {
        title: '新提示词',
        content: '这是新的提示词内容',
        tags: ['新建', '测试']
      }

      const createdPrompt = {
        id: 'generated-uuid',
        ...newPromptData,
        user_id: 'test-user-id',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        is_public: true
      }

      mockSupabase.select.mockResolvedValue({
        data: [createdPrompt],
        error: null
      })

      // Mock crypto.randomUUID
      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('generated-uuid')
      }

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        id: 'generated-uuid',
        title: '新提示词',
        content: '这是新的提示词内容',
        tags: ['新建', '测试'],
        user_id: 'test-user-id',
        is_public: true
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('prompts')
      expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
        id: 'generated-uuid',
        ...newPromptData,
        user_id: 'test-user-id',
        is_public: true
      })])
    })

    it('应该处理创建提示词时的数据库错误', async () => {
      const newPromptData = {
        title: '新提示词',
        content: '这是新的提示词内容'
      }

      const mockError = { message: '插入数据失败' }
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: mockError
      })

      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('generated-uuid')
      }

      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: JSON.stringify(newPromptData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: '插入数据失败' })
    })

    it('应该处理无效的JSON数据', async () => {
      const request = new NextRequest('http://localhost:3000/api/prompts', {
        method: 'POST',
        body: 'invalid json'
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })
})