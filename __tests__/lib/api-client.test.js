import { apiClient, ApiError, useApiRequest } from '@/lib/api-client'

// Mock fetch
global.fetch = jest.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  describe('request method', () => {
    it('应该发送基本的GET请求', async () => {
      const mockResponse = { data: 'test' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.request('/test')

      expect(fetch).toHaveBeenCalledWith('/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该发送POST请求并序列化body', async () => {
      const mockResponse = { success: true }
      const requestBody = { name: 'test' }
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await apiClient.request('/test', {
        method: 'POST',
        body: requestBody,
      })

      expect(fetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      expect(result).toEqual(mockResponse)
    })

    it('应该处理HTTP错误响应', async () => {
      const errorResponse = { error: '请求失败' }
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      })

      await expect(apiClient.request('/test')).rejects.toThrow(ApiError)
      
      // 重新mock以便第二次调用
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      })
      await expect(apiClient.request('/test')).rejects.toThrow('请求失败')
    })

    it('应该处理网络错误', async () => {
      fetch.mockRejectedValueOnce(new Error('网络连接失败'))

      await expect(apiClient.request('/test')).rejects.toThrow(ApiError)
      
      // 重新mock以便第二次调用
      fetch.mockRejectedValueOnce(new Error('网络连接失败'))
      await expect(apiClient.request('/test')).rejects.toThrow('Network error')
    })

    it('应该处理JSON解析错误', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await apiClient.request('/test')
      expect(result).toBeNull()
    })

    it('应该合并自定义headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      await apiClient.request('/test', {
        headers: {
          'Authorization': 'Bearer token',
          'Custom-Header': 'value',
        },
      })

      expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
          'Custom-Header': 'value',
        }),
      }))
    })
  })

  describe('Prompt API methods', () => {
    it('getPrompts应该构建正确的查询参数', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      })

      await apiClient.getPrompts({ tag: 'react', page: 1 })

      expect(fetch).toHaveBeenCalledWith('/api/prompts?tag=react&page=1', expect.any(Object))
    })

    it('createPrompt应该发送POST请求', async () => {
      const promptData = { title: '测试提示词', content: '内容' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => promptData,
      })

      await apiClient.createPrompt(promptData)

      expect(fetch).toHaveBeenCalledWith('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      })
    })

    it('updatePrompt应该发送POST请求到正确的端点', async () => {
      const promptData = { title: '更新的提示词' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => promptData,
      })

      await apiClient.updatePrompt('123', promptData)

      expect(fetch).toHaveBeenCalledWith('/api/prompts/123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      })
    })

    it('deletePrompt应该发送DELETE请求', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await apiClient.deletePrompt('123')

      expect(fetch).toHaveBeenCalledWith('/api/prompts/123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('sharePrompt应该发送POST请求到分享端点', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shareId: 'abc123' }),
      })

      await apiClient.sharePrompt('123')

      expect(fetch).toHaveBeenCalledWith('/api/prompts/share/123', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('copyPrompt应该发送POST请求到复制端点', async () => {
      const promptData = { title: '复制的提示词' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => promptData,
      })

      await apiClient.copyPrompt(promptData)

      expect(fetch).toHaveBeenCalledWith('/api/prompts/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptData }),
      })
    })
  })

  describe('Tags API methods', () => {
    it('getTags应该发送GET请求', async () => {
      const tags = ['react', 'javascript']
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tags,
      })

      const result = await apiClient.getTags()

      expect(fetch).toHaveBeenCalledWith('/api/tags', expect.any(Object))
      expect(result).toEqual(tags)
    })

    it('createTag应该发送POST请求', async () => {
      const tagData = { name: '新标签', color: '#blue' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tagData,
      })

      await apiClient.createTag(tagData)

      expect(fetch).toHaveBeenCalledWith('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      })
    })

    it('updateTag应该发送PATCH请求', async () => {
      const tagData = { name: '更新的标签' }
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => tagData,
      })

      await apiClient.updateTag('123', tagData)

      expect(fetch).toHaveBeenCalledWith('/api/tags?id=123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      })
    })

    it('deleteTag应该发送DELETE请求', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await apiClient.deleteTag('123')

      expect(fetch).toHaveBeenCalledWith('/api/tags?id=123', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
  })

  describe('Chat API methods', () => {
    it('chat应该返回Response对象用于流式处理', async () => {
      const mockResponse = {
        ok: true,
        body: 'stream data',
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const messages = [{ role: 'user', content: '你好' }]
      const result = await apiClient.chat(messages)

      expect(fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      })
      expect(result).toBe(mockResponse)
    })

    it('chat应该处理错误响应', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '服务器错误' }),
      })

      const messages = [{ role: 'user', content: '你好' }]
      
      await expect(apiClient.chat(messages)).rejects.toThrow(ApiError)
      
      // 重新mock以便第二次调用
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: '服务器错误' }),
      })
      await expect(apiClient.chat(messages)).rejects.toThrow('服务器错误')
    })
  })

  describe('Generate API methods', () => {
    it('generate应该返回Response对象用于流式处理', async () => {
      const mockResponse = {
        ok: true,
        body: 'generated content',
      }
      fetch.mockResolvedValueOnce(mockResponse)

      const result = await apiClient.generate('测试文本')

      expect(fetch).toHaveBeenCalledWith('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: '测试文本' }),
      })
      expect(result).toBe(mockResponse)
    })
  })

  describe('ApiError', () => {
    it('应该正确创建ApiError实例', () => {
      const error = new ApiError('测试错误', 400, { details: '详细信息' })
      
      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('测试错误')
      expect(error.status).toBe(400)
      expect(error.data).toEqual({ details: '详细信息' })
      expect(error instanceof Error).toBe(true)
    })
  })

  describe('useApiRequest hook', () => {
    it('应该返回apiClient和ApiError', () => {
      const result = useApiRequest()
      
      expect(result.apiClient).toBe(apiClient)
      expect(result.ApiError).toBe(ApiError)
    })
  })
})