'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function NotificationsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 })
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const copy = useMemo(
    () => ({
      title: t?.notificationsPage?.title || '通知中心',
      unreadOnly: t?.notificationsPage?.unreadOnly || '仅看未读',
      readAll: t?.notificationsPage?.readAll || '全部标为已读',
      empty: t?.notificationsPage?.empty || '暂无通知',
      loadMore: t?.notificationsPage?.loadMore || '加载更多',
      read: t?.notificationsPage?.read || '已读',
      unread: t?.notificationsPage?.unread || '未读',
    }),
    [t]
  )

  const loadNotifications = useCallback(async (nextPage = 1, replace = true) => {
    setLoading(true)
    try {
      const result = await apiClient.getNotifications({
        page: nextPage,
        limit: pagination.limit,
        unread_only: unreadOnly ? 'true' : 'false',
      })

      const list = Array.isArray(result?.notifications) ? result.notifications : []
      setNotifications((prev) => (replace ? list : [...prev, ...list]))
      setPagination(result?.pagination || { page: nextPage, limit: pagination.limit, totalPages: 1 })
      setUnreadCount(result?.unread_count || 0)
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, unreadOnly])

  useEffect(() => {
    loadNotifications(1, true)
  }, [loadNotifications])

  const markRead = async (id) => {
    await apiClient.markNotificationRead(id)
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await apiClient.markAllNotificationsRead()
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} 未读</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={unreadOnly ? 'default' : 'outline'} onClick={() => setUnreadOnly((prev) => !prev)}>
            {copy.unreadOnly}
          </Button>
          <Button variant="outline" onClick={markAllRead}>
            {copy.readAll}
          </Button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{copy.empty}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <Badge variant={item.is_read ? 'outline' : 'default'}>
                    {item.is_read ? copy.read : copy.unread}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{item.body}</p>
                <div className="flex items-center justify-between">
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                  {!item.is_read && (
                    <Button size="sm" variant="outline" onClick={() => markRead(item.id)}>
                      标记已读
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {pagination.page < pagination.totalPages && (
            <Button
              className="w-full"
              variant="outline"
              disabled={loading}
              onClick={() => loadNotifications(pagination.page + 1, false)}
            >
              {copy.loadMore}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
