/**
 * @jest-environment node
 */

if (typeof Response.json !== 'function') {
  Response.json = function(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })
  }
}

jest.mock('@/lib/db.js', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue([]),
        })),
      })),
    })),
  },
}))

jest.mock('@/lib/auth', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }))
})

const OpenAI = require('openai')
const { POST } = require('@/app/api/playground/run/route')
const { EVALUATION_PROVIDERS } = require('@/lib/prompt-evaluation')
const providerOptions = require('@/components/playground/providerOptions.json')

describe('Playground UberLLM provider', () => {
  let mockCreate

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      model: 'deepseek/deepseek-v4.1-flash',
    })
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))
  })

  it('应该使用 UberLLM 默认地址且不附加其他服务商的 headers', async () => {
    const request = new Request('http://localhost/api/playground/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Hello',
        stream: false,
        settings: {
          apiKey: 'ull-test',
          provider: 'uberllm',
          model: 'deepseek/deepseek-v4.1-flash',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.output).toBe('ok')
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'ull-test',
      baseURL: 'https://api.uberllm.dev/v1',
    })
  })

  it('应该出现在 Playground 服务商列表和评测服务商中', () => {
    const option = providerOptions.find((item) => item.value === 'uberllm')
    expect(option.baseURL).toBe('https://api.uberllm.dev/v1')
    expect(option.models[0].value).toBe('deepseek/deepseek-v4.1-flash')
    expect(EVALUATION_PROVIDERS).toContain('uberllm')
  })
})
