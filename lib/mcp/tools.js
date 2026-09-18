import { z } from 'zod'
import { ApiError } from '@/lib/api-error.js'
import { requireMcpUserId } from './auth.js'
import { mcpErrorResult, mcpTextResult } from './http.js'
import {
  getMcpPrompt,
  listMcpWorkspaces,
  resolveMcpPromptContent,
  searchMcpPrompts,
} from './prompts.js'

const querySchema = z.object({
  query: z.string().describe('Fuzzy phrase or shortcut such as /code-review, tag:writing, #sql, or id:<uuid>'),
  team_id: z.string().optional().describe('Optional team workspace id. Omit to search every accessible workspace.'),
  limit: z.number().int().min(1).max(20).optional().describe('Maximum number of matches to return. Default 8.'),
})

const getPromptSchema = z.object({
  id: z.string().describe('Prompt id returned by search_prompts'),
  team_id: z.string().optional().describe('Optional team workspace id if you already know it'),
})

async function runMcpTool(ctx, executor) {
  try {
    const userId = requireMcpUserId(ctx)
    const payload = await executor(userId)
    return mcpTextResult(payload)
  } catch (error) {
    if (error instanceof ApiError) {
      return mcpErrorResult(error.message)
    }
    console.error('MCP tool failed:', error)
    return mcpErrorResult(error.message || 'Unable to complete MCP request')
  }
}

export function registerPromptMinderMcp(server) {
  server.registerTool(
    'search_prompts',
    {
      title: 'Search prompts',
      description: 'Find saved PromptMinder prompts with a fuzzy phrase or slash shortcut. Returns summaries only; call get_prompt for full content.',
      inputSchema: querySchema,
    },
    async ({ query, team_id: teamId, limit }, ctx) => runMcpTool(ctx, (userId) => (
      searchMcpPrompts(userId, { query, teamId, limit })
    )),
  )

  server.registerTool(
    'get_prompt',
    {
      title: 'Get prompt',
      description: 'Load the full content of a saved PromptMinder prompt by id.',
      inputSchema: getPromptSchema,
    },
    async ({ id, team_id: teamId }, ctx) => runMcpTool(ctx, (userId) => (
      getMcpPrompt(userId, { id, teamId })
    )),
  )

  server.registerTool(
    'list_teams',
    {
      title: 'List workspaces',
      description: 'List PromptMinder workspaces the authorized user can search. Personal workspace uses a null team id.',
      inputSchema: z.object({}),
    },
    async (_args, ctx) => runMcpTool(ctx, (userId) => listMcpWorkspaces(userId)),
  )

  server.registerPrompt(
    'prompt',
    {
      title: 'Use a PromptMinder prompt',
      description: 'Look up a saved prompt with a slash shortcut or fuzzy query and return its content when there is a clear match.',
      argsSchema: z.object({
        query: z.string().describe('Slash shortcut like /code-review, or a fuzzy phrase'),
        team_id: z.string().optional().describe('Optional team workspace id'),
      }),
    },
    async ({ query, team_id: teamId }, ctx) => {
      let userId
      try {
        userId = requireMcpUserId(ctx)
      } catch (error) {
        return {
          description: 'Authentication required',
          messages: [{ role: 'user', content: { type: 'text', text: error.message } }],
        }
      }

      const resolved = await resolveMcpPromptContent(userId, { query, teamId }).catch((error) => ({
        mode: 'empty',
        matches: [],
        error: error.message,
      }))

      if (resolved.mode === 'exact') {
        return {
          description: resolved.prompt.title,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: [
                  `Prompt: ${resolved.prompt.title}`,
                  resolved.prompt.description ? `Description: ${resolved.prompt.description}` : null,
                  resolved.prompt.tags ? `Tags: ${resolved.prompt.tags}` : null,
                  '',
                  resolved.prompt.content,
                ].filter(Boolean).join('\n'),
              },
            },
          ],
        }
      }

      const text = resolved.mode === 'empty'
        ? `No PromptMinder prompt matched "${query}". Try another slash shortcut or a shorter phrase.`
        : [
          `Multiple PromptMinder prompts matched "${query}". Ask the user which id to load with get_prompt.`,
          JSON.stringify(resolved.matches, null, 2),
        ].join('\n\n')

      return {
        description: 'Prompt lookup result',
        messages: [
          {
            role: 'user',
            content: { type: 'text', text },
          },
        ],
      }
    },
  )
}
