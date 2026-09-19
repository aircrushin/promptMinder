import {
  createDynamicClientRegistrationHandler,
  mergeRedirectUris,
  parseRegistrationRequest,
  registerDynamicClient,
  toRfc7591Client,
} from '@/lib/mcp/dcr.js'

describe('MCP dynamic client registration', () => {
  const originalSecret = process.env.CLERK_SECRET_KEY
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.CLERK_SECRET_KEY = 'sk_test_example'
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env.CLERK_SECRET_KEY = originalSecret
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

  it('应该校验 redirect_uris', () => {
    expect(() => parseRegistrationRequest({})).toThrow('redirect_uris')
    expect(parseRegistrationRequest({
      client_name: 'Cursor',
      redirect_uris: ['http://127.0.0.1:1234/callback'],
      token_endpoint_auth_method: 'none',
    })).toEqual({
      clientName: 'Cursor',
      redirectUris: ['http://127.0.0.1:1234/callback'],
      publicClient: true,
    })
  })

  it('应该合并重定向地址', () => {
    expect(mergeRedirectUris(
      ['http://127.0.0.1:1/callback'],
      ['http://127.0.0.1:1/callback', 'http://127.0.0.1:2/callback'],
    )).toEqual([
      'http://127.0.0.1:1/callback',
      'http://127.0.0.1:2/callback',
    ])
  })

  it('应该把 Clerk 应用映射成 RFC 7591 响应', () => {
    expect(toRfc7591Client({
      client_id: 'client_123',
      name: 'PromptMinder MCP',
      public: true,
      created_at: '2026-01-01T00:00:00.000Z',
    }, ['http://127.0.0.1/callback'])).toEqual(expect.objectContaining({
      client_id: 'client_123',
      client_name: 'PromptMinder MCP',
      redirect_uris: ['http://127.0.0.1/callback'],
      token_endpoint_auth_method: 'none',
    }))
  })

  it('没有共享应用时应创建新的公开客户端', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          client_id: 'client_new',
          name: 'PromptMinder MCP',
          public: true,
          created_at: '2026-01-01T00:00:00.000Z',
        }),
      })

    const client = await registerDynamicClient({
      redirect_uris: ['http://127.0.0.1:99/callback'],
    })

    expect(client.client_id).toBe('client_new')
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.clerk.com/v1/oauth_applications',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('已有应用且 URI 相同时应复用', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{
          id: 'oauthapp_1',
          name: 'PromptMinder MCP',
          client_id: 'client_existing',
          public: true,
          redirect_uris: ['http://127.0.0.1:99/callback'],
          created_at: '2026-01-01T00:00:00.000Z',
        }],
      }),
    })

    const client = await registerDynamicClient({
      redirect_uris: ['http://127.0.0.1:99/callback'],
    })

    expect(client.client_id).toBe('client_existing')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('已有应用缺少 URI 时应补上', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{
            id: 'oauthapp_1',
            name: 'PromptMinder MCP',
            client_id: 'client_existing',
            public: true,
            redirect_uris: ['http://127.0.0.1:1/callback'],
            created_at: '2026-01-01T00:00:00.000Z',
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'oauthapp_1',
          client_id: 'client_existing',
          name: 'PromptMinder MCP',
          public: true,
          redirect_uris: ['http://127.0.0.1:1/callback', 'http://127.0.0.1:2/callback'],
          created_at: '2026-01-01T00:00:00.000Z',
        }),
      })

    const client = await registerDynamicClient({
      redirect_uris: ['http://127.0.0.1:2/callback'],
    })

    expect(client.redirect_uris).toEqual([
      'http://127.0.0.1:1/callback',
      'http://127.0.0.1:2/callback',
    ])
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.clerk.com/v1/oauth_applications/oauthapp_1',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('缺少密钥时应返回 503', async () => {
    delete process.env.CLERK_SECRET_KEY
    const handler = createDynamicClientRegistrationHandler()
    const response = await handler({
      json: async () => ({ redirect_uris: ['http://127.0.0.1/callback'] }),
    })
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      error: 'temporarily_unavailable',
    }))
  })

  it('非法 body 时应返回 400', async () => {
    const handler = createDynamicClientRegistrationHandler()
    const response = await handler({
      json: async () => ({}),
    })
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      error: 'invalid_client_metadata',
    }))
  })
})
