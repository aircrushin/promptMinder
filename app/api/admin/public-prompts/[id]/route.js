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

// GET - 获取单个公开提示词
export async function GET(request, { params }) {
  const authResult = await verifyAdmin(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const prompt = await queries.publicPrompts.getById(id);

    if (!prompt) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error in get public prompt:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// PATCH - 更新公开提示词
export async function PATCH(request, { params }) {
  const authResult = await verifyAdmin(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, role_category, content, category, language } = body;

    // 验证必填字段
    if (title !== undefined && !title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }
    if (content !== undefined && !content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (role_category !== undefined) updateData.roleCategory = role_category.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (language !== undefined) updateData.language = language;

    const updatedPrompt = await queries.publicPrompts.update(id, updateData);

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error in update public prompt:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// DELETE - 删除公开提示词
export async function DELETE(request, { params }) {
  const authResult = await verifyAdmin(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    await queries.publicPrompts.delete(id);

    return NextResponse.json({ success: true, message: '提示词已删除' });
  } catch (error) {
    console.error('Error in delete public prompt:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
