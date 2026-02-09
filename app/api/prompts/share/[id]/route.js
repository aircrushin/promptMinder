import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { resolveTeamContext } from '@/lib/team-request.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { TEAM_ROLES } from '@/lib/team-service.js';
import { queries } from '@/lib/db/index.js';

export async function POST(request, { params }) {
  try {
    const { id: promptId } = await params;
    if (!promptId) {
      return NextResponse.json({ error: 'Prompt id is required' }, { status: 400 });
    }

    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    });

    let membership = null;
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId);
    }

    const prompt = await queries.prompts.getById(promptId, { teamId, userId });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const isOwner = prompt.createdBy === userId || prompt.userId === userId;
    const canShare = isOwner || [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership?.role);

    if (!canShare) {
      return NextResponse.json({ error: '只有创建者或团队管理员可以分享提示词' }, { status: 403 });
    }

    if (prompt.isPublic) {
      return NextResponse.json({ message: 'Prompt already shared' });
    }

    await queries.prompts.update(promptId, { isPublic: true }, { teamId: prompt.teamId });

    return NextResponse.json({ message: 'Prompt shared successfully' });
  } catch (error) {
    return handleApiError(error, 'Unable to share prompt');
  }
}
