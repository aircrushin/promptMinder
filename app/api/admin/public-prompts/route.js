import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 验证管理员权限
async function verifyAdmin(request) {
  const adminEmail = request.headers.get('x-admin-email');
  const adminToken = request.headers.get('x-admin-token');
  
  if (!adminEmail || !adminToken) {
    return { success: false, error: '未授权访问' };
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  
  if (!adminEmails.includes(adminEmail.toLowerCase())) {
    return { success: false, error: '无管理员权限' };
  }

  return { success: true };
}

// GET - 获取公开提示词列表
export async function GET(request) {
  const authResult = await verifyAdmin(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // 构建查询 - 获取公开提示词
    let query = supabase
      .from('public_prompts')
      .select('*', { count: 'exact' });

    // 搜索过滤
    if (search) {
      query = query.or(`title.ilike.%${search}%,role_category.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // 分页和排序
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: prompts, error, count } = await query;

    if (error) {
      console.error('Error fetching public prompts:', error);
      return NextResponse.json({ error: '获取提示词失败' }, { status: 500 });
    }

    return NextResponse.json({
      prompts: prompts || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in public prompts API:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// POST - 创建新的公开提示词
export async function POST(request) {
  const authResult = await verifyAdmin(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, role_category, content, category, language } = body;

    // 验证必填字段
    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const adminEmail = request.headers.get('x-admin-email');
    const timestamp = new Date().toISOString();

    const { data: newPrompt, error } = await supabase
      .from('public_prompts')
      .insert([{
        title: title.trim(),
        role_category: role_category?.trim() || title.trim(),
        content: content.trim(),
        category: category?.trim() || '通用',
        language: language || 'zh',
        created_by: adminEmail,
        created_at: timestamp,
        updated_at: timestamp
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating public prompt:', error);
      return NextResponse.json({ error: '创建提示词失败' }, { status: 500 });
    }

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error('Error in create public prompt:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
