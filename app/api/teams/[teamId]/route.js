import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { TeamService } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'
import { userClient } from '@/lib/local-auth/user-service.js'

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

    const team = await teamService.getTeam(teamId)

    const { data: members, error } = await supabase
      .from('team_members')
      .select('user_id, email, role, status, invited_at, joined_at, left_at, created_at, updated_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    const memberList = members || []
    const uniqueUserIds = Array.from(new Set([
      ...memberList.map((member) => member.user_id).filter(Boolean),
      team.owner_id,
    ].filter(Boolean)))

    const profileMap = new Map()

    if (uniqueUserIds.length > 0) {
      try {
        // 使用本地用户服务获取用户信息
        const result = await userClient.users.getUserList({
          userId: uniqueUserIds,
          limit: uniqueUserIds.length,
        })

        const users = result?.data || []

        users.forEach((user) => {
          if (!user) return
          profileMap.set(user.id, {
            displayName: user.displayName || user.username || user.id,
            email: null, // 本地认证不使用邮箱
          })
        })

        // 为未找到的用户设置默认值
        uniqueUserIds.forEach((id) => {
          if (!profileMap.has(id)) {
            profileMap.set(id, {
              displayName: id,
              email: null,
            })
          }
        })
      } catch (fetchError) {
        console.error(`[teams/${teamId}] failed to load users`, fetchError)
        // 设置默认值
        uniqueUserIds.forEach((id) => {
          profileMap.set(id, {
            displayName: id,
            email: null,
          })
        })
      }
    }

    const enrichedMembers = memberList.map((member) => {
      const profile = member.user_id ? profileMap.get(member.user_id) : null
      return {
        ...member,
        display_name: profile?.displayName || member.email || member.user_id || '未知成员',
        primary_email: profile?.email || member.email || null,
      }
    })

    const ownerProfile = team.owner_id ? profileMap.get(team.owner_id) : null
    const ownerDisplayName = ownerProfile?.displayName
      || enrichedMembers.find((member) => member.role === 'owner')?.display_name
      || team.owner_id

    return NextResponse.json({
      team: {
        ...team,
        owner_display_name: ownerDisplayName,
      },
      members: enrichedMembers,
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load team details')
  }
}

export async function PATCH(request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()
    const payload = await request.json()

    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    const team = await teamService.updateTeam(teamId, {
      name: payload.name,
      description: payload.description,
      avatar_url: payload.avatarUrl
    }, userId)

    return NextResponse.json({ team })
  } catch (error) {
    return handleApiError(error, 'Unable to update team')
  }
}

export async function DELETE(_request, { params }) {
  try {
    const teamId = await getTeamId(params)
    const userId = await requireUserId()

    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    await teamService.deleteTeam(teamId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete team')
  }
}
