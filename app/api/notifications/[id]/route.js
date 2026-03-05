import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { markNotificationRead } from '@/lib/prompt-workflow.js'

async function getNotificationId(paramsPromise) {
  const { id } = await paramsPromise
  if (!id) {
    throw new Error('Notification id missing in route params')
  }
  return id
}

export async function PATCH(request, { params }) {
  try {
    const notificationId = await getNotificationId(params)
    const userId = await requireUserId()
    const body = await request.json().catch(() => ({}))

    if (body?.is_read !== true) {
      return NextResponse.json({ error: 'Only is_read=true is supported' }, { status: 400 })
    }

    const notification = await markNotificationRead(db, {
      notificationId,
      userId,
    })

    return NextResponse.json({ notification })
  } catch (error) {
    return handleApiError(error, 'Unable to update notification')
  }
}
