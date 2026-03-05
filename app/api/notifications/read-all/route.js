import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { markAllNotificationsRead } from '@/lib/prompt-workflow.js'

export async function POST() {
  try {
    const userId = await requireUserId()
    await markAllNotificationsRead(db, { userId })
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to mark notifications as read')
  }
}
