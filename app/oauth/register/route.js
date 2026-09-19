import {
  createDynamicClientRegistrationHandler,
  createRegistrationOptionsHandler,
} from '@/lib/mcp/dcr.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = createDynamicClientRegistrationHandler()
const optionsHandler = createRegistrationOptionsHandler()

export function POST(request) {
  return handler(request)
}

export function OPTIONS() {
  return optionsHandler()
}
