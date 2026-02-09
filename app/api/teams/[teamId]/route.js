import { NextResponse } from 'next/server';
import { TeamService } from '@/lib/team-service.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { requireUserId } from '@/lib/auth.js';
import { clerkClient } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';

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

    const team = await teamService.getTeam(teamId);

    const members = await queries.teamMembers.getByTeamId(teamId);

    const memberList = members || [];
    const uniqueUserIds = [...new Set([
      ...memberList.map((member) => member.userId).filter(Boolean),
      team.ownerId,
    ].filter(Boolean))];

    const profileMap = new Map();

    if (uniqueUserIds.length > 0) {
      let clerk;
      try {
        if (typeof clerkClient === 'function') {
          clerk = await clerkClient();
        } else {
          clerk = clerkClient;
        }
      } catch (clerkError) {
        console.warn(`[teams/${teamId}] Failed to initialize Clerk client, falling back to basic info`, clerkError);
      }

      if (!clerk?.users) {
        // Fallback: use user IDs as display names
        uniqueUserIds.forEach((id) => {
          profileMap.set(id, {
            displayName: id,
            email: null,
          });
        });
      } else {
        try {
          // 批量获取用户信息
          const result = await clerk.users.getUserList({
            userId: uniqueUserIds,
            limit: uniqueUserIds.length,
          });

          // 确保返回的数据是数组
          const users = Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : [];

          // 处理批量获取的用户信息
          users.forEach((user) => {
            if (!user) return;
            const primaryEmail = user.primaryEmailAddress?.emailAddress
              || user.emailAddresses?.[0]?.emailAddress
              || null;
            profileMap.set(user.id, {
              displayName: user.fullName || user.username || primaryEmail || user.id,
              email: primaryEmail,
            });
          });

          // 检查是否有未获取到的用户
          const missingUserIds = uniqueUserIds.filter((id) => !profileMap.has(id));
          if (missingUserIds.length > 0) {
            console.warn(`[teams/${teamId}] Some users not found in batch fetch, falling back to individual fetch for ${missingUserIds.length} users`);
            throw new Error('Incomplete batch fetch');
          }
        } catch (fetchError) {
          console.error(`[teams/${teamId}] failed to load batch users`, fetchError);
          // 单个获取用户信息作为后备方案
          await Promise.all(
            uniqueUserIds.map(async (id) => {
              if (profileMap.has(id)) return;
              try {
                const user = await clerk.users.getUser(id);
                if (!user) {
                  console.warn(`[teams/${teamId}] User not found: ${id}`);
                  profileMap.set(id, {
                    displayName: id,
                    email: null,
                  });
                  return;
                }
                const primaryEmail = user.primaryEmailAddress?.emailAddress
                  || user.emailAddresses?.[0]?.emailAddress
                  || null;
                profileMap.set(id, {
                  displayName: user.fullName || user.username || primaryEmail || id,
                  email: primaryEmail,
                });
              } catch (singleError) {
                console.error(`[teams/${teamId}] failed to load user ${id}`, singleError);
                // 设置默认值，避免undefined
                profileMap.set(id, {
                  displayName: id,
                  email: null,
                });
              }
            })
          );
        }
      }
    }

    const enrichedMembers = memberList.map((member) => {
      const profile = member.userId ? profileMap.get(member.userId) : null;
      return {
        ...member,
        user_id: member.userId,
        email: member.email,
        role: member.role,
        status: member.status,
        invited_at: member.invitedAt,
        joined_at: member.joinedAt,
        left_at: member.leftAt,
        created_at: member.createdAt,
        updated_at: member.updatedAt,
        display_name: profile?.displayName || member.email || member.userId || '未知成员',
        primary_email: profile?.email || member.email || null,
      };
    });

    const ownerProfile = team.ownerId ? profileMap.get(team.ownerId) : null;
    const ownerDisplayName = ownerProfile?.displayName
      || enrichedMembers.find((member) => member.role === 'owner')?.display_name
      || team.ownerId;

    return NextResponse.json({
      team: {
        ...team,
        owner_id: team.ownerId,
        owner_display_name: ownerDisplayName,
      },
      members: enrichedMembers,
    });
  } catch (error) {
    return handleApiError(error, 'Unable to load team details');
  }
}

export async function PATCH(request, { params }) {
  try {
    const teamId = await getTeamId(params);
    const userId = await requireUserId();
    const payload = await request.json();

    const teamService = new TeamService();
    const team = await teamService.updateTeam(teamId, {
      name: payload.name,
      description: payload.description,
      avatar_url: payload.avatarUrl
    }, userId);

    return NextResponse.json({ team });
  } catch (error) {
    return handleApiError(error, 'Unable to update team');
  }
}

export async function DELETE(_request, { params }) {
  try {
    const teamId = await getTeamId(params);
    const userId = await requireUserId();

    const teamService = new TeamService();
    await teamService.deleteTeam(teamId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Unable to delete team');
  }
}
