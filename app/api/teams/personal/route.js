import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { TeamService } from '@/lib/team-service.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function POST() {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()
    const teamService = new TeamService(supabase)
    const team = await teamService.ensurePersonalTeam(userId)
    return NextResponse.json({ team })
  } catch (error) {
    return handleApiError(error, 'Unable to ensure personal team')
  }
}
