import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';

export async function POST(request) {
  try {
    const { title, role, content, language, contributorEmail, contributorName } = await request.json();

    // 验证必填字段
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!role || !role.trim()) {
      return NextResponse.json({ error: 'Role/Category is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 创建贡献
    const newContribution = await queries.contributions.create({
      title: title.trim(),
      roleCategory: role.trim(),
      content: content.trim(),
      language: language || 'zh',
      contributorEmail: contributorEmail?.trim() || null,
      contributorName: contributorName?.trim() || null,
      status: 'pending',
      userId: 'anonymous', // 匿名贡献
    });

    // 返回成功响应（不包含敏感信息）
    return NextResponse.json({ 
      message: 'Contribution submitted successfully',
      id: newContribution.id,
      status: newContribution.status,
      createdAt: newContribution.createdAt
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// 获取贡献列表 - 仅供管理员使用
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await queries.contributions.getAll({ 
      page, 
      limit, 
      status: status === 'all' ? undefined : status 
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
