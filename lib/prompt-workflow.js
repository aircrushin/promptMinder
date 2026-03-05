import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  or,
} from 'drizzle-orm'
import {
  inAppNotifications,
  promptChangeCommentMentions,
  promptChangeComments,
  promptChangeRequests,
  promptLineages,
  promptSubscriptions,
  promptWorkflowEvents,
  prompts,
  teamMembers,
  teams,
} from '@/drizzle/schema/index.js'
import { ApiError, assert } from '@/lib/api-error.js'
import { TEAM_ROLES, TEAM_STATUSES } from '@/lib/team-service.js'
import { toSnakeCase } from '@/lib/case-utils.js'

const MANAGER_ROLES = [TEAM_ROLES.OWNER, TEAM_ROLES.ADMIN]

export const WORKFLOW_EVENT_TYPES = {
  CHANGE_REQUEST_SUBMITTED: 'change_request_submitted',
  CHANGE_REQUEST_APPROVED: 'change_request_approved',
  CHANGE_REQUEST_REJECTED: 'change_request_rejected',
  CHANGE_REQUEST_WITHDRAWN: 'change_request_withdrawn',
  COMMENT_ADDED: 'comment_added',
  MENTION_CREATED: 'mention_created',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_REMOVED: 'subscription_removed',
}

export async function getTeamApprovalSettings(db, teamId) {
  const rows = await db
    .select({ approvalEnabled: teams.approvalEnabled })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1)

  if (!rows[0]) {
    throw new ApiError(404, 'Team not found')
  }

  return { approval_enabled: rows[0].approvalEnabled }
}

export async function setTeamApprovalSettings(db, teamId, approvalEnabled) {
  const result = await db
    .update(teams)
    .set({ approvalEnabled, updatedAt: new Date() })
    .where(eq(teams.id, teamId))
    .returning({ approvalEnabled: teams.approvalEnabled })

  if (!result[0]) {
    throw new ApiError(404, 'Team not found')
  }

  return { approval_enabled: result[0].approvalEnabled }
}

export async function isTeamApprovalEnabled(db, teamId) {
  if (!teamId) {
    return false
  }

  const settings = await getTeamApprovalSettings(db, teamId)
  return Boolean(settings.approval_enabled)
}

export async function ensureLineage(db, { teamId = null, title, userId }) {
  assert(title && title.trim().length > 0, 400, 'Title is required')

  const name = title.trim()
  const lineageConditions = [eq(promptLineages.name, name)]

  if (teamId) {
    lineageConditions.push(eq(promptLineages.teamId, teamId))
  } else {
    lineageConditions.push(isNull(promptLineages.teamId))
  }

  const existing = await db
    .select({ id: promptLineages.id })
    .from(promptLineages)
    .where(and(...lineageConditions))
    .orderBy(desc(promptLineages.createdAt))
    .limit(1)

  if (existing[0]?.id) {
    return existing[0].id
  }

  const inserted = await db
    .insert(promptLineages)
    .values({
      teamId: teamId || null,
      name,
      createdBy: userId || null,
      updatedAt: new Date(),
    })
    .returning({ id: promptLineages.id })

  return inserted[0].id
}

export async function getPromptByScope(db, { promptId, teamId, userId }) {
  const conditions = [eq(prompts.id, promptId)]

  if (teamId) {
    conditions.push(eq(prompts.teamId, teamId))
  } else {
    conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
  }

  const rows = await db
    .select()
    .from(prompts)
    .where(and(...conditions))
    .limit(1)

  return rows[0] ? toSnakeCase(rows[0]) : null
}

export async function createPromptDirect(db, { teamId = null, userId, data }) {
  const lineageId = await ensureLineage(db, {
    teamId,
    title: data.title,
    userId,
  })

  const result = await db
    .insert(prompts)
    .values({
      teamId: teamId || null,
      lineageId,
      projectId: teamId ? data.projectId || null : null,
      title: data.title,
      content: data.content,
      description: data.description || null,
      createdBy: userId,
      userId,
      version: data.version || null,
      tags: data.tags || null,
      isPublic: data.is_public ?? false,
      coverImg: data.cover_img || data.image_url || null,
    })
    .returning()

  return toSnakeCase(result[0])
}

export async function addSubscription(db, { teamId, lineageId, userId }) {
  if (!teamId || !lineageId || !userId) return

  await db
    .insert(promptSubscriptions)
    .values({
      teamId,
      lineageId,
      userId,
    })
    .onConflictDoNothing({
      target: [promptSubscriptions.teamId, promptSubscriptions.lineageId, promptSubscriptions.userId],
    })
}

export async function removeSubscription(db, { teamId, lineageId, userId }) {
  await db
    .delete(promptSubscriptions)
    .where(
      and(
        eq(promptSubscriptions.teamId, teamId),
        eq(promptSubscriptions.lineageId, lineageId),
        eq(promptSubscriptions.userId, userId),
      )
    )
}

export async function recordWorkflowEvent(db, {
  teamId,
  lineageId,
  changeRequestId = null,
  eventType,
  actorUserId,
  payload = null,
}) {
  await db.insert(promptWorkflowEvents).values({
    teamId,
    lineageId,
    changeRequestId,
    eventType,
    actorUserId,
    payloadJson: payload,
  })
}

export async function createNotifications(db, notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return
  }

  const dedup = new Map()
  notifications.forEach((item) => {
    if (!item?.userId || !item?.title || !item?.body) return
    const key = `${item.userId}:${item.type || 'workflow'}:${item.entityType || ''}:${item.entityId || ''}:${item.title}`
    if (!dedup.has(key)) {
      dedup.set(key, item)
    }
  })

  const rows = Array.from(dedup.values()).map((item) => ({
    teamId: item.teamId || null,
    userId: item.userId,
    type: item.type || 'workflow',
    title: item.title,
    body: item.body,
    entityType: item.entityType || null,
    entityId: item.entityId || null,
  }))

  if (rows.length === 0) {
    return
  }

  await db.insert(inAppNotifications).values(rows)
}

export async function getTeamManagerUserIds(db, teamId) {
  const rows = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.status, TEAM_STATUSES.ACTIVE),
        inArray(teamMembers.role, MANAGER_ROLES),
      )
    )

  return rows.map((item) => item.userId)
}

export async function getActiveTeamUserIds(db, teamId, userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return []

  const deduped = Array.from(new Set(userIds.filter(Boolean)))
  if (!deduped.length) return []

  const rows = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.status, TEAM_STATUSES.ACTIVE),
        inArray(teamMembers.userId, deduped),
      )
    )

  return rows.map((item) => item.userId)
}

export async function createChangeRequest(db, {
  teamId,
  lineageId,
  basePromptId = null,
  requestType,
  submitterUserId,
  proposal,
}) {
  const inserted = await db
    .insert(promptChangeRequests)
    .values({
      teamId,
      lineageId,
      basePromptId,
      requestType,
      proposedTitle: proposal.title,
      proposedContent: proposal.content,
      proposedDescription: proposal.description || null,
      proposedTags: proposal.tags || null,
      proposedVersion: proposal.version || null,
      proposedProjectId: proposal.projectId || null,
      status: 'pending',
      submitterUserId,
      updatedAt: new Date(),
    })
    .returning()

  const request = inserted[0]

  await addSubscription(db, {
    teamId,
    lineageId,
    userId: submitterUserId,
  })

  const managerUserIds = await getTeamManagerUserIds(db, teamId)

  await createNotifications(
    db,
    managerUserIds.map((managerUserId) => ({
      teamId,
      userId: managerUserId,
      type: WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_SUBMITTED,
      title: '新的版本审批请求',
      body: `${proposal.title} 有新的审批请求待处理。`,
      entityType: 'change_request',
      entityId: request.id,
    }))
  )

  await recordWorkflowEvent(db, {
    teamId,
    lineageId,
    changeRequestId: request.id,
    eventType: WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_SUBMITTED,
    actorUserId: submitterUserId,
    payload: {
      request_type: requestType,
      title: proposal.title,
    },
  })

  return toSnakeCase(request)
}

export async function listPendingCountsByLineage(db, { teamId, lineageIds }) {
  if (!teamId || !Array.isArray(lineageIds) || lineageIds.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      lineageId: promptChangeRequests.lineageId,
      value: count(),
    })
    .from(promptChangeRequests)
    .where(
      and(
        eq(promptChangeRequests.teamId, teamId),
        eq(promptChangeRequests.status, 'pending'),
        inArray(promptChangeRequests.lineageId, lineageIds),
      )
    )
    .groupBy(promptChangeRequests.lineageId)

  return new Map(rows.map((row) => [row.lineageId, row.value]))
}

export async function listSubscriptionsByLineageForUser(db, { teamId, lineageIds, userId }) {
  if (!teamId || !userId || !Array.isArray(lineageIds) || lineageIds.length === 0) {
    return new Set()
  }

  const rows = await db
    .select({ lineageId: promptSubscriptions.lineageId })
    .from(promptSubscriptions)
    .where(
      and(
        eq(promptSubscriptions.teamId, teamId),
        eq(promptSubscriptions.userId, userId),
        inArray(promptSubscriptions.lineageId, lineageIds),
      )
    )

  return new Set(rows.map((item) => item.lineageId))
}

export async function listChangeRequests(db, {
  teamId,
  status,
  mine,
  userId,
}) {
  const conditions = [eq(promptChangeRequests.teamId, teamId)]

  if (status && status !== 'all') {
    conditions.push(eq(promptChangeRequests.status, status))
  }

  if (mine) {
    conditions.push(eq(promptChangeRequests.submitterUserId, userId))
  }

  const rows = await db
    .select()
    .from(promptChangeRequests)
    .where(and(...conditions))
    .orderBy(desc(promptChangeRequests.createdAt))

  return rows.map(toSnakeCase)
}

export async function getChangeRequestById(db, requestId) {
  const rows = await db
    .select()
    .from(promptChangeRequests)
    .where(eq(promptChangeRequests.id, requestId))
    .limit(1)

  return rows[0] ? toSnakeCase(rows[0]) : null
}

export async function getChangeRequestDetail(db, requestId) {
  const request = await getChangeRequestById(db, requestId)
  if (!request) {
    throw new ApiError(404, 'Change request not found')
  }

  let basePrompt = null
  if (request.base_prompt_id) {
    const rows = await db
      .select()
      .from(prompts)
      .where(eq(prompts.id, request.base_prompt_id))
      .limit(1)

    basePrompt = rows[0] ? toSnakeCase(rows[0]) : null
  }

  return {
    request,
    base_prompt: basePrompt,
  }
}

export async function applyChangeRequestAction(db, {
  request,
  action,
  actorUserId,
  reviewNote = null,
}) {
  if (action === 'withdraw') {
    if (request.submitter_user_id !== actorUserId) {
      throw new ApiError(403, 'Only submitter can withdraw the request')
    }

    assert(request.status === 'pending', 409, 'Only pending requests can be withdrawn')

    const updated = await db
      .update(promptChangeRequests)
      .set({
        status: 'withdrawn',
        updatedAt: new Date(),
      })
      .where(eq(promptChangeRequests.id, request.id))
      .returning()

    await recordWorkflowEvent(db, {
      teamId: request.team_id,
      lineageId: request.lineage_id,
      changeRequestId: request.id,
      eventType: WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_WITHDRAWN,
      actorUserId,
      payload: { action: 'withdraw' },
    })

    return { request: toSnakeCase(updated[0]), published_prompt: null }
  }

  assert(request.status === 'pending', 409, 'Only pending requests can be reviewed')

  if (action !== 'approve' && action !== 'reject') {
    throw new ApiError(400, 'Invalid action')
  }

  const isApprove = action === 'approve'
  let publishedPrompt = null

  if (isApprove) {
    const insertedPrompt = await db
      .insert(prompts)
      .values({
        teamId: request.team_id,
        lineageId: request.lineage_id,
        projectId: request.proposed_project_id || null,
        title: request.proposed_title,
        content: request.proposed_content,
        description: request.proposed_description || null,
        tags: request.proposed_tags || null,
        version: request.proposed_version || null,
        userId: request.submitter_user_id,
        createdBy: request.submitter_user_id,
        isPublic: false,
      })
      .returning()

    publishedPrompt = toSnakeCase(insertedPrompt[0])
  }

  const updatedRows = await db
    .update(promptChangeRequests)
    .set({
      status: isApprove ? 'approved' : 'rejected',
      reviewedByUserId: actorUserId,
      reviewNote: reviewNote || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(promptChangeRequests.id, request.id))
    .returning()

  await addSubscription(db, {
    teamId: request.team_id,
    lineageId: request.lineage_id,
    userId: actorUserId,
  })

  await addSubscription(db, {
    teamId: request.team_id,
    lineageId: request.lineage_id,
    userId: request.submitter_user_id,
  })

  const subscriberRows = await db
    .select({ userId: promptSubscriptions.userId })
    .from(promptSubscriptions)
    .where(
      and(
        eq(promptSubscriptions.teamId, request.team_id),
        eq(promptSubscriptions.lineageId, request.lineage_id),
      )
    )

  const recipients = Array.from(new Set([
    request.submitter_user_id,
    ...subscriberRows.map((item) => item.userId),
  ]))

  await createNotifications(
    db,
    recipients.map((userId) => ({
      teamId: request.team_id,
      userId,
      type: isApprove
        ? WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_APPROVED
        : WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_REJECTED,
      title: isApprove ? '审批已通过' : '审批被拒绝',
      body: isApprove
        ? `${request.proposed_title} 的变更已通过审批。`
        : `${request.proposed_title} 的变更未通过审批。`,
      entityType: 'change_request',
      entityId: request.id,
    }))
  )

  await recordWorkflowEvent(db, {
    teamId: request.team_id,
    lineageId: request.lineage_id,
    changeRequestId: request.id,
    eventType: isApprove
      ? WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_APPROVED
      : WORKFLOW_EVENT_TYPES.CHANGE_REQUEST_REJECTED,
    actorUserId,
    payload: {
      action,
      published_prompt_id: publishedPrompt?.id || null,
    },
  })

  return {
    request: toSnakeCase(updatedRows[0]),
    published_prompt: publishedPrompt,
  }
}

export async function listCommentsByRequest(db, requestId) {
  const comments = await db
    .select()
    .from(promptChangeComments)
    .where(eq(promptChangeComments.changeRequestId, requestId))
    .orderBy(asc(promptChangeComments.createdAt))

  if (!comments.length) {
    return []
  }

  const mentionRows = await db
    .select({
      commentId: promptChangeCommentMentions.commentId,
      mentionedUserId: promptChangeCommentMentions.mentionedUserId,
    })
    .from(promptChangeCommentMentions)
    .where(
      inArray(
        promptChangeCommentMentions.commentId,
        comments.map((comment) => comment.id)
      )
    )

  const mentionMap = new Map()
  mentionRows.forEach((row) => {
    const list = mentionMap.get(row.commentId) || []
    list.push(row.mentionedUserId)
    mentionMap.set(row.commentId, list)
  })

  return comments.map((item) => ({
    ...toSnakeCase(item),
    mention_user_ids: mentionMap.get(item.id) || [],
  }))
}

export async function createCommentOnChangeRequest(db, {
  request,
  content,
  authorUserId,
  mentionUserIds = [],
}) {
  assert(content && content.trim().length > 0, 400, 'Comment content is required')

  const normalizedMentionUserIds = Array.from(new Set((mentionUserIds || []).filter(Boolean)))

  const activeMentionUserIds = await getActiveTeamUserIds(db, request.team_id, normalizedMentionUserIds)

  if (activeMentionUserIds.length !== normalizedMentionUserIds.length) {
    throw new ApiError(400, 'Mentions must be active team members')
  }

  const commentResult = await db
    .insert(promptChangeComments)
    .values({
      changeRequestId: request.id,
      teamId: request.team_id,
      authorUserId,
      content: content.trim(),
      updatedAt: new Date(),
    })
    .returning()

  const comment = commentResult[0]

  if (activeMentionUserIds.length > 0) {
    await db
      .insert(promptChangeCommentMentions)
      .values(
        activeMentionUserIds.map((mentionedUserId) => ({
          commentId: comment.id,
          mentionedUserId,
        }))
      )
      .onConflictDoNothing({
        target: [
          promptChangeCommentMentions.commentId,
          promptChangeCommentMentions.mentionedUserId,
        ],
      })
  }

  await addSubscription(db, {
    teamId: request.team_id,
    lineageId: request.lineage_id,
    userId: authorUserId,
  })

  for (const mentionedUserId of activeMentionUserIds) {
    await addSubscription(db, {
      teamId: request.team_id,
      lineageId: request.lineage_id,
      userId: mentionedUserId,
    })
  }

  await createNotifications(
    db,
    activeMentionUserIds
      .filter((mentionedUserId) => mentionedUserId !== authorUserId)
      .map((mentionedUserId) => ({
        teamId: request.team_id,
        userId: mentionedUserId,
        type: WORKFLOW_EVENT_TYPES.MENTION_CREATED,
        title: '你被提及了',
        body: `${request.proposed_title} 的审批讨论中提及了你。`,
        entityType: 'change_request',
        entityId: request.id,
      }))
  )

  await recordWorkflowEvent(db, {
    teamId: request.team_id,
    lineageId: request.lineage_id,
    changeRequestId: request.id,
    eventType: WORKFLOW_EVENT_TYPES.COMMENT_ADDED,
    actorUserId,
    payload: {
      comment_id: comment.id,
      mention_user_ids: activeMentionUserIds,
    },
  })

  if (activeMentionUserIds.length > 0) {
    await recordWorkflowEvent(db, {
      teamId: request.team_id,
      lineageId: request.lineage_id,
      changeRequestId: request.id,
      eventType: WORKFLOW_EVENT_TYPES.MENTION_CREATED,
      actorUserId,
      payload: {
        mention_user_ids: activeMentionUserIds,
        comment_id: comment.id,
      },
    })
  }

  return {
    ...toSnakeCase(comment),
    mention_user_ids: activeMentionUserIds,
  }
}

export async function getLineageByPromptId(db, { promptId, teamId, userId }) {
  const prompt = await getPromptByScope(db, { promptId, teamId, userId })
  if (!prompt) {
    throw new ApiError(404, 'Prompt not found')
  }

  return prompt
}

export async function getSubscriptionState(db, { teamId, lineageId, userId }) {
  const rows = await db
    .select({ id: promptSubscriptions.id })
    .from(promptSubscriptions)
    .where(
      and(
        eq(promptSubscriptions.teamId, teamId),
        eq(promptSubscriptions.lineageId, lineageId),
        eq(promptSubscriptions.userId, userId),
      )
    )
    .limit(1)

  return Boolean(rows[0])
}

export async function listNotifications(db, { userId, unreadOnly = false, page = 1, limit = 20 }) {
  const normalizedPage = Math.max(1, Number(page) || 1)
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20))
  const offset = (normalizedPage - 1) * normalizedLimit

  const conditions = [eq(inAppNotifications.userId, userId)]
  if (unreadOnly) {
    conditions.push(eq(inAppNotifications.isRead, false))
  }

  const whereClause = and(...conditions)

  const [dataRows, countRows, unreadRows] = await Promise.all([
    db
      .select()
      .from(inAppNotifications)
      .where(whereClause)
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(normalizedLimit)
      .offset(offset),
    db.select({ value: count() }).from(inAppNotifications).where(whereClause),
    db
      .select({ value: count() })
      .from(inAppNotifications)
      .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false))),
  ])

  const total = countRows[0]?.value || 0

  return {
    notifications: dataRows.map(toSnakeCase),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.ceil(total / normalizedLimit),
    },
    unread_count: unreadRows[0]?.value || 0,
  }
}

export async function markNotificationRead(db, { notificationId, userId }) {
  const result = await db
    .update(inAppNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(inAppNotifications.id, notificationId), eq(inAppNotifications.userId, userId)))
    .returning()

  if (!result[0]) {
    throw new ApiError(404, 'Notification not found')
  }

  return toSnakeCase(result[0])
}

export async function markAllNotificationsRead(db, { userId }) {
  await db
    .update(inAppNotifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false)))
}

export async function getUnreadNotificationCount(db, { userId }) {
  const rows = await db
    .select({ value: count() })
    .from(inAppNotifications)
    .where(and(eq(inAppNotifications.userId, userId), eq(inAppNotifications.isRead, false)))

  return rows[0]?.value || 0
}

export async function listChangeRequestsByLineage(db, { teamId, lineageId, status }) {
  const conditions = [
    eq(promptChangeRequests.teamId, teamId),
    eq(promptChangeRequests.lineageId, lineageId),
  ]

  if (status && status !== 'all') {
    conditions.push(eq(promptChangeRequests.status, status))
  }

  const rows = await db
    .select()
    .from(promptChangeRequests)
    .where(and(...conditions))
    .orderBy(desc(promptChangeRequests.createdAt))

  return rows.map(toSnakeCase)
}
