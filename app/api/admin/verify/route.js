import { NextResponse } from 'next/server';

// 管理员邮箱列表（从环境变量读取）
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

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
    
    // 检查邮箱是否在管理员列表中
    const isAdmin = ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase() === trimmedEmail
    );

    if (isAdmin) {
      // 生成简单的 session token（生产环境建议使用更安全的方案）
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

// 验证 token
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

    // 解析 token
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [email, timestamp] = decoded.split(':');

      // 检查 token 是否过期（24小时）
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (tokenAge > maxAge) {
        return NextResponse.json(
          { error: 'Token 已过期，请重新验证' },
          { status: 401 }
        );
      }

      // 验证邮箱是否仍在管理员列表中
      const isAdmin = ADMIN_EMAILS.some(
        adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
      );

      if (isAdmin) {
        return NextResponse.json({
          success: true,
          email
        });
      }

      return NextResponse.json(
        { error: '权限已失效' },
        { status: 403 }
      );
    } catch (e) {
      return NextResponse.json(
        { error: 'Token 无效' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verify error:', error);
    return NextResponse.json(
      { error: '验证失败' },
      { status: 500 }
    );
  }
}
