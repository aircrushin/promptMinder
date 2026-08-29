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

describe('Playground OrcaRouter provider', () => {
  let mockCreate

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      model: 'orcarouter/free',
    })
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }))
  })

  it('应该使用 OrcaRouter 默认地址并附加 attribution headers', async () => {
    const request = new Request('http://localhost/api/playground/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Hello',
        stream: false,
        settings: {
          apiKey: 'sk-orca-test',
          provider: 'orcarouter',
          model: 'orcarouter/free',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.output).toBe('ok')
    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-orca-test',
      baseURL: 'https://api.orcarouter.ai/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://www.prompt-minder.com',
        'X-Title': 'PromptMinder',
      },
    })
  })
})
