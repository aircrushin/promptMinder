import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { AUTH_COOKIE_NAME } from '@/lib/local-auth/password.js'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
    
    if (sessionToken) {
      const supabase = createSupabaseServerClient()
      
      // 删除会话
      await supabase
        .from('user_sessions')
        .delete()
        .eq('token', sessionToken)
      
      // 删除 cookie
      cookieStore.delete(AUTH_COOKIE_NAME)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
