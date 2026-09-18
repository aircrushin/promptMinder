import { handleMcpOptions, mcpHttpHandler } from '@/lib/mcp/server.js'
import { registerPromptMinderMcp } from '@/lib/mcp/tools.js'
import { runWithMcpAuth } from '@/lib/mcp/auth.js'
import { createMcpHandler } from 'mcp-handler'

jest.mock('@/lib/mcp/tools.js', () => ({
  registerPromptMinderMcp: jest.fn(),
}))

jest.mock('@/lib/mcp/auth.js', () => ({
  runWithMcpAuth: jest.fn((authInfo, callback) => callback()),
  verifyMcpToken: jest.fn(async () => ({ extra: { userId: 'user-1' } })),
}))

describe('MCP HTTP server', () => {
  it('应该创建带认证包装的 handler', async () => {
    expect(createMcpHandler).toHaveBeenCalled()
    expect(registerPromptMinderMcp).toHaveBeenCalled()
    const response = await mcpHttpHandler({ method: 'POST', headers: { get: () => null } })
    expect(runWithMcpAuth).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(handleMcpOptions().status).toBe(204)
  })
})
