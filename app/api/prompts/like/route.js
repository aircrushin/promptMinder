import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';

// POST - 点赞提示词
export async function POST(request) {
  try {
    const { promptId } = await request.json();

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 检查是否已经点赞
    const alreadyLiked = await queries.likes.isLiked(userId, promptId);

    if (alreadyLiked) {
      return NextResponse.json({
        success: true,
        message: 'Already liked',
        liked: true
      });
    }

    // 添加点赞
    await queries.likes.create(userId, promptId);

    // 获取更新后的点赞数
    const prompt = await queries.prompts.getById(promptId);

    return NextResponse.json({
      success: true,
      liked: true,
      likes: prompt?.likes || 0
    });
  } catch (error) {
    console.error('Error liking prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - 取消点赞
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('promptId');

    if (!promptId) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 删除点赞
    await queries.likes.delete(userId, promptId);

    // 获取更新后的点赞数
    const prompt = await queries.prompts.getById(promptId);

    return NextResponse.json({
      success: true,
      liked: false,
      likes: prompt?.likes || 0
    });
  } catch (error) {
    console.error('Error unliking prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
