'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTeam } from '@/contexts/team-context'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'withdrawn', 'all']

function statusVariant(status) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  if (status === 'pending') return 'secondary'
  return 'outline'
}

export default function PromptReviewsPage() {
  const { t } = useLanguage()
  const { activeTeamId } = useTeam()
  const { toast } = useToast()
  const [status, setStatus] = useState('pending')
  const [mine, setMine] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])

  const copy = useMemo(
    () => ({
      title: t?.promptReviewsPage?.title || '审批工作台',
      subtitle: t?.promptReviewsPage?.subtitle || '查看待审批和历史审批记录',
      mine: t?.promptReviewsPage?.mine || '仅看我发起',
      all: t?.promptReviewsPage?.all || '全部',
      empty: t?.promptReviewsPage?.empty || '暂无审批记录',
      open: t?.promptReviewsPage?.open || '打开详情',
      teamRequired: t?.promptReviewsPage?.teamRequired || '请选择团队空间后查看审批',
    }),
    [t]
  )

  const loadRequests = useCallback(async () => {
    if (!activeTeamId) {
      setRequests([])
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.getChangeRequests(
        { status, mine: mine ? 'true' : 'false' },
        { teamId: activeTeamId }
      )
      const list = Array.isArray(result?.change_requests) ? result.change_requests : []
      setRequests(list)
    } catch (error) {
      console.error('Failed to load change requests:', error)
      toast({
        variant: 'destructive',
        description: error.message || '加载审批记录失败',
      })
    } finally {
      setLoading(false)
    }
  }, [activeTeamId, status, mine, toast])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant={mine ? 'default' : 'outline'} onClick={() => setMine((prev) => !prev)}>
          {copy.mine}
        </Button>

        <Button variant="outline" onClick={loadRequests}>
          {copy.all}
        </Button>
      </div>

      {!activeTeamId ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{copy.teamRequired}</CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">{copy.empty}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{request.proposed_title}</CardTitle>
                  <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
                <div className="space-y-1">
                  <p>提交人: {request.submitter_user_id}</p>
                  <p>创建时间: {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/prompts/reviews/${request.id}`}>{copy.open}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
