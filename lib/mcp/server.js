import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import {
  MCP_INSTRUCTIONS,
  MCP_RESOURCE_METADATA_PATH,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
} from './constants.js'
import { runWithMcpAuth, verifyMcpToken } from './auth.js'
import { emptyCorsResponse, withCors } from './http.js'
import { registerPromptMinderMcp } from './tools.js'

const mcpHandler = createMcpHandler(
  (server) => {
    registerPromptMinderMcp(server)
  },
  {
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    instructions: MCP_INSTRUCTIONS,
  },
)

const authenticatedHandler = withMcpAuth(
  async (request) => runWithMcpAuth(request.auth, () => mcpHandler(request)),
  verifyMcpToken,
  {
    required: true,
    resourceMetadataPath: MCP_RESOURCE_METADATA_PATH,
  },
)

export const mcpHttpHandler = withCors(authenticatedHandler)

export function handleMcpOptions() {
  return emptyCorsResponse()
}
