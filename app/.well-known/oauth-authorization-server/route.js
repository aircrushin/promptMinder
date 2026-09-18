import {
  createAuthorizationServerMetadataHandler,
  createMetadataOptionsHandler,
} from '@/lib/mcp/metadata.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = createAuthorizationServerMetadataHandler()
const optionsHandler = createMetadataOptionsHandler()

export function GET() {
  return handler()
}

export function OPTIONS() {
  return optionsHandler()
}
