// @ts-nocheck
import { GET, POST } from '@/app/api/contributions/route'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@supabase/supabase-js')

describe('/api/contributions', () => {
  let mockSupabase

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    }
    
    createClient.mockReturnValue(mockSupabase)
  })

  describe('POST /api/contributions', () => {
    it('应该成功提交贡献', async () => {
      const contributionData = {
        title: '测试提示词',
        role: '开发助手',
        content: '这是一个测试提示词内容',
        contributorEmail: 'test@example.com',
        contributorName: '测试用户'
      }

      const mockCreatedContribution = {
        id: 'generated-uuid',
        title: '测试提示词',
        role_category: '开发助手',
        content: '这是一个测试提示词内容',
        contributor_email: 'test@example.com',
        contributor_name: '测试用户',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedContribution,
        error: null
      })

      // Mock crypto.randomUUID
      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('generated-uuid')
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        message: 'Contribution submitted successfully',
        id: 'generated-uuid',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z'
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_contributions')
      expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
        id: 'generated-uuid',
        title: '测试提示词',
        role_category: '开发助手',
        content: '这是一个测试提示词内容',
        contributor_email: 'test@example.com',
        contributor_name: '测试用户',
        status: 'pending'
      })])
    })

    it('应该验证必填字段 - 缺少标题', async () => {
      const contributionData = {
        role: '开发助手',
        content: '这是一个测试提示词内容'
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Title is required' })
    })

    it('应该验证必填字段 - 缺少角色', async () => {
      const contributionData = {
        title: '测试提示词',
        content: '这是一个测试提示词内容'
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Role/Category is required' })
    })

    it('应该验证必填字段 - 缺少内容', async () => {
      const contributionData = {
        title: '测试提示词',
        role: '开发助手'
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Content is required' })
    })

    it('应该处理空白字符串字段', async () => {
      const contributionData = {
        title: '   ',
        role: '开发助手',
        content: '这是一个测试提示词内容'
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Title is required' })
    })

    it('应该处理数据库插入错误', async () => {
      const contributionData = {
        title: '测试提示词',
        role: '开发助手',
        content: '这是一个测试提示词内容'
      }

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: '数据库插入失败' }
      })

      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('generated-uuid')
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to save contribution' })
    })

    it('应该处理可选字段为空的情况', async () => {
      const contributionData = {
        title: '测试提示词',
        role: '开发助手',
        content: '这是一个测试提示词内容'
        // 不提供 contributorEmail 和 contributorName
      }

      const mockCreatedContribution = {
        id: 'generated-uuid',
        title: '测试提示词',
        role_category: '开发助手',
        content: '这是一个测试提示词内容',
        contributor_email: null,
        contributor_name: null,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedContribution,
        error: null
      })

      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('generated-uuid')
      }

      const request = new NextRequest('http://localhost:3000/api/contributions', {
        method: 'POST',
        body: JSON.stringify(contributionData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSupabase.insert).toHaveBeenCalledWith([expect.objectContaining({
        contributor_email: null,
        contributor_name: null
      })])
    })
  })

  describe('GET /api/contributions', () => {
    it('应该成功获取贡献列表', async () => {
      const mockContributions = [
        {
          id: '1',
          title: '测试提示词1',
          role_category: '开发助手',
          content: '内容1',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: '测试提示词2',
          role_category: '写作助手',
          content: '内容2',
          status: 'pending',
          created_at: '2024-01-02T00:00:00Z'
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockContributions,
        error: null
      })

      // Mock count query
      const mockCountSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 2, error: null })
      }
      createClient.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockCountSupabase)

      const request = new NextRequest('http://localhost:3000/api/contributions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        contributions: mockContributions,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('prompt_contributions')
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'pending')
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 19)
    })

    it('应该支持状态过滤', async () => {
      const mockContributions = [
        {
          id: '1',
          title: '已批准的提示词',
          status: 'approved',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockContributions,
        error: null
      })

      const mockCountSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 1, error: null })
      }
      createClient.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockCountSupabase)

      const request = new NextRequest('http://localhost:3000/api/contributions?status=approved')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contributions).toEqual(mockContributions)
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'approved')
    })

    it('应该支持分页', async () => {
      const mockContributions = [
        {
          id: '21',
          title: '第二页的提示词',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockContributions,
        error: null
      })

      const mockCountSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ count: 25, error: null })
      }
      createClient.mockReturnValueOnce(mockSupabase).mockReturnValueOnce(mockCountSupabase)

      const request = new NextRequest('http://localhost:3000/api/contributions?page=2&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      })
      expect(mockSupabase.range).toHaveBeenCalledWith(10, 19)
    })

    it('应该处理查询错误', async () => {
      mockSupabase.range.mockResolvedValue({
        data: null,
        error: { message: '查询失败' }
      })

      const request = new NextRequest('http://localhost:3000/api/contributions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to fetch contributions' })
    })
  })
})