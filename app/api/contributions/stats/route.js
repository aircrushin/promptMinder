import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';
import { gte, desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/index.js';

const { contributions } = schema;

export async function GET(request) {
  try {
    const db = getDb();

    // 获取所有贡献
    const allContributions = await db.query.contributions.findMany({
      orderBy: [desc(contributions.createdAt)],
    });

    // 计算各状态的统计
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: allContributions.length
    };
    
    allContributions.forEach(item => {
      stats[item.status] = (stats[item.status] || 0) + 1;
    });

    // 获取最近7天的贡献趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentContributions = await db.query.contributions.findMany({
      where: gte(contributions.createdAt, sevenDaysAgo),
      orderBy: [desc(contributions.createdAt)],
    });

    // 按天分组统计
    const dailyStats = {};
    if (recentContributions) {
      recentContributions.forEach(contribution => {
        const date = new Date(contribution.createdAt).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });
    }

    // 获取最近的几个待审核贡献
    const pendingPreview = await db.query.contributions.findMany({
      where: gte(contributions.status, 'pending'),
      orderBy: [desc(contributions.createdAt)],
      limit: 5,
    });

    // 转换为前端期望的格式
    const formattedPendingPreview = pendingPreview.map(p => ({
      id: p.id,
      title: p.title,
      role_category: p.roleCategory,
      created_at: p.createdAt,
    }));

    return NextResponse.json({
      statusStats: stats,
      dailyStats,
      pendingPreview: formattedPendingPreview || [],
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
