import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

function applyPromptFilters(query, { teamId, userId, tag, search }) {
  const baseQuery = teamId
    ? query.eq('team_id', teamId)
    : query.or(`created_by.eq.${userId},user_id.eq.${userId}`)

  let filteredQuery = baseQuery

  if (tag) {
    filteredQuery = filteredQuery.ilike('tags', `%${tag}%`)
  }

  if (search) {
    filteredQuery = filteredQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  return filteredQuery
}

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    const filters = { teamId, userId, tag, search }

    const dataQuery = applyPromptFilters(
      supabase
        .from('prompts')
        .select('*'),
      filters
    )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const countQuery = applyPromptFilters(
      supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true }),
      filters
    )

    const [promptsResult, countResult] = await Promise.all([dataQuery, countQuery])

    if (promptsResult.error) {
      throw promptsResult.error
    }

    if (countResult.error) {
      throw countResult.error
    }

    return NextResponse.json({
      prompts: promptsResult.data || [],
      pagination: {
        page,
        limit,
        total: countResult.count || 0,
        totalPages: Math.ceil((countResult.count || 0) / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load prompts')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    let targetTeamId = null
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
      targetTeamId = teamId
    }

    const data = await request.json()
    const timestamp = new Date().toISOString()

    const promptPayload = {
      id: crypto.randomUUID(),
      team_id: targetTeamId,
      project_id: targetTeamId ? data.projectId || null : null,
      title: data.title,
      content: data.content,
      description: data.description || null,
      created_by: userId,
      user_id: userId,
      version: data.version || null,
      tags: data.tags || null,
      is_public: data.is_public ?? false,
      cover_img: data.cover_img || data.image_url || null,
      created_at: timestamp,
      updated_at: timestamp
    }

    const { data: newPrompt, error } = await supabase
      .from('prompts')
      .insert([promptPayload])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newPrompt, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create prompt')
  }
}
