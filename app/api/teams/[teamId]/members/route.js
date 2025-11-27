import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { TeamService, TEAM_STATUSES } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'

async function getTeamId(paramsPromise) {
  const { teamId } = await paramsPromise
  if (!teamId) {
    throw new Error('Team id missing in route params')
  }
  return teamId
}

export async function GET(_request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()

    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    await teamService.requireMembership(teamId, userId)

    const { data, error } = await supabase
      .from('team_members')
      .select('user_id, email, role, status, invited_by, invited_at, joined_at, left_at, created_at, updated_at')
      .eq('team_id', teamId)
      .in('status', [TEAM_STATUSES.ACTIVE, TEAM_STATUSES.PENDING])
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ members: data || [] })
  } catch (error) {
    return handleApiError(error, 'Unable to list team members')
  }
}

export async function POST(request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()
    const { username, role } = await request.json()

    if (!username || !username.trim()) {
      return NextResponse.json({ error: '用户名是必填项' }, { status: 400 })
    }

    const normalizedUsername = username.trim().toLowerCase()
    const supabase = createSupabaseServerClient()

    // 查找用户
    const { data: targetUser, error: findError } = await supabase
      .from('users')
      .select('id, username, display_name')
      .eq('username', normalizedUsername)
      .single()
        
    if (findError || !targetUser) {
      return NextResponse.json({ error: '未找到该用户名对应的用户' }, { status: 404 })
    }

    const teamService = new TeamService(supabase)
    const membership = await teamService.inviteMember(teamId, userId, {
      userId: targetUser.id,
      email: null, // 本地认证不使用邮箱
      role
    })

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to invite member')
  }
}
