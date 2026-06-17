import { NextResponse } from 'next/server';
import { getAdminEmails, parseAdminToken } from '@/lib/admin-auth.js';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: '请输入邮箱地址' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const adminEmails = getAdminEmails();

    if (adminEmails.includes(trimmedEmail)) {
      const token = Buffer.from(`${trimmedEmail}:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        email: trimmedEmail,
        token
      });
    }

    return NextResponse.json(
      { error: '您没有访问管理后台的权限' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: '验证失败，请重试' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token 缺失' },
        { status: 401 }
      );
    }

    const parsed = parseAdminToken(token);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Token 无效或已过期' },
        { status: 401 }
      );
    }

    const adminEmails = getAdminEmails();
    if (adminEmails.includes(parsed.email)) {
      return NextResponse.json({
        success: true,
        email: parsed.email
      });
    }

    return NextResponse.json(
      { error: '权限已失效' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Token verify error:', error);
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}
