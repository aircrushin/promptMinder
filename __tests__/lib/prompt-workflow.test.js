import { ApiError } from '@/lib/api-error.js'
import {
  WORKFLOW_EVENT_TYPES,
  addSubscription,
  applyChangeRequestAction,
  createChangeRequest,
  createCommentOnChangeRequest,
  createNotifications,
  getSubscriptionState,
  getTeamApprovalSettings,
  isTeamApprovalEnabled,
  listCommentsByRequest,
  listNotifications,
  listPendingCountsByLineage,
  listSubscriptionsByLineageForUser,
  markAllNotificationsRead,
  markNotificationRead,
  removeSubscription,
} from '@/lib/prompt-workflow.js'
import { createMockDb } from '../helpers/mock-drizzle.js'

describe('prompt-workflow', () => {
  let db

  beforeEach(() => {
    db = createMockDb()
  })

  describe('approval settings', () => {
    it('应该读取团队审批开关', async () => {
      db.enqueueSelect([{ approvalEnabled: true }])
      await expect(getTeamApprovalSettings(db, 'team-1')).resolves.toEqual({
        approval_enabled: true,
      })
    })

    it('团队不存在时应抛出 404', async () => {
      db.enqueueSelect([])
      await expect(getTeamApprovalSettings(db, 'missing')).rejects.toBeInstanceOf(ApiError)
    })

    it('应该判断审批是否开启', async () => {
      db.enqueueSelect([{ approvalEnabled: false }])
      await expect(isTeamApprovalEnabled(db, 'team-1')).resolves.toBe(false)
    })
  })

  describe('subscriptions', () => {
    it('缺少参数时 addSubscription 应直接返回', async () => {
      await addSubscription(db, { teamId: null, lineageId: 'l1', userId: 'u1' })
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('应该写入订阅并忽略冲突', async () => {
      db.enqueueInsert([])
      await addSubscription(db, { teamId: 'team-1', lineageId: 'line-1', userId: 'user-1' })
      expect(db.insert).toHaveBeenCalled()
    })

    it('应该删除订阅', async () => {
      db.enqueueDelete([])
      await removeSubscription(db, { teamId: 'team-1', lineageId: 'line-1', userId: 'user-1' })
      expect(db.delete).toHaveBeenCalled()
    })

    it('应该返回订阅状态', async () => {
      db.enqueueSelect([{ id: 'sub-1' }])
      await expect(
        getSubscriptionState(db, { teamId: 'team-1', lineageId: 'line-1', userId: 'user-1' })
      ).resolves.toBe(true)

      db.enqueueSelect([])
      await expect(
        getSubscriptionState(db, { teamId: 'team-1', lineageId: 'line-1', userId: 'user-1' })
      ).resolves.toBe(false)
    })

    it('listSubscriptionsByLineageForUser 在空输入时返回空集合', async () => {
      await expect(
        listSubscriptionsByLineageForUser(db, { teamId: 'team-1', lineageIds: [], userId: 'u1' })
      ).resolves.toEqual(new Set())
      expect(db.select).not.toHaveBeenCalled()
    })

    it('应该返回用户已订阅的 lineage 集合', async () => {
      db.enqueueSelect([{ lineageId: 'line-1' }, { lineageId: 'line-2' }])
      const result = await listSubscriptionsByLineageForUser(db, {
        teamId: 'team-1',
        lineageIds: ['line-1', 'line-2', 'line-3'],
        userId: 'user-1',
      })
      expect(result).toEqual(new Set(['line-1', 'line-2']))
    })
  })

  describe('createChangeRequest', () => {
    it('应该创建审批单、自动订阅并通知管理员', async () => {
      db.enqueueInsert([
        {
          id: 'cr-1',
          teamId: 'team-1',
          lineageId: 'line-1',
          requestType: 'create_version',
          proposedTitle: '标题',
          proposedContent: '内容',
          status: 'pending',
          submitterUserId: 'user-1',
        },
      ])
      // addSubscription
      db.enqueueInsert([])
      // managers
      db.enqueueSelect([{ userId: 'admin-1' }, { userId: 'owner-1' }])
      // notifications
      db.enqueueInsert([])
      // workflow event
      db.enqueueInsert([])

      const result = await createChangeRequest(db, {
        teamId: 'team-1',
        lineageId: 'line-1',
        basePromptId: 'prompt-old',
        requestType: 'create_version',
        submitterUserId: 'user-1',
        proposal: {
          title: '标题',
          content: '内容',
          version: '1.1.0',
        },
      })

      expect(result.id).toBe('cr-1')
      expect(result.team_id).toBe('team-1')
      expect(result.status).toBe('pending')
      expect(db.insert).toHaveBeenCalled()
      expect(db.select).toHaveBeenCalled()
    })
  })

  describe('applyChangeRequestAction', () => {
    const pendingRequest = {
      id: 'cr-1',
      team_id: 'team-1',
      lineage_id: 'line-1',
      submitter_user_id: 'user-1',
      proposed_title: '标题',
      proposed_content: '内容',
      proposed_description: null,
      proposed_tags: null,
      proposed_version: '1.2.0',
      proposed_project_id: null,
      status: 'pending',
    }

    it('非提交者不能撤回', async () => {
      await expect(
        applyChangeRequestAction(db, {
          request: pendingRequest,
          action: 'withdraw',
          actorUserId: 'other-user',
        })
      ).rejects.toMatchObject({ status: 403 })
    })

    it('提交者可以撤回 pending 请求', async () => {
      db.enqueueUpdate([{ ...pendingRequest, status: 'withdrawn', id: 'cr-1', teamId: 'team-1', lineageId: 'line-1', submitterUserId: 'user-1' }])
      db.enqueueInsert([]) // workflow event

      const result = await applyChangeRequestAction(db, {
        request: pendingRequest,
        action: 'withdraw',
        actorUserId: 'user-1',
      })

      expect(result.request.status).toBe('withdrawn')
      expect(result.published_prompt).toBeNull()
    })

    it('拒绝审批时应更新状态并通知订阅者', async () => {
      db.enqueueUpdate([
        {
          id: 'cr-1',
          teamId: 'team-1',
          lineageId: 'line-1',
          status: 'rejected',
          submitterUserId: 'user-1',
          proposedTitle: '标题',
          proposedContent: '内容',
        },
      ])
      // addSubscription actor + submitter
      db.enqueueInsert([])
      db.enqueueInsert([])
      // subscribers
      db.enqueueSelect([{ userId: 'user-1' }, { userId: 'admin-1' }])
      // notifications
      db.enqueueInsert([])
      // event
      db.enqueueInsert([])

      const result = await applyChangeRequestAction(db, {
        request: pendingRequest,
        action: 'reject',
        actorUserId: 'admin-1',
        reviewNote: '需要修改',
      })

      expect(result.request.status).toBe('rejected')
      expect(result.published_prompt).toBeNull()
    })

    it('通过审批时应发布新版本提示词', async () => {
      db.enqueueInsert([
        {
          id: 'prompt-new',
          teamId: 'team-1',
          lineageId: 'line-1',
          title: '标题',
          content: '内容',
          version: '1.2.0',
          userId: 'user-1',
          createdBy: 'user-1',
          isPublic: false,
        },
      ])
      db.enqueueUpdate([
        {
          id: 'cr-1',
          teamId: 'team-1',
          lineageId: 'line-1',
          status: 'approved',
          submitterUserId: 'user-1',
          proposedTitle: '标题',
          proposedContent: '内容',
        },
      ])
      db.enqueueInsert([])
      db.enqueueInsert([])
      db.enqueueSelect([{ userId: 'user-1' }])
      db.enqueueInsert([])
      db.enqueueInsert([])

      const result = await applyChangeRequestAction(db, {
        request: pendingRequest,
        action: 'approve',
        actorUserId: 'admin-1',
      })

      expect(result.request.status).toBe('approved')
      expect(result.published_prompt.id).toBe('prompt-new')
      expect(result.published_prompt.version).toBe('1.2.0')
    })

    it('非法 action 应返回 400', async () => {
      await expect(
        applyChangeRequestAction(db, {
          request: pendingRequest,
          action: 'ship_it',
          actorUserId: 'admin-1',
        })
      ).rejects.toMatchObject({ status: 400 })
    })
  })

  describe('comments and mentions', () => {
    const request = {
      id: 'cr-1',
      team_id: 'team-1',
      lineage_id: 'line-1',
      proposed_title: '标题',
    }

    it('空评论应拒绝', async () => {
      await expect(
        createCommentOnChangeRequest(db, {
          request,
          content: '   ',
          authorUserId: 'user-1',
        })
      ).rejects.toMatchObject({ status: 400 })
    })

    it('提及非活跃成员应拒绝', async () => {
      db.enqueueSelect([{ userId: 'user-2' }]) // only one active
      await expect(
        createCommentOnChangeRequest(db, {
          request,
          content: '请看这里 @user-2 @ghost',
          authorUserId: 'user-1',
          mentionUserIds: ['user-2', 'ghost'],
        })
      ).rejects.toMatchObject({ status: 400, message: 'Mentions must be active team members' })
    })

    it('应该创建评论、写入提及并通知被提及用户', async () => {
      // getActiveTeamUserIds
      db.enqueueSelect([{ userId: 'user-2' }])
      // insert comment
      db.enqueueInsert([
        {
          id: 'comment-1',
          changeRequestId: 'cr-1',
          teamId: 'team-1',
          authorUserId: 'user-1',
          content: '请评审 @user-2',
        },
      ])
      // insert mentions
      db.enqueueInsert([])
      // addSubscription author + mentioned
      db.enqueueInsert([])
      db.enqueueInsert([])
      // mention notifications
      db.enqueueInsert([])
      // comment event + mention event
      db.enqueueInsert([])
      db.enqueueInsert([])

      const comment = await createCommentOnChangeRequest(db, {
        request,
        content: '请评审 @user-2',
        authorUserId: 'user-1',
        mentionUserIds: ['user-2'],
      })

      expect(comment.id).toBe('comment-1')
      expect(comment.mention_user_ids).toEqual(['user-2'])
      expect(comment.content).toBe('请评审 @user-2')
    })

    it('listCommentsByRequest 应附带 mention_user_ids', async () => {
      db.enqueueSelect([
        {
          id: 'comment-1',
          changeRequestId: 'cr-1',
          teamId: 'team-1',
          authorUserId: 'user-1',
          content: 'hello',
        },
      ])
      db.enqueueSelect([{ commentId: 'comment-1', mentionedUserId: 'user-2' }])

      const comments = await listCommentsByRequest(db, 'cr-1')
      expect(comments).toHaveLength(1)
      expect(comments[0].mention_user_ids).toEqual(['user-2'])
    })
  })

  describe('notifications', () => {
    it('createNotifications 在空列表时不写库', async () => {
      await createNotifications(db, [])
      expect(db.insert).not.toHaveBeenCalled()
    })

    it('createNotifications 应按 key 去重', async () => {
      db.enqueueInsert([])
      await createNotifications(db, [
        {
          teamId: 'team-1',
          userId: 'user-1',
          type: WORKFLOW_EVENT_TYPES.MENTION_CREATED,
          title: '你被提及了',
          body: '内容',
          entityType: 'change_request',
          entityId: 'cr-1',
        },
        {
          teamId: 'team-1',
          userId: 'user-1',
          type: WORKFLOW_EVENT_TYPES.MENTION_CREATED,
          title: '你被提及了',
          body: '内容',
          entityType: 'change_request',
          entityId: 'cr-1',
        },
      ])
      expect(db.insert).toHaveBeenCalledTimes(1)
    })

    it('应该分页列出通知并返回未读数', async () => {
      db.enqueueSelect([
        {
          id: 'n1',
          userId: 'user-1',
          title: '审批已通过',
          body: 'ok',
          isRead: false,
        },
      ])
      db.enqueueSelect([{ value: 1 }])
      db.enqueueSelect([{ value: 1 }])

      const result = await listNotifications(db, {
        userId: 'user-1',
        unreadOnly: true,
        page: 1,
        limit: 20,
      })

      expect(result.notifications).toHaveLength(1)
      expect(result.unread_count).toBe(1)
      expect(result.pagination.total).toBe(1)
    })

    it('应该标记单条通知已读', async () => {
      db.enqueueUpdate([
        {
          id: 'n1',
          userId: 'user-1',
          isRead: true,
          title: 't',
          body: 'b',
        },
      ])

      const result = await markNotificationRead(db, {
        notificationId: 'n1',
        userId: 'user-1',
      })
      expect(result.is_read).toBe(true)
    })

    it('标记不存在的通知应 404', async () => {
      db.enqueueUpdate([])
      await expect(
        markNotificationRead(db, { notificationId: 'missing', userId: 'user-1' })
      ).rejects.toMatchObject({ status: 404 })
    })

    it('应该批量标记全部已读', async () => {
      db.enqueueUpdate([])
      await markAllNotificationsRead(db, { userId: 'user-1' })
      expect(db.update).toHaveBeenCalled()
    })
  })

  describe('pending counts', () => {
    it('空 lineage 列表返回空 Map', async () => {
      await expect(
        listPendingCountsByLineage(db, { teamId: 'team-1', lineageIds: [] })
      ).resolves.toEqual(new Map())
    })

    it('应该按 lineage 聚合 pending 数量', async () => {
      db.enqueueSelect([
        { lineageId: 'line-1', value: 2 },
        { lineageId: 'line-2', value: 1 },
      ])
      const result = await listPendingCountsByLineage(db, {
        teamId: 'team-1',
        lineageIds: ['line-1', 'line-2'],
      })
      expect(result.get('line-1')).toBe(2)
      expect(result.get('line-2')).toBe(1)
    })
  })
})
