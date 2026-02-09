import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { resolveTeamContext } from '@/lib/team-request.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { clerkClient } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';

function applyPromptFilters({ teamId, userId, tag, search }) {
  return { teamId, userId, tag, search };
}

export async function GET(request) {
  try {
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    });

    if (teamId) {
      await teamService.requireMembership(teamId, userId);
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await queries.prompts.getAll({
      teamId,
      userId,
      tag,
      search,
      page,
      limit,
    });

    let prompts = result.prompts;

    // Enrich prompts with creator info if possible
    if (prompts.length > 0) {
      const userIds = [...new Set(prompts.map((p) => p.createdBy).filter(Boolean))];

      if (userIds.length > 0) {
        try {
          let clerk;
          if (typeof clerkClient === 'function') {
            clerk = await clerkClient();
          } else {
            clerk = clerkClient;
          }

          if (clerk?.users) {
            const users = await clerk.users.getUserList({
              userId: userIds,
              limit: userIds.length,
            });

            const userMap = new Map();
            const userList = Array.isArray(users?.data) ? users.data : (Array.isArray(users) ? users : []);

            userList.forEach((user) => {
              const email = user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
                || user.emailAddresses?.[0]?.emailAddress;

              userMap.set(user.id, {
                id: user.id,
                fullName: user.fullName,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                imageUrl: user.imageUrl,
                email: email
              });
            });

            prompts = prompts.map((prompt) => ({
              ...prompt,
              creator: userMap.get(prompt.createdBy) || null
            }));
          }
        } catch (error) {
          console.warn('Failed to fetch creator details:', error);
          // Continue without creator details rather than failing
        }
      }
    }

    return NextResponse.json({
      prompts: prompts,
      pagination: result.pagination
    });
  } catch (error) {
    return handleApiError(error, 'Unable to load prompts');
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    });

    let targetTeamId = null;
    if (teamId) {
      await teamService.requireMembership(teamId, userId);
      targetTeamId = teamId;
    }

    const data = await request.json();

    const newPrompt = await queries.prompts.create({
      teamId: targetTeamId,
      projectId: targetTeamId ? data.projectId || null : null,
      title: data.title,
      content: data.content,
      description: data.description || null,
      createdBy: userId,
      userId: userId,
      version: data.version || null,
      tags: data.tags || null,
      isPublic: data.is_public ?? false,
      coverImg: data.cover_img || data.image_url || null,
    });

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Unable to create prompt');
  }
}
