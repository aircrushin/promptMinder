import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { 
  hashPassword, 
  generateSessionToken, 
  SESSION_DURATION_MS, 
  AUTH_COOKIE_NAME 
} from '@/lib/local-auth/password.js'

export async function POST(request) {
  try {
    const { username, password, displayName } = await request.json()
    
    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      )
    }
    
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: '用户名长度应在 3-50 个字符之间' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少 6 个字符' },
        { status: 400 }
      )
    }
    
    // 验证用户名格式（只允许字母、数字、下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: '用户名只能包含字母、数字和下划线' },
        { status: 400 }
      )
    }
    
    const supabase = createSupabaseServerClient()
    
    // 检查用户名是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已被使用' },
        { status: 409 }
      )
    }
    
    // 创建用户
    const passwordHash = hashPassword(password)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: username.toLowerCase(),
        password_hash: passwordHash,
        display_name: displayName || username
      })
      .select('id, username, display_name, avatar_url, is_admin')
      .single()
    
    if (createError) {
      console.error('创建用户失败:', createError)
      return NextResponse.json(
        { error: '注册失败，请稍后重试' },
        { status: 500 }
      )
    }
    
    // 创建会话
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
    
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: newUser.id,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
    
    if (sessionError) {
      console.error('创建会话失败:', sessionError)
      return NextResponse.json(
        { error: '注册成功但登录失败，请手动登录' },
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
    
    return NextResponse.json({
      success: true,
      user: newUser
    })
    
  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
