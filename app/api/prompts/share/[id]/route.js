import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { TEAM_ROLES } from '@/lib/team-service.js'

export async function POST(request, { params }) {
  try {
    const { id: promptId } = await params
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt id is required' }, { status: 400 })
    }

    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let membership = null
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId)
    }

    let query = supabase
      .from('prompts')
      .select('id, created_by, user_id, team_id, is_public')
      .eq('id', promptId)

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

    const isOwner = prompt.created_by === userId || prompt.user_id === userId
    const canShare = isOwner || [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership?.role)

    if (!canShare) {
      return NextResponse.json({ error: '只有创建者或团队管理员可以分享提示词' }, { status: 403 })
    }

    if (prompt.is_public) {
      return NextResponse.json({ message: 'Prompt already shared' })
    }

    let updateQuery = supabase
      .from('prompts')
      .update({
        is_public: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId)

    if (prompt.team_id) {
      updateQuery = updateQuery.eq('team_id', prompt.team_id)
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ message: 'Prompt shared successfully' })
  } catch (error) {
    return handleApiError(error, 'Unable to share prompt')
  }
}
