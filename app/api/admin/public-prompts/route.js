import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';

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

  try {
    const result = await queries.publicPrompts.getAll({ page, limit, search });

    return NextResponse.json({
      prompts: result.prompts,
      pagination: result.pagination
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

    const adminEmail = request.headers.get('x-admin-email');

    const newPrompt = await queries.publicPrompts.create({
      title: title.trim(),
      roleCategory: role_category?.trim() || title.trim(),
      content: content.trim(),
      category: category?.trim() || '通用',
      language: language || 'zh',
      createdBy: adminEmail,
    });

    return NextResponse.json(newPrompt, { status: 201 });
  } catch (error) {
    console.error('Error in create public prompt:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
