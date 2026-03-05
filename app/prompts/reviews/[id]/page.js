'use client'

import { use, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTeam } from '@/contexts/team-context'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import PromptDiffViewer from '@/components/prompt/PromptDiffViewer'

function statusVariant(status) {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'
  if (status === 'pending') return 'secondary'
  return 'outline'
}

export default function PromptReviewDetailPage({ params }) {
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const { activeTeamId, activeMembership } = useTeam()
  const { id } = use(params)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [members, setMembers] = useState([])
  const [reviewNote, setReviewNote] = useState('')
  const [commentText, setCommentText] = useState('')
  const [mentionUserIds, setMentionUserIds] = useState([])

  const copy = useMemo(
    () => ({
      back: t?.promptReviewsPage?.back || '返回审批列表',
      comments: t?.promptReviewsPage?.comments || '讨论评论',
      addComment: t?.promptReviewsPage?.addComment || '发表评论',
      reviewNote: t?.promptReviewsPage?.reviewNote || '审批备注（可选）',
      approve: t?.promptReviewsPage?.approve || '通过',
      reject: t?.promptReviewsPage?.reject || '拒绝',
      withdraw: t?.promptReviewsPage?.withdraw || '撤回',
      mentionHint: t?.promptReviewsPage?.mentionHint || '输入 @ 可筛选成员，点击成员添加提及',
    }),
    [t]
  )

  const isManager = activeMembership?.role === 'owner' || activeMembership?.role === 'admin'

  const loadData = useCallback(async () => {
    if (!activeTeamId || !id) {
      return
    }

    setLoading(true)
    try {
      const [detailResult, commentsResult, membersResult] = await Promise.all([
        apiClient.getChangeRequest(id, { teamId: activeTeamId }),
        apiClient.getChangeRequestComments(id, { teamId: activeTeamId }),
        fetch(`/api/teams/${activeTeamId}/members`, {
          headers: { 'X-Team-Id': activeTeamId },
        }).then((res) => res.json()),
      ])

      setDetail(detailResult)
      setComments(Array.isArray(commentsResult?.comments) ? commentsResult.comments : [])
      setMembers(Array.isArray(membersResult?.members) ? membersResult.members : [])
    } catch (error) {
      console.error('Failed to load change request detail:', error)
      toast({
        variant: 'destructive',
        description: error.message || '加载审批详情失败',
      })
    } finally {
      setLoading(false)
    }
  }, [activeTeamId, id, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const request = detail?.request || null
  const basePrompt = detail?.base_prompt || null

  const mentionCandidates = useMemo(() => {
    const match = commentText.match(/@([\w\u4e00-\u9fa5-]*)$/)
    const keyword = match?.[1]?.toLowerCase() || ''
    if (!match) return []

    return members
      .filter((member) => member.user_id)
      .filter((member) => member.status === 'active')
      .filter((member) => {
        const value = `${member.display_name || ''}${member.user_id || ''}`.toLowerCase()
        return value.includes(keyword)
      })
      .slice(0, 6)
  }, [commentText, members])

  const appendMention = (member) => {
    const label = member.display_name || member.user_id
    setCommentText((prev) => prev.replace(/@([\w\u4e00-\u9fa5-]*)$/, `@${label} `))
    setMentionUserIds((prev) => Array.from(new Set([...prev, member.user_id])))
  }

  const handleReview = async (action) => {
    if (!request) return

    setSubmitting(true)
    try {
      await apiClient.reviewChangeRequest(
        request.id,
        { action, review_note: reviewNote || undefined },
        { teamId: activeTeamId }
      )
      toast({ description: '操作成功' })
      setReviewNote('')
      await loadData()
    } catch (error) {
      console.error('Failed to review change request:', error)
      toast({
        variant: 'destructive',
        description: error.message || '审批操作失败',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleComment = async () => {
    if (!request || !commentText.trim()) return

    setSubmitting(true)
    try {
      await apiClient.addChangeRequestComment(
        request.id,
        {
          content: commentText,
          mention_user_ids: mentionUserIds,
        },
        { teamId: activeTeamId }
      )
      setCommentText('')
      setMentionUserIds([])
      await loadData()
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        variant: 'destructive',
        description: error.message || '评论发送失败',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!activeTeamId) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">请选择团队后查看审批详情。</CardContent>
        </Card>
      </div>
    )
  }

  if (loading || !request) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">Loading...</CardContent>
        </Card>
      </div>
    )
  }

  const canWithdraw = request.status === 'pending' && request.submitter_user_id === activeMembership?.userId
  const canReview = request.status === 'pending' && isManager

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" asChild>
          <Link href="/prompts/reviews">{copy.back}</Link>
        </Button>
        <Badge variant={statusVariant(request.status)}>{request.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{request.proposed_title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>提交人: {request.submitter_user_id}</p>
          <p>创建时间: {new Date(request.created_at).toLocaleString()}</p>
          {request.reviewed_by_user_id && <p>审批人: {request.reviewed_by_user_id}</p>}
          {request.review_note && <p>审批备注: {request.review_note}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>内容差异</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptDiffViewer oldContent={basePrompt?.content || ''} newContent={request.proposed_content || ''} t={t} />
        </CardContent>
      </Card>

      {(canReview || canWithdraw) && (
        <Card>
          <CardHeader>
            <CardTitle>审批操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder={copy.reviewNote} />
            <div className="flex flex-wrap gap-2">
              {canReview && (
                <>
                  <Button disabled={submitting} onClick={() => handleReview('approve')}>
                    {copy.approve}
                  </Button>
                  <Button disabled={submitting} variant="destructive" onClick={() => handleReview('reject')}>
                    {copy.reject}
                  </Button>
                </>
              )}
              {canWithdraw && (
                <Button disabled={submitting} variant="outline" onClick={() => handleReview('withdraw')}>
                  {copy.withdraw}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{copy.comments}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{copy.mentionHint}</p>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="输入评论，使用 @ 提及成员"
          />
          {mentionCandidates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mentionCandidates.map((member) => (
                <Button
                  key={member.user_id}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => appendMention(member)}
                >
                  @{member.display_name || member.user_id}
                </Button>
              ))}
            </div>
          )}
          {mentionUserIds.length > 0 && (
            <div className="text-xs text-muted-foreground">
              提及: {mentionUserIds.join(', ')}
            </div>
          )}
          <Button disabled={submitting || !commentText.trim()} onClick={handleComment}>
            {copy.addComment}
          </Button>

          <div className="space-y-3 pt-2">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-4 space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {comment.author_user_id} · {new Date(comment.created_at).toLocaleString()}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                  {comment.mention_user_ids?.length > 0 && (
                    <div className="text-xs text-blue-600">@{comment.mention_user_ids.join(', @')}</div>
                  )}
                </CardContent>
              </Card>
            ))}
            {comments.length === 0 && <p className="text-sm text-muted-foreground">暂无评论</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/prompts')}>返回提示词</Button>
      </div>
    </div>
  )
}
