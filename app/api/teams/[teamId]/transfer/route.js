import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { TeamService } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'

export async function POST(request, { params }) {
  try {
    const { teamId } = await params
    if (!teamId) {
      throw new Error('Team id missing in route params')
    }

    const { targetUserId } = await request.json()
    const actorUserId = await requireUserId()

    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    await teamService.transferOwnership(teamId, actorUserId, targetUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to transfer ownership')
  }
}
