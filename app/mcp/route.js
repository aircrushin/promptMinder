import { handleMcpOptions, mcpHttpHandler } from '@/lib/mcp/server.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request) {
  return mcpHttpHandler(request)
}

export async function POST(request) {
  return mcpHttpHandler(request)
}

export async function DELETE(request) {
  return mcpHttpHandler(request)
}

export function OPTIONS() {
  return handleMcpOptions()
}
