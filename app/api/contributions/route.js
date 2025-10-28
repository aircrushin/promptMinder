import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

  try {
    const { title, role, content, contributorEmail, contributorName } = await request.json();

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

    // 准备插入数据
    const contributionData = {
      id: crypto.randomUUID(),
      title: title.trim(),
      role_category: role.trim(),
      content: content.trim(),
      contributor_email: contributorEmail?.trim() || null,
      contributor_name: contributorName?.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 插入到数据库
    const { data: newContribution, error } = await supabase
      .from('prompt_contributions')
      .insert([contributionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save contribution' }, { status: 500 });
    }

    // 返回成功响应（不包含敏感信息）
    return NextResponse.json({ 
      message: 'Contribution submitted successfully',
      id: newContribution.id,
      status: newContribution.status,
      created_at: newContribution.created_at
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
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 获取贡献列表
    let query = supabase
      .from('prompt_contributions')
      .select('*')
      .order('created_at', { ascending: false });

    // 按状态过滤
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: contributions, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
    }

    // 获取总数
    let countQuery = supabase
      .from('prompt_contributions')
      .select('*', { count: 'exact', head: true });
    
    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      contributions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 