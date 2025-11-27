import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { 
  verifyPassword, 
  generateSessionToken, 
  SESSION_DURATION_MS, 
  AUTH_COOKIE_NAME 
} from '@/lib/local-auth/password.js'

export async function POST(request) {
  try {
    const { username, password } = await request.json()
    
    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }
    
    const supabase = createSupabaseServerClient()
    
    // 查找用户
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, is_admin, password_hash')
      .eq('username', username.toLowerCase())
      .single()
    
    if (findError || !user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }
    
    // 验证密码
    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }
    
    // 创建会话
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
    
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
    
    if (sessionError) {
      console.error('创建会话失败:', sessionError)
      return NextResponse.json(
        { error: '登录失败，请稍后重试' },
        { status: 500 }
      )
    }
    
    // 设置 cookie
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt
    })
    
    // 返回用户信息（不包含密码哈希）
    const { password_hash, ...userWithoutPassword } = user
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
    
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
