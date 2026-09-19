import {
  createMetadataOptionsHandler,
  createProtectedResourceMetadataHandler,
} from '@/lib/mcp/metadata.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = createProtectedResourceMetadataHandler()
const optionsHandler = createMetadataOptionsHandler()

export function GET(request) {
  return handler(request)
}

export function OPTIONS() {
  return optionsHandler()
}
