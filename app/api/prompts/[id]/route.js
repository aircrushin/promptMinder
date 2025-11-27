import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { TEAM_ROLES } from '@/lib/team-service.js'

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Prompt id missing in route params')
  }
  return id
}

function isCreator(prompt, userId) {
  return prompt.created_by === userId || prompt.user_id === userId
}

function ensureManagerPermission(membership) {
  return membership && [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership.role)
}

export async function GET(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    let query = supabase.from('prompts').select('*').eq('id', id)
    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.or(`created_by.eq.${userId},user_id.eq.${userId}`)
    }

    const { data: prompt, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    return handleApiError(error, 'Unable to load prompt')
  }
}

export async function POST(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    let query = supabase.from('prompts').select('*').eq('id', id)
    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.or(`created_by.eq.${userId},user_id.eq.${userId}`)
    }

    const { data: prompt, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (!isCreator(prompt, userId) && !ensureManagerPermission(membership)) {
      return NextResponse.json({ error: 'Only the creator or team managers can update this prompt' }, { status: 403 })
    }

    const payload = await request.json()

    const updateData = {
      updated_at: new Date().toISOString(),
    }

    if (payload.title !== undefined) updateData.title = payload.title
    if (payload.content !== undefined) updateData.content = payload.content
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.is_public !== undefined) updateData.is_public = payload.is_public
    if (payload.tags !== undefined) updateData.tags = payload.tags
    if (payload.image_url !== undefined || payload.cover_img !== undefined) {
      updateData.cover_img = payload.cover_img ?? payload.image_url
    }
    if (payload.version !== undefined) updateData.version = payload.version
    if (payload.projectId !== undefined) updateData.project_id = payload.projectId

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ message: 'No changes supplied' })
    }

    let updateQuery = supabase.from('prompts').update(updateData).eq('id', id)
    if (prompt.team_id) {
      updateQuery = updateQuery.eq('team_id', prompt.team_id)
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ message: 'Prompt updated successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to update prompt')
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await getPromptId(params)
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    let query = supabase.from('prompts').select('id, created_by, user_id, team_id').eq('id', id)
    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.or(`created_by.eq.${userId},user_id.eq.${userId}`)
    }

    const { data: prompt, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const canDelete = isCreator(prompt, userId) || ensureManagerPermission(membership)
    if (!canDelete) {
      return NextResponse.json({ error: 'Only the creator or team managers can delete this prompt' }, { status: 403 })
    }

    let deleteQuery = supabase.from('prompts').delete().eq('id', id)
    if (prompt.team_id) {
      deleteQuery = deleteQuery.eq('team_id', prompt.team_id)
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ message: 'Prompt deleted successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to delete prompt')
  }
}
