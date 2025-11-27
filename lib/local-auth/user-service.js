import { createSupabaseServerClient } from '@/lib/supabaseServer.js'

// 获取单个用户信息
export async function getUser(userId) {
  const supabase = createSupabaseServerClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, is_admin')
    .eq('id', userId)
    .single()
  
  if (error || !user) {
    return null
  }
  
  return {
    id: user.id,
    username: user.username,
    fullName: user.display_name,
    displayName: user.display_name || user.username,
    avatarUrl: user.avatar_url,
    isAdmin: user.is_admin
  }
}

// 批量获取用户信息
export async function getUserList(userIds) {
  if (!userIds || userIds.length === 0) {
    return []
  }
  
  const supabase = createSupabaseServerClient()
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url, is_admin')
    .in('id', userIds)
  
  if (error) {
    console.error('获取用户列表失败:', error)
    return []
  }
  
  return (users || []).map(user => ({
    id: user.id,
    username: user.username,
    fullName: user.display_name,
    displayName: user.display_name || user.username,
    avatarUrl: user.avatar_url,
    isAdmin: user.is_admin
  }))
}

// 模拟 Clerk 的用户客户端接口
export const userClient = {
  users: {
    getUser: async (userId) => getUser(userId),
    getUserList: async ({ userId, limit }) => {
      const users = await getUserList(userId)
      return { data: users }
    }
  }
}
