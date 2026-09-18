/** @jest-environment node */

import { GET as getProtectedResource, OPTIONS as optionsProtectedResource } from '@/app/.well-known/oauth-protected-resource/mcp/route.js'
import { GET as getAuthorizationServer } from '@/app/.well-known/oauth-authorization-server/route.js'
import { GET as getMcp, POST as postMcp, OPTIONS as mcpOptions } from '@/app/mcp/route.js'
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

describe('MCP discovery routes', () => {
  it('应该公开 protected resource metadata', async () => {
    const response = getProtectedResource({
      url: 'https://www.prompt-minder.com/.well-known/oauth-protected-resource/mcp',
      headers: { get: () => null },
    })
    const body = await response.json()
    expect(body.resource).toBe('https://www.prompt-minder.com/mcp')
    expect(optionsProtectedResource().status).toBe(200)
  })

  it('应该公开授权服务器 metadata', async () => {
    const response = await getAuthorizationServer()
    await expect(response.json()).resolves.toEqual({ issuer: 'https://clerk.example' })
  })

  it('MCP 端点应响应 CORS preflight', () => {
    expect(mcpOptions().status).toBe(204)
  })

  it('MCP GET/POST 应交给认证后的 handler', async () => {
    mcpHttpHandler.mockResolvedValue(new Response('ok', { status: 200 }))
    await getMcp({ method: 'GET' })
    await postMcp({ method: 'POST' })
    expect(mcpHttpHandler).toHaveBeenCalledTimes(2)
  })
})
