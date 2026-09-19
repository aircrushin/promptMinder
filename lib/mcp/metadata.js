import {
  fetchClerkAuthorizationServerMetadata,
  generateClerkProtectedResourceMetadata,
} from '@clerk/mcp-tools/server'
import { MCP_SCOPES } from './constants.js'
import { emptyCorsResponse, getRequestOrigin, jsonWithCors } from './http.js'

export function createProtectedResourceMetadataHandler() {
  return (request) => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    if (!publishableKey) {
      return jsonWithCors({ error: 'MCP OAuth is not configured' }, { status: 500 })
    }

    const origin = getRequestOrigin(request)
    const metadata = generateClerkProtectedResourceMetadata({
      publishableKey,
      resourceUrl: `${origin}/mcp`,
      properties: {
        scopes_supported: MCP_SCOPES,
        bearer_methods_supported: ['header'],
      },
    })

    return jsonWithCors(metadata)
  }
}

export function createAuthorizationServerMetadataHandler() {
  return async () => {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    if (!publishableKey) {
      return jsonWithCors({ error: 'MCP OAuth is not configured' }, { status: 500 })
    }

    const metadata = await fetchClerkAuthorizationServerMetadata({ publishableKey })
    return jsonWithCors(metadata)
  }
}

export function createMetadataOptionsHandler() {
  return () => emptyCorsResponse(200)
}
