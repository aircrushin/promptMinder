import { MCP_OAUTH_APP_NAME, MCP_SCOPES } from './constants.js'
import { emptyCorsResponse, jsonWithCors } from './http.js'

const CLERK_API_BASE = process.env.CLERK_API_URL || 'https://api.clerk.com/v1'

function getClientId(app) {
  return app?.client_id || app?.clientId || null
}

function getRedirectUris(app) {
  const uris = app?.redirect_uris || app?.redirectUris || []
  return Array.isArray(uris) ? uris.filter(Boolean) : []
}

function getIssuedAt(app) {
  const raw = app?.created_at || app?.createdAt
  const millis = raw ? Date.parse(raw) : Date.now()
  return Math.floor((Number.isNaN(millis) ? Date.now() : millis) / 1000)
}

export function parseRegistrationRequest(body) {
  const redirectUris = Array.isArray(body?.redirect_uris)
    ? body.redirect_uris.map((uri) => {
      if (typeof uri !== 'string' || !uri.trim()) return null
      let parsed
      try { parsed = new URL(uri.trim()) } catch { return null }
      const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
      if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.hash
        || (parsed.protocol === 'http:' && !loopback)) return null
      return parsed.href
    }).filter(Boolean)
    : []

  if (redirectUris.length === 0) {
    const error = new Error('redirect_uris must contain at least one URI')
    error.status = 400
    error.code = 'invalid_client_metadata'
    throw error
  }

  const authMethod = body?.token_endpoint_auth_method || 'none'
  return {
    clientName: typeof body?.client_name === 'string' && body.client_name.trim()
      ? body.client_name.trim().slice(0, 256)
      : MCP_OAUTH_APP_NAME,
    redirectUris,
    publicClient: authMethod === 'none' || !authMethod,
  }
}

export function mergeRedirectUris(existing = [], incoming = []) {
  return [...new Set([...existing, ...incoming])]
}

export function toRfc7591Client(app, redirectUris) {
  return {
    client_id: getClientId(app),
    client_id_issued_at: getIssuedAt(app),
    client_name: app?.name || MCP_OAUTH_APP_NAME,
    redirect_uris: redirectUris || getRedirectUris(app),
    token_endpoint_auth_method: app?.public === false ? 'client_secret_basic' : 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    scope: MCP_SCOPES.join(' '),
  }
}

async function clerkOAuthRequest(path, { method = 'GET', body } = {}) {
  const secret = process.env.CLERK_SECRET_KEY
  if (!secret) {
    const error = new Error('MCP OAuth registration is not configured')
    error.status = 503
    error.code = 'temporarily_unavailable'
    throw error
  }

  const response = await fetch(`${CLERK_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload?.errors?.[0]?.message || payload?.message || 'Clerk OAuth request failed')
    error.status = response.status >= 400 && response.status < 500 ? 400 : 502
    error.code = 'invalid_client_metadata'
    throw error
  }
  return payload
}

async function createOAuthApp({ name, redirectUris, publicClient }) {
  return clerkOAuthRequest('/oauth_applications', {
    method: 'POST',
    body: {
      name: name || MCP_OAUTH_APP_NAME,
      redirect_uris: redirectUris,
      scopes: MCP_SCOPES.join(' '),
      public: publicClient,
    },
  })
}

export async function registerDynamicClient(body) {
  const request = parseRegistrationRequest(body)
  // DCR registrations must be isolated. Never merge an untrusted redirect URI
  // into a shared OAuth application.
  const created = await createOAuthApp({
    name: request.clientName,
    redirectUris: request.redirectUris,
    publicClient: request.publicClient,
  })
  return toRfc7591Client(created, request.redirectUris)
}

export function createDynamicClientRegistrationHandler() {
  return async (request) => {
    try {
      const body = await request.json()
      const client = await registerDynamicClient(body)
      return jsonWithCors(client, { status: 201, cacheControl: 'no-store' })
    } catch (error) {
      console.error('MCP dynamic client registration failed:', error)
      return jsonWithCors({
        error: error.code || 'invalid_client_metadata',
        error_description: error.message || 'Unable to register OAuth client',
      }, {
        status: error.status || 400,
        cacheControl: 'no-store',
      })
    }
  }
}

export function createRegistrationOptionsHandler() {
  return () => emptyCorsResponse(200)
}
