import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { AUTH_COOKIE_NAME } from './constants'

// 从 cookie 获取当前会话
export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value
  
  if (!sessionToken) {
    return null
  }
  
  const supabase = createSupabaseServerClient()
  
  // 查询会话和用户信息
  const { data: session, error } = await supabase
    .from('user_sessions')
    .select(`
      id,
      user_id,
      expires_at,
      users (
        id,
        username,
        display_name,
        avatar_url,
        is_admin
      )
    `)
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()
  
  if (error || !session) {
    return null
  }
  
  return {
    sessionId: session.id,
    userId: session.user_id,
    user: session.users
  }
}

// 获取当前用户 ID（替代 Clerk 的 auth()）
export async function getCurrentUserId() {
  const session = await getSession()
  return session?.userId || null
}

// 获取当前用户信息
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user || null
}

// 检查是否是管理员
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.is_admin || false
}
