/** @jest-environment node */

import { GET as getProtectedResource, OPTIONS as optionsProtectedResource } from '@/app/.well-known/oauth-protected-resource/mcp/route.js'
import { GET as getProtectedResourceRoot, OPTIONS as optionsProtectedResourceRoot } from '@/app/.well-known/oauth-protected-resource/route.js'
import { GET as getAuthorizationServer, OPTIONS as optionsAuthorizationServer } from '@/app/.well-known/oauth-authorization-server/route.js'
import { POST as postRegister, OPTIONS as optionsRegister } from '@/app/oauth/register/route.js'
import { createDynamicClientRegistrationHandler } from '@/lib/mcp/dcr.js'
import { GET as getMcp, POST as postMcp, DELETE as deleteMcp, OPTIONS as mcpOptions } from '@/app/mcp/route.js'
import { mcpHttpHandler } from '@/lib/mcp/server.js'

jest.mock('@clerk/mcp-tools/server', () => ({
  generateClerkProtectedResourceMetadata: jest.fn(() => ({
    resource: 'https://www.prompt-minder.com/mcp',
    authorization_servers: ['https://clerk.example'],
  })),
  fetchClerkAuthorizationServerMetadata: jest.fn(async () => ({
    issuer: 'https://clerk.example',
  })),
}), { virtual: true })

jest.mock('@/lib/mcp/server.js', () => ({
  mcpHttpHandler: jest.fn(),
  handleMcpOptions: jest.fn(() => new Response(null, { status: 204 })),
}))

jest.mock('@/lib/mcp/dcr.js', () => ({
  createDynamicClientRegistrationHandler: jest.fn(() => jest.fn(async () => new Response('registered', { status: 201 }))),
  createRegistrationOptionsHandler: jest.fn(() => () => new Response(null, { status: 200 })),
}))

describe('MCP discovery routes', () => {
  it('应该公开 protected resource metadata', async () => {
    const response = getProtectedResource({
      url: 'https://www.prompt-minder.com/.well-known/oauth-protected-resource/mcp',
      headers: { get: () => null },
    })
    const body = await response.json()
    expect(body.resource).toBe('https://www.prompt-minder.com/mcp')
    expect(optionsProtectedResource().status).toBe(200)
    const root = getProtectedResourceRoot({
      url: 'https://www.prompt-minder.com/.well-known/oauth-protected-resource',
      headers: { get: () => null },
    })
    expect(root.status).toBe(200)
    expect(optionsProtectedResourceRoot().status).toBe(200)
    expect(optionsAuthorizationServer().status).toBe(200)
  })

  it('应该公开授权服务器 metadata 并带上 DCR', async () => {
    const response = await getAuthorizationServer({
      url: 'https://www.prompt-minder.com/.well-known/oauth-authorization-server',
      headers: { get: () => null },
    })
    await expect(response.json()).resolves.toEqual({
      issuer: 'https://www.prompt-minder.com',
      registration_endpoint: 'https://www.prompt-minder.com/oauth/register',
    })
  })

  it('应该公开 DCR 注册端点', async () => {
    const request = { json: async () => ({ redirect_uris: ['http://127.0.0.1/callback'] }) }
    const response = await postRegister(request)
    expect(createDynamicClientRegistrationHandler).toHaveBeenCalled()
    expect(response.status).toBe(201)
    expect(optionsRegister().status).toBe(200)
  })

  it('MCP 端点应响应 CORS preflight', () => {
    expect(mcpOptions().status).toBe(204)
  })

  it('MCP GET/POST 应交给认证后的 handler', async () => {
    mcpHttpHandler.mockResolvedValue(new Response('ok', { status: 200 }))
    await getMcp({ method: 'GET' })
    await postMcp({ method: 'POST' })
    await deleteMcp({ method: 'DELETE' })
    expect(mcpHttpHandler).toHaveBeenCalledTimes(3)
  })
})
