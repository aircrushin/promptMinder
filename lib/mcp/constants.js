export const MCP_PATH = '/mcp'
export const MCP_RESOURCE_METADATA_PATH = '/.well-known/oauth-protected-resource/mcp'
export const MCP_AUTHORIZATION_SERVER_METADATA_PATH = '/.well-known/oauth-authorization-server'
export const MCP_REGISTRATION_PATH = '/oauth/register'
export const MCP_OAUTH_APP_NAME = 'PromptMinder MCP'
export const MCP_SERVER_NAME = 'promptminder'
export const MCP_SERVER_VERSION = '0.2.0'
export const MCP_SCOPES = ['openid', 'profile', 'email']
export const MCP_DEFAULT_LIMIT = 8
export const MCP_MAX_LIMIT = 20
export const MCP_PUBLIC_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.prompt-minder.com'

export const MCP_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, MCP-Protocol-Version, Last-Event-ID, Accept',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, MCP-Protocol-Version',
  'Access-Control-Max-Age': '86400',
}

export const MCP_INSTRUCTIONS = [
  'PromptMinder MCP lets AI clients look up and manage prompts from the signed-in user library.',
  'Call list_teams first if you need a workspace id.',
  'Omit team_id on search_prompts or get_prompt to search every accessible workspace.',
  'Omit team_id on create_prompt to write to the personal workspace.',
  'Use search_prompts with a fuzzy phrase or a shortcut, then get_prompt with the returned id to load full content.',
  'Use create_prompt, update_prompt, and delete_prompt to mutate prompts. delete_prompt requires confirm=true.',
  'If a team requires approval, create or update returns a pending change request instead of writing immediately.',
  'Shortcut examples: /code-review, tag:writing, #sql, id:<uuid>, team:<uuid>.',
].join(' ')
