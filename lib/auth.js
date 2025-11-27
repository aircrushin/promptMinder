import { getCurrentUserId } from '@/lib/local-auth/session.js'
import { ApiError } from './api-error.js'

export async function requireUserId() {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new ApiError(401, 'Authentication required')
  }
  return userId
}

// 兼容旧代码的 auth 函数
export async function auth() {
  const userId = await getCurrentUserId()
  return { userId }
}
