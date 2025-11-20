import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { TeamService, TEAM_STATUSES } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'
import { clerkClient } from '@clerk/nextjs/server'

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
    const { email: targetEmail, role } = await request.json()

    if (!targetEmail || !targetEmail.trim()) {
      return NextResponse.json({ error: '有效的邮箱地址是必填项' }, { status: 400 })
    }

    const normalizedEmail = targetEmail.trim().toLowerCase()
    let clerk

    try {
      // Handle both function (v5+) and object (older) forms of clerkClient
      if (typeof clerkClient === 'function') {
        clerk = await clerkClient()
      } else {
        clerk = clerkClient
      }
    } catch (clerkError) {
      console.error('[team-members] Failed to initialize Clerk client', clerkError)
      return NextResponse.json(
        { error: '用户服务暂时不可用', details: clerkError.message }, 
        { status: 503 }
      )
    }

    if (!clerk?.users) {
      console.error('[team-members] Clerk client invalid:', { 
        type: typeof clerk, 
        hasUsers: !!clerk?.users,
        isFunction: typeof clerkClient === 'function'
      })
      return NextResponse.json({ error: '用户服务暂时不可用' }, { status: 503 })
    }

    const result = await clerk.users.getUserList({ emailAddress: [normalizedEmail], limit: 1 })
    
    // Handle both Array and PaginatedResponse formats
    const users = Array.isArray(result?.data) 
      ? result.data 
      : Array.isArray(result) 
        ? result 
        : []
        
    if (!users.length) {
      console.warn(`[team-members] User not found for email: ${normalizedEmail}`, {
        resultType: typeof result,
        hasData: !!result?.data,
        isArray: Array.isArray(result)
      })
      return NextResponse.json({ error: '未找到该邮箱对应的用户' }, { status: 404 })
    }

    const targetUser = users[0]

    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    const membership = await teamService.inviteMember(teamId, userId, {
      userId: targetUser.id,
      email: normalizedEmail,
      role
    })

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to invite member')
  }
}
