import { and, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index.js'
import { ApiError } from '@/lib/api-error.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { db as defaultDb } from '@/lib/db.js'
import { TEAM_STATUSES, TeamService } from '@/lib/team-service.js'
import { MCP_DEFAULT_LIMIT, MCP_MAX_LIMIT } from './constants.js'
import { parsePromptQuery, rankPrompt, sanitizeLikeTerm } from './query.js'

function clampLimit(limit) {
  const parsed = Number.parseInt(limit, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return MCP_DEFAULT_LIMIT
  }
  return Math.min(parsed, MCP_MAX_LIMIT)
}

function formatPromptSummary(prompt) {
  return {
    id: prompt.id,
    title: prompt.title,
    description: prompt.description || '',
    tags: prompt.tags || '',
    version: prompt.version || null,
    team_id: prompt.team_id || null,
    updated_at: prompt.updated_at || null,
  }
}

function formatPromptDetail(prompt) {
  return {
    ...formatPromptSummary(prompt),
    content: prompt.content || '',
  }
}

export function buildMcpPromptAccessScope({ userId, teamId = null, teamIds = [] }) {
  if (teamId) {
    return eq(prompts.teamId, teamId)
  }

  const personalScope = and(
    isNull(prompts.teamId),
    or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)),
  )

  if (!teamIds.length) {
    return personalScope
  }

  return or(personalScope, inArray(prompts.teamId, teamIds))
}

export async function resolveMcpWorkspace(db, userId, requestedTeamId) {
  const teamService = new TeamService(db)
  const memberships = await teamService.listTeamsForUser(userId)
  const activeMemberships = memberships.filter((item) => item.status === TEAM_STATUSES.ACTIVE)
  const sharedTeamIds = activeMemberships
    .filter((item) => !item.team?.is_personal)
    .map((item) => item.team.id)

  if (!requestedTeamId) {
    return {
      mode: 'all',
      teamId: null,
      teamIds: sharedTeamIds,
      memberships: activeMemberships,
    }
  }

  const membership = activeMemberships.find((item) => item.team?.id === requestedTeamId)
  if (!membership) {
    throw new ApiError(403, 'You are not a member of this team')
  }

  if (membership.team?.is_personal) {
    return {
      mode: 'personal',
      teamId: null,
      teamIds: [],
      memberships: activeMemberships,
    }
  }

  return {
    mode: 'team',
    teamId: requestedTeamId,
    teamIds: [requestedTeamId],
    memberships: activeMemberships,
  }
}

function buildSearchCondition(parsed) {
  const conditions = []
  const tag = sanitizeLikeTerm(parsed.tag)
  const search = sanitizeLikeTerm(parsed.search)

  if (tag) {
    conditions.push(ilike(prompts.tags, `%${tag}%`))
  }

  if (search) {
    const hyphenated = search.replace(/\s+/g, '-')
    conditions.push(or(
      ilike(prompts.title, `%${search}%`),
      ilike(prompts.title, `%${hyphenated}%`),
      ilike(prompts.description, `%${search}%`),
      ilike(prompts.tags, `%${search}%`),
    ))
  }

  return conditions.length ? and(...conditions) : undefined
}

export async function listMcpWorkspaces(userId, { db = defaultDb } = {}) {
  const workspace = await resolveMcpWorkspace(db, userId, null)
  return {
    default_scope: 'all accessible workspaces',
    workspaces: [
      {
        id: null,
        name: 'Personal',
        is_personal: true,
        note: 'Omit team_id or pass the personal team id to use this workspace.',
      },
      ...workspace.memberships
        .filter((item) => !item.team?.is_personal)
        .map((item) => ({
          id: item.team.id,
          name: item.team.name,
          is_personal: false,
          role: item.role,
          description: item.team.description || '',
        })),
    ],
  }
}

export async function getMcpPrompt(userId, { id, teamId = null, db = defaultDb } = {}) {
  if (!id) {
    throw new ApiError(400, 'Prompt id is required')
  }

  const workspace = await resolveMcpWorkspace(db, userId, teamId || null)
  const rows = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      description: prompts.description,
      tags: prompts.tags,
      version: prompts.version,
      teamId: prompts.teamId,
      content: prompts.content,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .where(and(
      eq(prompts.id, id),
      buildMcpPromptAccessScope({
        userId,
        teamId: workspace.teamId,
        teamIds: workspace.teamIds,
      }),
    ))
    .limit(1)

  const prompt = rows[0] ? toSnakeCase(rows[0]) : null
  if (!prompt) {
    throw new ApiError(404, 'Prompt not found')
  }

  return formatPromptDetail(prompt)
}

export async function searchMcpPrompts(userId, {
  query = '',
  teamId = null,
  limit = MCP_DEFAULT_LIMIT,
  db = defaultDb,
} = {}) {
  const parsed = parsePromptQuery(query)
  const workspace = await resolveMcpWorkspace(db, userId, teamId || parsed.teamId || null)
  const accessScope = buildMcpPromptAccessScope({
    userId,
    teamId: workspace.teamId,
    teamIds: workspace.teamIds,
  })

  if (parsed.id) {
    try {
      const prompt = await getMcpPrompt(userId, { id: parsed.id, teamId: workspace.mode === 'team' ? workspace.teamId : teamId, db })
      return {
        query: parsed,
        matches: [prompt],
        total: 1,
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { query: parsed, matches: [], total: 0 }
      }
      throw error
    }
  }

  const searchCondition = buildSearchCondition(parsed)
  const whereCondition = searchCondition ? and(accessScope, searchCondition) : accessScope
  const fetchLimit = Math.max(clampLimit(limit) * 3, 24)

  const rows = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      description: prompts.description,
      tags: prompts.tags,
      version: prompts.version,
      teamId: prompts.teamId,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .where(whereCondition)
    .orderBy(desc(prompts.updatedAt))
    .limit(fetchLimit)

  const matches = rows
    .map((row) => toSnakeCase(row))
    .map((prompt) => ({
      ...formatPromptSummary(prompt),
      score: rankPrompt(prompt, parsed),
    }))
    .sort((left, right) => right.score - left.score || String(right.updated_at || '').localeCompare(String(left.updated_at || '')))
    .slice(0, clampLimit(limit))

  return {
    query: parsed,
    matches,
    total: matches.length,
    hint: matches.length
      ? 'Call get_prompt with an id to load the full prompt content.'
      : 'No prompts matched. Try a slash shortcut like /code-review, a tag like tag:writing, or a shorter phrase.',
  }
}

export async function resolveMcpPromptContent(userId, {
  query = '',
  teamId = null,
  db = defaultDb,
} = {}) {
  const result = await searchMcpPrompts(userId, { query, teamId, limit: 5, db })
  if (result.matches.length === 1 && (result.matches[0].content || result.matches[0].score >= 70 || result.query.id)) {
    if (result.matches[0].content) {
      return {
        mode: 'exact',
        prompt: result.matches[0],
      }
    }
    const prompt = await getMcpPrompt(userId, { id: result.matches[0].id, teamId, db })
    return { mode: 'exact', prompt }
  }

  if (result.matches.length === 1) {
    const prompt = await getMcpPrompt(userId, { id: result.matches[0].id, teamId, db })
    return { mode: 'exact', prompt }
  }

  return {
    mode: result.matches.length ? 'choices' : 'empty',
    ...result,
  }
}
