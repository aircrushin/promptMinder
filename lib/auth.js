import { auth } from '@clerk/nextjs/server'
import { ApiError } from './api-error.js'

export async function requireUserId() {
  const { userId } = await auth()
  if (!userId) {
    throw new ApiError(401, 'Authentication required')
  }
  return userId
}
