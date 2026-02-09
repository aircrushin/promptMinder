import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/handle-api-error.js';
import { requireUserId } from '@/lib/auth.js';
import { TEAM_STATUSES } from '@/lib/team-service.js';
import { queries } from '@/lib/db/index.js';
import { eq, and, desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/index.js';

const { teamMembers } = schema;

export async function GET() {
  try {
    const userId = await requireUserId();
    const db = getDb();

    const invites = await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.userId, userId),
        eq(teamMembers.status, TEAM_STATUSES.PENDING)
      ),
      with: {
        team: true,
      },
      orderBy: [desc(teamMembers.invitedAt)],
    });

    // 转换为前端期望的格式
    const formattedInvites = invites.map(invite => ({
      id: invite.id,
      team_id: invite.teamId,
      role: invite.role,
      email: invite.email,
      status: invite.status,
      invited_at: invite.invitedAt,
      team: invite.team ? {
        id: invite.team.id,
        name: invite.team.name,
        description: invite.team.description,
        avatar_url: invite.team.avatarUrl,
        is_personal: invite.team.isPersonal,
        owner_id: invite.team.ownerId,
      } : null
    }));

    return NextResponse.json({ invites: formattedInvites || [] });
  } catch (error) {
    return handleApiError(error, 'Unable to load team invites');
  }
}
