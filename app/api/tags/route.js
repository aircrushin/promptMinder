import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    // 获取公共标签和用户私有标签
    const tags = await queries.tags.getAll({ userId });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, isPublic } = await request.json();

    const newTag = await queries.tags.create({
      name,
      userId: isPublic ? null : userId,
    });

    return NextResponse.json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: error.message || 'Failed to create tag' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // 首先检查标签是否存在
    const tag = await queries.tags.getById(tagId);

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    // 检查是否是公共标签
    if (!tag.userId) {
      return NextResponse.json({ error: '不能删除公共标签' }, { status: 403 });
    }

    // 检查是否是用户自己的标签
    if (tag.userId !== userId) {
      return NextResponse.json({ error: '无权删除此标签' }, { status: 403 });
    }

    // 执行删除操作
    await queries.tags.delete(tagId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete tag' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');
    const { name } = await request.json();

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // 首先检查标签是否存在
    const tag = await queries.tags.getById(tagId);

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    // 检查是否是公共标签
    if (!tag.userId) {
      return NextResponse.json({ error: '不能修改公共标签' }, { status: 403 });
    }

    // 检查是否是用户自己的标签
    if (tag.userId !== userId) {
      return NextResponse.json({ error: '无权修改此标签' }, { status: 403 });
    }

    // 执行更新操作
    const updatedTag = await queries.tags.update(tagId, { name });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: error.message || 'Failed to update tag' }, { status: 500 });
  }
}
