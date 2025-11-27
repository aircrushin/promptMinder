import { TEAM_CONFIG } from '@/lib/constants'

export async function GET() {
  return new Response(JSON.stringify({
    maxTeamsPerUser: TEAM_CONFIG.MAX_TEAMS_PER_USER
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
