import { MCP_CORS_HEADERS, MCP_PUBLIC_ORIGIN } from './constants.js'

export function getRequestOrigin(request) {
  const forwardedHost = request?.headers?.get?.('x-forwarded-host')
  const forwardedProto = request?.headers?.get?.('x-forwarded-proto')
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim()
    const proto = (forwardedProto || 'https').split(',')[0].trim()
    return `${proto}://${host}`
  }

  try {
    return new URL(request.url).origin
  } catch {
    return MCP_PUBLIC_ORIGIN.replace(/\/$/, '')
  }
}

export function applyCorsHeaders(headers) {
  const nextHeaders = { ...MCP_CORS_HEADERS }
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      nextHeaders[key] = value
    })
  } else if (headers && typeof headers === 'object') {
    Object.assign(nextHeaders, headers)
  }
  Object.assign(nextHeaders, MCP_CORS_HEADERS)
  return nextHeaders
}

export function jsonWithCors(body, init = {}) {
  const { cacheControl, headers, ...rest } = init
  return Response.json(body, {
    ...rest,
    headers: applyCorsHeaders({
      'Cache-Control': cacheControl || (rest.status && rest.status >= 500 ? 'no-store' : 'max-age=3600'),
      'Content-Type': 'application/json',
      ...(headers || {}),
    }),
  })
}

export function emptyCorsResponse(status = 204) {
  return new Response(null, {
    status,
    headers: applyCorsHeaders(),
  })
}

export function withCors(handler) {
  return async (request) => {
    if (request.method === 'OPTIONS') {
      return emptyCorsResponse()
    }

    const response = await handler(request)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: applyCorsHeaders(response.headers),
    })
  }
}

export function mcpTextResult(payload) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
  return {
    content: [{ type: 'text', text }],
  }
}

export function mcpErrorResult(message) {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  }
}
