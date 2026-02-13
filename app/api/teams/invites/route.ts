import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/handle-api-error'
import { requireUserId } from '@/lib/auth'
import { TEAM_STATUSES } from '@/lib/team-service'
import { eq, and, desc } from 'drizzle-orm'
import { teamMembers, teams } from '@/drizzle/schema/index'

export async function GET() {
  try {
    const userId = await requireUserId()

    const rows = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        role: teamMembers.role,
        email: teamMembers.email,
        status: teamMembers.status,
        invitedAt: teamMembers.invitedAt,
        tId: teams.id,
        tName: teams.name,
        tDescription: teams.description,
        tAvatarUrl: teams.avatarUrl,
        tIsPersonal: teams.isPersonal,
        tOwnerId: teams.ownerId,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, TEAM_STATUSES.PENDING)))
      .orderBy(desc(teamMembers.invitedAt))

    const invites = rows.map(row => ({
      id: row.id,
      team_id: row.teamId,
      role: row.role,
      email: row.email,
      status: row.status,
      invited_at: row.invitedAt,
      team: {
        id: row.tId,
        name: row.tName,
        description: row.tDescription,
        avatar_url: row.tAvatarUrl,
        is_personal: row.tIsPersonal,
        owner_id: row.tOwnerId,
      }
    }))

    return NextResponse.json({ invites })
  } catch (error) {
    return handleApiError(error, 'Unable to load team invites')
  }
}
