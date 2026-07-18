/** @jest-environment node */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/notifications/route'
import { PATCH } from '@/app/api/notifications/[id]/route'
import { POST as READ_ALL } from '@/app/api/notifications/read-all/route'
import { requireUserId } from '@/lib/auth.js'
import { db } from '@/lib/db.js'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/prompt-workflow.js'

jest.mock('@/lib/auth.js', () => ({
  requireUserId: jest.fn(),
}))

jest.mock('@/lib/db.js', () => ({
  db: { tag: 'mock-db' },
}))

jest.mock('@/lib/prompt-workflow.js', () => ({
  listNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}))

describe('/api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    requireUserId.mockResolvedValue('user-1')
  })

  it('应该返回通知列表与未读数', async () => {
    listNotifications.mockResolvedValue({
      notifications: [{ id: 'n1', title: '审批已通过', is_read: false }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      unread_count: 1,
    })

    const response = await GET(
      new NextRequest('http://localhost/api/notifications?unread_only=true&page=1&limit=20')
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(listNotifications).toHaveBeenCalledWith(db, {
      userId: 'user-1',
      unreadOnly: true,
      page: 1,
      limit: 20,
    })
    expect(data.unread_count).toBe(1)
    expect(data.notifications).toHaveLength(1)
  })

  it('应该标记单条通知已读', async () => {
    markNotificationRead.mockResolvedValue({ id: 'n1', is_read: true })

    const response = await PATCH(
      new NextRequest('http://localhost/api/notifications/n1', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }),
      { params: Promise.resolve({ id: 'n1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(markNotificationRead).toHaveBeenCalledWith(db, {
      notificationId: 'n1',
      userId: 'user-1',
    })
    expect(data.notification.is_read).toBe(true)
  })

  it('不支持 is_read=false', async () => {
    const response = await PATCH(
      new NextRequest('http://localhost/api/notifications/n1', {
        method: 'PATCH',
        body: JSON.stringify({ is_read: false }),
      }),
      { params: Promise.resolve({ id: 'n1' }) }
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Only is_read=true is supported')
  })

  it('应该全部标记已读', async () => {
    markAllNotificationsRead.mockResolvedValue(undefined)

    const response = await READ_ALL(new NextRequest('http://localhost/api/notifications/read-all', {
      method: 'POST',
    }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(markAllNotificationsRead).toHaveBeenCalledWith(db, { userId: 'user-1' })
    expect(data).toEqual({ success: true })
  })
})
