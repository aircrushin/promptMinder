import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { db } from '@/lib/db.js'
import { agentConversations, agentMessages } from '@/drizzle/schema/index.js'
import { eq, and, asc, isNull } from 'drizzle-orm'

// 获取单个对话详情（包含消息）
export async function GET(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { teamId } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    // 构建查询条件
    const conversationConditions = [
      eq(agentConversations.id, id),
      eq(agentConversations.userId, userId)
    ]
    if (teamId) {
      conversationConditions.push(eq(agentConversations.teamId, teamId))
    } else {
      conversationConditions.push(isNull(agentConversations.teamId))
    }

    // 获取对话
    const conversationResult = await db
      .select()
      .from(agentConversations)
      .where(and(...conversationConditions))
      .limit(1)

    if (conversationResult.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const conversation = conversationResult[0]

    // 获取消息
    const messages = await db
      .select({
        id: agentMessages.id,
        role: agentMessages.role,
        content: agentMessages.content,
        toolCalls: agentMessages.toolCalls,
        toolResults: agentMessages.toolResults,
        sequence: agentMessages.sequence,
        createdAt: agentMessages.createdAt,
        metadata: agentMessages.metadata,
      })
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, id))
      .orderBy(asc(agentMessages.sequence))

    return NextResponse.json({
      conversation: {
        ...conversation,
        messages
      }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load conversation')
  }
}

// 更新对话（如标题）
export async function PATCH(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { teamId } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const data = await request.json()
    const { title } = data

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 构建查询条件
    const conditions = [
      eq(agentConversations.id, id),
      eq(agentConversations.userId, userId)
    ]
    if (teamId) {
      conditions.push(eq(agentConversations.teamId, teamId))
    } else {
      conditions.push(isNull(agentConversations.teamId))
    }

    const result = await db
      .update(agentConversations)
      .set({
        title: title.trim(),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ conversation: result[0] })
  } catch (error) {
    return handleApiError(error, 'Unable to update conversation')
  }
}

// 删除对话
export async function DELETE(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { teamId } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    // 构建查询条件
    const conditions = [
      eq(agentConversations.id, id),
      eq(agentConversations.userId, userId)
    ]
    if (teamId) {
      conditions.push(eq(agentConversations.teamId, teamId))
    } else {
      conditions.push(isNull(agentConversations.teamId))
    }

    // 删除对话（级联删除消息）
    const result = await db
      .delete(agentConversations)
      .where(and(...conditions))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete conversation')
  }
}
