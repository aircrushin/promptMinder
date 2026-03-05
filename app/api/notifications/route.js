import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { listNotifications } from '@/lib/prompt-workflow.js'

export async function GET(request) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await listNotifications(db, {
      userId,
      unreadOnly,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error, 'Unable to load notifications')
  }
}
