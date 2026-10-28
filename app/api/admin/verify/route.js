import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createAdminToken, getAdminEmails, parseAdminToken } from '@/lib/admin-auth.js';

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });
    const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
    const user = await client.users.getUser(userId);
    const trimmedEmail = (user.emailAddresses?.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress
      || user.emailAddresses?.[0]?.emailAddress || '').trim().toLowerCase();
    const adminEmails = getAdminEmails();

    if (adminEmails.includes(trimmedEmail)) {
      const token = createAdminToken(trimmedEmail);

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
