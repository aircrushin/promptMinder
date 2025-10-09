import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireUserId } from '@/lib/auth.js'
import { TEAM_STATUSES } from '@/lib/team-service.js'

export async function GET() {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        role,
        email,
        status,
        invited_at,
        team:teams (
          id,
          name,
          description,
          avatar_url,
          is_personal,
          owner_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', TEAM_STATUSES.PENDING)
      .order('invited_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ invites: data || [] })
  } catch (error) {
    return handleApiError(error, 'Unable to load team invites')
  }
}
