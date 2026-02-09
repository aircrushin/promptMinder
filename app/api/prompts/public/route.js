import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { queries } from '@/lib/db/index.js';
import { eq, and, desc, asc, count, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/index.js';

const { publicPrompts, likes } = schema;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('lang') || 'zh';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const { userId } = await auth();
    const db = getDb();
    
    // 构建查询条件
    let conditions = [];
    
    if (category) {
      conditions.push(eq(publicPrompts.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取总数
    const totalResult = await db.select({ count: count() })
      .from(publicPrompts)
      .where(whereClause);
    
    const total = Number(totalResult[0]?.count || 0);
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (currentPage - 1) * pageSize;

    // 获取分页数据
    const validSortFields = ['created_at', 'likes'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = sortOrder === 'asc';

    const promptsList = await db.query.publicPrompts.findMany({
      where: whereClause,
      orderBy: isAscending 
        ? [asc(orderField === 'likes' ? publicPrompts.likes : publicPrompts.createdAt)]
        : [desc(orderField === 'likes' ? publicPrompts.likes : publicPrompts.createdAt)],
      limit: pageSize,
      offset,
    });

    // 获取用户的点赞状态（如果用户已登录）
    let userLikedPrompts = new Set();
    if (userId && promptsList && promptsList.length > 0) {
      const promptIds = promptsList.map(p => p.id);
      const userLikes = await db.query.likes.findMany({
        where: and(
          eq(likes.userId, userId),
          inArray(likes.promptId, promptIds)
        ),
      });
      userLikedPrompts = new Set(userLikes.map(l => l.promptId));
    }

    // 转换为前端期望的格式
    const prompts = (promptsList || []).map(p => ({
      id: p.id,
      category: p.category || (language === 'zh' ? '通用' : 'General'),
      role: p.roleCategory || p.title,
      prompt: p.content,
      title: p.title,
      created_at: p.createdAt,
      likes: p.likes || 0,
      userLiked: userLikedPrompts.has(p.id)
    }));

    // 获取所有分类（用于筛选器）
    const allPrompts = await db.select({ category: publicPrompts.category })
      .from(publicPrompts);
    
    const categories = [...new Set((allPrompts || [])
      .map(c => c.category)
      .filter(Boolean))];

    return NextResponse.json({
      prompts,
      categories,
      language,
      pagination: {
        total,
        totalPages,
        currentPage,
        pageSize,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    });
  } catch (error) {
    console.error('Error in public prompts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
