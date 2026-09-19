import { generateClerkProtectedResourceMetadata, fetchClerkAuthorizationServerMetadata } from '@clerk/mcp-tools/server'
import {
  createAuthorizationServerMetadataHandler,
  createProtectedResourceMetadataHandler,
} from '@/lib/mcp/metadata.js'
import { MCP_PUBLIC_ORIGIN } from '@/lib/mcp/constants.js'
import { applyCorsHeaders, emptyCorsResponse, getRequestOrigin, jsonWithCors, mcpErrorResult, mcpTextResult, withCors } from '@/lib/mcp/http.js'

jest.mock('@clerk/mcp-tools/server', () => ({
  generateClerkProtectedResourceMetadata: jest.fn(),
  fetchClerkAuthorizationServerMetadata: jest.fn(),
}), { virtual: true })

describe('MCP HTTP helpers', () => {
  it('应该优先使用转发头作为公开 origin', () => {
    const request = {
      url: 'http://localhost:3000/mcp',
      headers: {
        get(name) {
          if (name === 'x-forwarded-host') return 'www.prompt-minder.com'
          if (name === 'x-forwarded-proto') return 'https'
          return null
        },
      },
    }
    expect(getRequestOrigin(request)).toBe('https://www.prompt-minder.com')
  })

  it('应该给 JSON 响应加上 CORS 头', async () => {
    const response = jsonWithCors({ ok: true })
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('应该格式化 MCP 工具结果', () => {
    expect(mcpTextResult({ id: '1' }).content[0].text).toContain('"id": "1"')
    expect(mcpErrorResult('nope').isError).toBe(true)
    expect(emptyCorsResponse().status).toBe(204)
    expect(applyCorsHeaders()['Access-Control-Allow-Methods']).toContain('POST')
  })

  it('无效 URL 时应回退到公开 origin', () => {
    expect(getRequestOrigin({ url: 'not-a-url', headers: { get: () => null } })).toBe(MCP_PUBLIC_ORIGIN.replace(/\/$/, ''))
  })

  it('应该复制已有 Headers 并覆盖 CORS', () => {
    const headers = applyCorsHeaders(new Headers({ 'X-Test': '1' }))
    expect(headers['X-Test'] || headers['x-test']).toBe('1')
    expect(headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('应该给普通请求补上 CORS 头', async () => {
    const handler = withCors(async () => new Response('ok', { headers: { 'X-Test': '1' } }))
    const response = await handler({ method: 'POST' })
    expect(response.status).toBe(200)
  })

  it('应该在 OPTIONS 时直接返回 CORS 响应', async () => {
    const handler = withCors(async () => new Response('ok'))
    const response = await handler({ method: 'OPTIONS' })
    expect(response.status).toBe(204)
  })
})

describe('MCP OAuth metadata', () => {
  const originalKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalKey
    jest.clearAllMocks()
  })

  it('应该发布指向 /mcp 的 protected resource metadata', async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example'
    generateClerkProtectedResourceMetadata.mockReturnValue({
      resource: 'https://www.prompt-minder.com/mcp',
      authorization_servers: ['https://clerk.example'],
    })

    const response = createProtectedResourceMetadataHandler()({
      url: 'http://localhost:3000/.well-known/oauth-protected-resource/mcp',
      headers: { get: () => null },
    })
    const body = await response.json()

    expect(generateClerkProtectedResourceMetadata).toHaveBeenCalledWith(expect.objectContaining({
      publishableKey: 'pk_test_example',
      resourceUrl: expect.stringMatching(/\/mcp$/),
    }))
    expect(body.resource).toBe('https://www.prompt-minder.com/mcp')
    expect(body.authorization_servers).toEqual(['http://localhost:3000'])
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('应该公布本站 DCR 端点并改写 issuer', async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_example'
    fetchClerkAuthorizationServerMetadata.mockResolvedValue({
      issuer: 'https://clerk.example',
      authorization_endpoint: 'https://clerk.example/oauth/authorize',
    })
    const response = await createAuthorizationServerMetadataHandler()({
      url: 'http://localhost:3000/.well-known/oauth-authorization-server',
      headers: { get: () => null },
    })
    await expect(response.json()).resolves.toEqual({
      issuer: 'http://localhost:3000',
      authorization_endpoint: 'https://clerk.example/oauth/authorize',
      registration_endpoint: 'http://localhost:3000/oauth/register',
    })
  })

  it('缺少 Clerk key 时应返回 500', async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const resource = createProtectedResourceMetadataHandler()({
      url: 'http://localhost:3000/mcp',
      headers: { get: () => null },
    })
    expect(resource.status).toBe(500)
    const authServer = await createAuthorizationServerMetadataHandler()({
      url: 'http://localhost:3000/.well-known/oauth-authorization-server',
      headers: { get: () => null },
    })
    expect(authServer.status).toBe(500)
  })
})
