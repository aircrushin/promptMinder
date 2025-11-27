import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/getSupabaseClient';

export async function GET(request) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });

  try {
    // 获取各状态的统计
    const { data: statusStats, error: statusError } = await supabase
      .from('prompt_contributions')
      .select('status')
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const stats = {
          pending: 0,
          approved: 0,
          rejected: 0,
          total: data.length
        };
        
        data.forEach(item => {
          stats[item.status] = (stats[item.status] || 0) + 1;
        });
        
        return { data: stats, error: null };
      });

    if (statusError) {
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // 获取最近7天的贡献趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentContributions, error: recentError } = await supabase
      .from('prompt_contributions')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (recentError) {
      console.error('Recent contributions error:', recentError);
    }

    // 按天分组统计
    const dailyStats = {};
    if (recentContributions) {
      recentContributions.forEach(contribution => {
        const date = new Date(contribution.created_at).toISOString().split('T')[0];
        dailyStats[date] = (dailyStats[date] || 0) + 1;
      });
    }

    // 获取最近的几个待审核贡献
    const { data: pendingPreview, error: pendingError } = await supabase
      .from('prompt_contributions')
      .select('id, title, role_category, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (pendingError) {
      console.error('Pending preview error:', pendingError);
    }

    return NextResponse.json({
      statusStats,
      dailyStats,
      pendingPreview: pendingPreview || [],
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
