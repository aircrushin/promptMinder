'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTeam } from '@/contexts/team-context'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function statusVariant(status) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  if (status === 'pending') return 'secondary'
  return 'outline'
}

export default function PromptWorkflowPanel({ promptId }) {
  const { activeTeamId } = useTeam()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])

  const loadData = useCallback(async () => {
    if (!activeTeamId || !promptId) {
      setRequests([])
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.getPromptChangeRequests(
        promptId,
        { status: 'all' },
        { teamId: activeTeamId }
      )
      const list = Array.isArray(result?.change_requests) ? result.change_requests : []
      setRequests(list)
    } catch (error) {
      console.error('Failed to load prompt change requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [activeTeamId, promptId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!activeTeamId) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">审批与讨论</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href="/prompts/reviews">审批工作台</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无审批记录</p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 5).map((request) => (
              <Link
                key={request.id}
                href={`/prompts/reviews/${request.id}`}
                className="block rounded border p-2 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{request.proposed_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.submitter_user_id} · {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
