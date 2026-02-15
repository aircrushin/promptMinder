import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TeamService, TEAM_STATUSES } from '@/lib/team-service'
import { handleApiError } from '@/lib/handle-api-error'
import { requireUserId } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'
import { eq, and, inArray, asc } from 'drizzle-orm'
import { teamMembers } from '@/drizzle/schema/index'
import { toSnakeCase } from '@/lib/case-utils'

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

    const teamService = new TeamService(db)
    await teamService.requireMembership(teamId, userId)

    const rows = await db.select({
      userId: teamMembers.userId,
      email: teamMembers.email,
      role: teamMembers.role,
      status: teamMembers.status,
      invitedBy: teamMembers.invitedBy,
      invitedAt: teamMembers.invitedAt,
      joinedAt: teamMembers.joinedAt,
      leftAt: teamMembers.leftAt,
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
    }).from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        inArray(teamMembers.status, [TEAM_STATUSES.ACTIVE, TEAM_STATUSES.PENDING])
      ))
      .orderBy(asc(teamMembers.createdAt))

    return NextResponse.json({ members: rows.map(toSnakeCase) })
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
      if (typeof clerkClient === 'function') {
        clerk = await clerkClient()
      } else {
        clerk = clerkClient
      }
    } catch (clerkError) {
      console.error('[team-members] Failed to initialize Clerk client', clerkError)
      return NextResponse.json({ error: '用户服务暂时不可用', details: clerkError.message }, { status: 503 })
    }

    if (!clerk?.users) {
      return NextResponse.json({ error: '用户服务暂时不可用' }, { status: 503 })
    }

    const result = await clerk.users.getUserList({ emailAddress: [normalizedEmail], limit: 1 })
    const users = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []

    if (!users.length) {
      return NextResponse.json({ error: '未找到该邮箱对应的用户' }, { status: 404 })
    }

    const targetUser = users[0]

    const teamService = new TeamService(db)
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
