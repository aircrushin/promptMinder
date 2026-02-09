import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { queries } from '@/lib/db/index.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await queries.favorites.getByUser(userId, { page, limit });

    let orderedPrompts = result.favorites;

    // 添加创建者信息
    if (orderedPrompts.length > 0) {
      const userIds = [...new Set(orderedPrompts.map((p) => p.createdBy).filter(Boolean))];

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

            orderedPrompts = orderedPrompts.map((prompt) => ({
              ...prompt,
              creator: userMap.get(prompt.createdBy) || null
            }));
          }
        } catch (error) {
          console.warn('Failed to fetch creator details:', error);
        }
      }
    }

    return NextResponse.json({
      prompts: orderedPrompts,
      pagination: result.pagination
    });
  } catch (error) {
    return handleApiError(error, 'Unable to load favorites');
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId();

    const { promptId } = await request.json();

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId is required' },
        { status: 400 }
      );
    }

    // 检查提示词是否存在
    const prompt = await queries.prompts.getById(promptId);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // 检查是否已收藏
    const alreadyFavorited = await queries.favorites.isFavorited(userId, promptId);

    if (alreadyFavorited) {
      return NextResponse.json({ favorited: true, message: 'Already favorited' });
    }

    // 添加收藏
    await queries.favorites.create(userId, promptId);

    return NextResponse.json({ favorited: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Unable to add favorite');
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId();

    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId is required' },
        { status: 400 }
      );
    }

    await queries.favorites.delete(userId, promptId);

    return NextResponse.json({ favorited: false });
  } catch (error) {
    return handleApiError(error, 'Unable to remove favorite');
  }
}
