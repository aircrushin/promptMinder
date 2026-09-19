import { z } from 'zod'
import { ApiError } from '@/lib/api-error.js'
import { requireMcpUserId } from './auth.js'
import { mcpErrorResult, mcpTextResult } from './http.js'
import {
  createMcpPrompt,
  deleteMcpPrompt,
  updateMcpPrompt,
} from './mutations.js'
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

const createPromptSchema = z.object({
  title: z.string().describe('Prompt title'),
  content: z.string().describe('Full prompt content'),
  description: z.string().optional().describe('Optional short description'),
  tags: z.string().optional().describe('Optional comma-separated tags, such as writing,sql'),
  version: z.string().optional().describe('Optional version label, such as 1.0.0'),
  team_id: z.string().optional().describe('Team workspace id. Omit to create in the personal workspace.'),
})

const updatePromptSchema = z.object({
  id: z.string().describe('Prompt id returned by search_prompts'),
  team_id: z.string().optional().describe('Optional team workspace id if you already know it'),
  title: z.string().optional().describe('New title'),
  content: z.string().optional().describe('New full prompt content'),
  description: z.string().optional().describe('New short description'),
  tags: z.string().optional().describe('New comma-separated tags'),
  version: z.string().optional().describe('New version label'),
})

const deletePromptSchema = z.object({
  id: z.string().describe('Prompt id returned by search_prompts'),
  team_id: z.string().optional().describe('Optional team workspace id if you already know it'),
  confirm: z.union([z.literal(true), z.literal('true')]).describe('Must be true to permanently delete the prompt'),
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

  server.registerTool(
    'create_prompt',
    {
      title: 'Create prompt',
      description: 'Create a new PromptMinder prompt. Omit team_id to save in the personal workspace. Teams with approval enabled return a pending change request.',
      inputSchema: createPromptSchema,
    },
    async ({ title, content, description, tags, version, team_id: teamId }, ctx) => runMcpTool(ctx, (userId) => (
      createMcpPrompt(userId, { title, content, description, tags, version, teamId })
    )),
  )

  server.registerTool(
    'update_prompt',
    {
      title: 'Update prompt',
      description: 'Update title, content, description, tags, or version of a saved prompt. Only the creator or team managers can write immediately; approval-enabled teams return a pending change request.',
      inputSchema: updatePromptSchema,
    },
    async ({ id, team_id: teamId, title, content, description, tags, version }, ctx) => runMcpTool(ctx, (userId) => (
      updateMcpPrompt(userId, { id, teamId, title, content, description, tags, version })
    )),
  )

  server.registerTool(
    'delete_prompt',
    {
      title: 'Delete prompt',
      description: 'Permanently delete a saved PromptMinder prompt. Requires confirm=true. Only the creator or team managers can delete.',
      inputSchema: deletePromptSchema,
    },
    async ({ id, team_id: teamId, confirm }, ctx) => runMcpTool(ctx, (userId) => (
      deleteMcpPrompt(userId, { id, teamId, confirm })
    )),
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
