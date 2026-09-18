import { AsyncLocalStorage } from 'node:async_hooks'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { authenticateCliToken } from '@/lib/cli-token-auth.js'
import { db } from '@/lib/db.js'
import { cliTokens } from '@/drizzle/schema/index.js'
import { MCP_SCOPES } from './constants.js'

const mcpAuthStore = new AsyncLocalStorage()

function normalizeClerkAuth(clerkAuth) {
  if (!clerkAuth) {
    return clerkAuth
  }

  return {
    ...clerkAuth,
    isAuthenticated: clerkAuth.isAuthenticated ?? Boolean(clerkAuth.userId),
    tokenType: clerkAuth.tokenType || (clerkAuth.userId ? 'oauth_token' : clerkAuth.tokenType),
    scopes: clerkAuth.scopes || MCP_SCOPES,
    clientId: clerkAuth.clientId || clerkAuth.userId || 'clerk',
  }
}

async function verifyCliToken(bearerToken) {
  const cliAuth = await authenticateCliToken(db, bearerToken)
  if (!cliAuth?.userId) {
    return undefined
  }

  await db
    .update(cliTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(cliTokens.id, cliAuth.id))

  return {
    token: bearerToken,
    clientId: `cli:${cliAuth.id}`,
    scopes: MCP_SCOPES,
    extra: {
      userId: cliAuth.userId,
      source: 'cli_token',
    },
  }
}

async function verifyClerkOAuthToken(bearerToken) {
  const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
  return verifyClerkToken(normalizeClerkAuth(clerkAuth), bearerToken)
}

export async function verifyMcpToken(_request, bearerToken) {
  if (!bearerToken) {
    return undefined
  }

  const cliAuthInfo = await verifyCliToken(bearerToken)
  if (cliAuthInfo) {
    return cliAuthInfo
  }

  try {
    return await verifyClerkOAuthToken(bearerToken)
  } catch (error) {
    console.error('MCP OAuth verification failed:', error)
    return undefined
  }
}

export function runWithMcpAuth(authInfo, callback) {
  return mcpAuthStore.run(authInfo || null, callback)
}

export function getMcpAuthInfo(ctx) {
  return (
    mcpAuthStore.getStore()
    || ctx?.http?.authInfo
    || ctx?.authInfo
    || ctx?.request?.auth
    || null
  )
}

export function getMcpUserId(ctx) {
  const authInfo = getMcpAuthInfo(ctx)
  return authInfo?.extra?.userId || authInfo?.extra?.user_id || null
}

export function requireMcpUserId(ctx) {
  const userId = getMcpUserId(ctx)
  if (!userId) {
    throw new Error('Authentication required')
  }
  return userId
}
