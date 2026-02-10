import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { TeamService } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'

export async function GET() {
  try {
    const userId = await requireUserId()
    const teamService = new TeamService(db)
    const teams = await teamService.listTeamsForUser(userId, { includePending: true })

    return NextResponse.json({ teams })
  } catch (error) {
    return handleApiError(error, 'Unable to load teams')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { name, description, avatarUrl } = await request.json()

    const teamService = new TeamService(db)
    const team = await teamService.createTeam({ name, description, avatarUrl }, userId)

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create team')
  }
}
