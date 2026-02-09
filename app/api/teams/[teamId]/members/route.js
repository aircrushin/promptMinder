import { NextResponse } from 'next/server';
import { TeamService, TEAM_STATUSES } from '@/lib/team-service.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { requireUserId } from '@/lib/auth.js';
import { clerkClient } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';
import { and, inArray, eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/index.js';

const { teamMembers } = schema;

async function getTeamId(paramsPromise) {
  const { teamId } = await paramsPromise;
  if (!teamId) {
    throw new Error('Team id missing in route params');
  }
  return teamId;
}

export async function GET(_request, { params }) {
  try {
    const teamId = await getTeamId(params);
    const userId = await requireUserId();

    const teamService = new TeamService();
    await teamService.requireMembership(teamId, userId);

    const db = getDb();
    const members = await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.teamId, teamId),
        inArray(teamMembers.status, [TEAM_STATUSES.ACTIVE, TEAM_STATUSES.PENDING])
      ),
      orderBy: [teamMembers.createdAt],
    });

    // 转换为前端期望的格式
    const formattedMembers = members.map(member => ({
      user_id: member.userId,
      email: member.email,
      role: member.role,
      status: member.status,
      invited_by: member.invitedBy,
      invited_at: member.invitedAt,
      joined_at: member.joinedAt,
      left_at: member.leftAt,
      created_at: member.createdAt,
      updated_at: member.updatedAt,
    }));

    return NextResponse.json({ members: formattedMembers || [] });
  } catch (error) {
    return handleApiError(error, 'Unable to list team members');
  }
}

export async function POST(request, { params }) {
  try {
    const teamId = await getTeamId(params);
    const userId = await requireUserId();
    const { email: targetEmail, role } = await request.json();

    if (!targetEmail || !targetEmail.trim()) {
      return NextResponse.json({ error: '有效的邮箱地址是必填项' }, { status: 400 });
    }

    const normalizedEmail = targetEmail.trim().toLowerCase();
    let clerk;

    try {
      // Handle both function (v5+) and object (older) forms of clerkClient
      if (typeof clerkClient === 'function') {
        clerk = await clerkClient();
      } else {
        clerk = clerkClient;
      }
    } catch (clerkError) {
      console.error('[team-members] Failed to initialize Clerk client', clerkError);
      return NextResponse.json(
        { error: '用户服务暂时不可用', details: clerkError.message }, 
        { status: 503 }
      );
    }

    if (!clerk?.users) {
      console.error('[team-members] Clerk client invalid:', { 
        type: typeof clerk, 
        hasUsers: !!clerk?.users,
        isFunction: typeof clerkClient === 'function'
      });
      return NextResponse.json({ error: '用户服务暂时不可用' }, { status: 503 });
    }

    const result = await clerk.users.getUserList({ emailAddress: [normalizedEmail], limit: 1 });
    
    // Handle both Array and PaginatedResponse formats
    const users = Array.isArray(result?.data) 
      ? result.data 
      : Array.isArray(result) 
        ? result 
        : [];
        
    if (!users.length) {
      console.warn(`[team-members] User not found for email: ${normalizedEmail}`, {
        resultType: typeof result,
        hasData: !!result?.data,
        isArray: Array.isArray(result)
      });
      return NextResponse.json({ error: '未找到该邮箱对应的用户' }, { status: 404 });
    }

    const targetUser = users[0];

    const teamService = new TeamService();
    const membership = await teamService.inviteMember(teamId, userId, {
      userId: targetUser.id,
      email: normalizedEmail,
      role
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Unable to invite member');
  }
}
