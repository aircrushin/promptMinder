import { NextResponse } from 'next/server';
import { TeamService, TEAM_STATUSES } from '@/lib/team-service.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { requireUserId } from '@/lib/auth.js';
import { clerkClient } from '@clerk/nextjs/server';

async function resolveParams(paramsPromise, actorUserId = null) {
  const { teamId, userId: rawUserId } = await paramsPromise;
  let memberUserId = rawUserId;
  if (!teamId || !memberUserId) {
    throw new Error('Missing team or user identifier in route params');
  }

  if (memberUserId === 'me' && actorUserId) {
    memberUserId = actorUserId;
  }

  return { teamId, memberUserId };
}

export async function PATCH(request, { params }) {
  try {
    const actorUserId = await requireUserId();
    const { teamId, memberUserId } = await resolveParams(params, actorUserId);
    const body = await request.json();

    const teamService = new TeamService();

    let membership;
    if (memberUserId === actorUserId && body?.status === TEAM_STATUSES.ACTIVE) {
      let clerk;
      try {
        if (typeof clerkClient === 'function') {
          clerk = await clerkClient();
        } else {
          clerk = clerkClient;
        }
      } catch (clerkError) {
        console.error('[team-members/update] Failed to initialize Clerk client', clerkError);
      }

      if (!clerk?.users) {
        return NextResponse.json({ error: '用户服务暂时不可用' }, { status: 503 });
      }

      const actorUser = await clerk.users.getUser(actorUserId);
      const primaryEmail = actorUser?.primaryEmailAddress?.emailAddress;
      membership = await teamService.acceptInvite(teamId, actorUserId, primaryEmail || null);
    } else {
      membership = await teamService.updateMember(teamId, memberUserId, actorUserId, {
        role: body?.role,
        status: body?.status
      });
    }

    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error, 'Unable to update team member');
  }
}

export async function DELETE(_request, { params }) {
  try {
    const actorUserId = await requireUserId();
    const { teamId, memberUserId } = await resolveParams(params, actorUserId);

    const teamService = new TeamService();
    const membership = await teamService.removeMember(teamId, memberUserId, actorUserId);

    return NextResponse.json({ membership });
  } catch (error) {
    return handleApiError(error, 'Unable to remove team member');
  }
}
