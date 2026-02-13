import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TeamService } from '@/lib/team-service'
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

    const team = await teamService.getTeam(teamId)

    const memberRows = await db.select({
      userId: teamMembers.userId,
      email: teamMembers.email,
      role: teamMembers.role,
      status: teamMembers.status,
      invitedAt: teamMembers.invitedAt,
      joinedAt: teamMembers.joinedAt,
      leftAt: teamMembers.leftAt,
      createdAt: teamMembers.createdAt,
      updatedAt: teamMembers.updatedAt,
    }).from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .orderBy(asc(teamMembers.createdAt))

    const members = memberRows.map(toSnakeCase)

    const uniqueUserIds = Array.from(new Set([
      ...members.map((m) => m.user_id).filter(Boolean),
      team.owner_id,
    ].filter(Boolean)))

    const profileMap = new Map()

    if (uniqueUserIds.length > 0) {
      let clerk
      try {
        if (typeof clerkClient === 'function') {
          clerk = await clerkClient()
        } else {
          clerk = clerkClient
        }
      } catch (clerkError) {
        console.warn(`[teams/${teamId}] Failed to initialize Clerk client, falling back to basic info`, clerkError)
      }

      if (!clerk?.users) {
        uniqueUserIds.forEach((id) => {
          profileMap.set(id, { displayName: id, email: null })
        })
      } else {
        try {
          const result = await clerk.users.getUserList({ userId: uniqueUserIds, limit: uniqueUserIds.length })
          const users = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : []

          users.forEach((user) => {
            if (!user) return
            const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || null
            profileMap.set(user.id, {
              displayName: user.fullName || user.username || primaryEmail || user.id,
              email: primaryEmail,
            })
          })

          const missingUserIds = uniqueUserIds.filter((id) => !profileMap.has(id))
          if (missingUserIds.length > 0) {
            throw new Error('Incomplete batch fetch')
          }
        } catch (fetchError) {
          console.error(`[teams/${teamId}] failed to load batch users`, fetchError)
          await Promise.all(
            uniqueUserIds.map(async (id) => {
              if (profileMap.has(id)) return
              try {
                const user = await clerk.users.getUser(id)
                if (!user) {
                  profileMap.set(id, { displayName: id, email: null })
                  return
                }
                const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || null
                profileMap.set(id, {
                  displayName: user.fullName || user.username || primaryEmail || id,
                  email: primaryEmail,
                })
              } catch (singleError) {
                console.error(`[teams/${teamId}] failed to load user ${id}`, singleError)
                profileMap.set(id, { displayName: id, email: null })
              }
            })
          )
        }
      }
    }

    const enrichedMembers = members.map((member) => {
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
      team: { ...team, owner_display_name: ownerDisplayName },
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

    const teamService = new TeamService(db)
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

    const teamService = new TeamService(db)
    await teamService.deleteTeam(teamId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete team')
  }
}
