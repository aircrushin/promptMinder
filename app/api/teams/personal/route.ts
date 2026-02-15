import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { TeamService } from '@/lib/team-service'
import { handleApiError } from '@/lib/handle-api-error'

export async function POST() {
  try {
    const userId = await requireUserId()
    const teamService = new TeamService(db)
    const team = await teamService.ensurePersonalTeam(userId)
    return NextResponse.json({ team })
  } catch (error) {
    return handleApiError(error, 'Unable to ensure personal team')
  }
}
