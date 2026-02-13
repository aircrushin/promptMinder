// @ts-nocheck
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { NextRequest } from 'next/server'

// Mock OpenAI
jest.mock('openai')

describe('/api/chat', () => {
  let mockOpenAI
  let mockCompletion

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock OpenAI completion stream
    mockCompletion = {
      [Symbol.asyncIterator]: jest.fn().mockImplementation(async function* () {
        yield {
          choices: [{
            delta: { content: '你好' }
          }]
        }
        yield {
          choices: [{
            delta: { content: '，我是AI助手' }
          }]
        }
        yield {
          choices: [{
            delta: { content: '。' }
          }]
        }
      })
    }

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion)
        }
      }
    }

    OpenAI.mockImplementation(() => mockOpenAI)
  })

  it('应该成功处理聊天请求并返回流式响应', async () => {
    const requestBody = {
      messages: [
        { role: 'user', content: '你好' }
      ],
      systemPrompt: '你是一个有用的AI助手',
      model: 'glm-4v-flash',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.7
    }

    // Mock environment variable
    process.env.ZHIPU_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('Transfer-Encoding')).toBe('chunked')
    
    // 验证OpenAI客户端被正确创建
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      baseURL: 'https://open.bigmodel.cn/api/paas/v4'
    })

    // 验证聊天完成请求参数
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'glm-4v-flash',
      messages: [
        { role: 'system', content: '你是一个有用的AI助手' },
        { role: 'user', content: '你好' }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.7,
      stream: true
    })
  })

  it('应该使用自定义API Key和baseURL', async () => {
    const requestBody = {
      messages: [{ role: 'user', content: '测试消息' }],
      apiKey: 'custom-api-key',
      baseURL: 'https://custom.api.com/v1',
      systemPrompt: '自定义系统提示'
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    await POST(request)

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'custom-api-key',
      baseURL: 'https://custom.api.com/v1'
    })
  })

  it('应该处理缺少API Key的情况', async () => {
    // 清除环境变量
    delete process.env.ZHIPU_API_KEY

    const requestBody = {
      messages: [{ role: 'user', content: '测试消息' }],
      systemPrompt: '测试系统提示'
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: '未提供 API Key' })
  })

  it('应该处理OpenAI API错误', async () => {
    const apiError = new Error('API请求失败')
    mockOpenAI.chat.completions.create.mockRejectedValue(apiError)

    process.env.ZHIPU_API_KEY = 'test-api-key'

    const requestBody = {
      messages: [{ role: 'user', content: '测试消息' }],
      systemPrompt: '测试系统提示'
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({ error: 'API请求失败' })
  })

  it('应该处理无效的JSON请求体', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })

  it('应该过滤空内容的消息', async () => {
    const requestBody = {
      messages: [
        { role: 'user', content: '有效消息' },
        { role: 'user', content: '' },
        { role: 'user', content: null },
        { role: 'user', content: '另一个有效消息' }
      ],
      systemPrompt: '系统提示'
    }

    process.env.ZHIPU_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    await POST(request)

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: '系统提示' },
          { role: 'user', content: '有效消息' },
          { role: 'user', content: '另一个有效消息' }
        ]
      })
    )
  })

  it('应该使用默认参数值', async () => {
    const requestBody = {
      messages: [{ role: 'user', content: '测试消息' }],
      systemPrompt: '系统提示'
    }

    process.env.ZHIPU_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    await POST(request)

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      model: 'glm-4v-flash',
      messages: expect.any(Array),
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.7,
      stream: true
    })
  })
})