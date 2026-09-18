import { auth } from '@clerk/nextjs/server'
import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { authenticateCliToken } from '@/lib/cli-token-auth.js'
import { db } from '@/lib/db.js'
import { getMcpUserId, requireMcpUserId, runWithMcpAuth, verifyMcpToken } from '@/lib/mcp/auth.js'

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@clerk/mcp-tools/next', () => ({
  verifyClerkToken: jest.fn(),
}), { virtual: true })

jest.mock('@/lib/cli-token-auth.js', () => ({
  authenticateCliToken: jest.fn(),
}))

jest.mock('@/lib/db.js', () => ({
  db: {
    update: jest.fn(),
  },
}))

describe('MCP auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const where = jest.fn().mockResolvedValue(undefined)
    const set = jest.fn().mockReturnValue({ where })
    db.update.mockReturnValue({ set })
  })

  it('应该优先接受 CLI token', async () => {
    authenticateCliToken.mockResolvedValue({ id: 'token-1', userId: 'user-1' })

    const authInfo = await verifyMcpToken({}, 'pm_example')

    expect(authInfo).toEqual({
      token: 'pm_example',
      clientId: 'cli:token-1',
      scopes: ['openid', 'profile', 'email'],
      extra: { userId: 'user-1', source: 'cli_token' },
    })
    expect(auth).not.toHaveBeenCalled()
  })

  it('应该在 CLI token 无效时改走 Clerk OAuth', async () => {
    authenticateCliToken.mockResolvedValue(null)
    auth.mockResolvedValue({ userId: 'user-2', tokenType: 'oauth_token', isAuthenticated: true, clientId: 'client-1', scopes: ['openid'] })
    verifyClerkToken.mockReturnValue({
      token: 'oauth-token',
      clientId: 'client-1',
      scopes: ['openid'],
      extra: { userId: 'user-2' },
    })

    const authInfo = await verifyMcpToken({}, 'oauth-token')

    expect(auth).toHaveBeenCalledWith({ acceptsToken: 'oauth_token' })
    expect(verifyClerkToken).toHaveBeenCalled()
    expect(authInfo.extra.userId).toBe('user-2')
  })

  it('应该从执行上下文读取 userId', async () => {
    const result = await runWithMcpAuth({ extra: { userId: 'user-9' } }, () => getMcpUserId())
    expect(result).toBe('user-9')
    expect(() => requireMcpUserId()).toThrow('Authentication required')
  })
})
