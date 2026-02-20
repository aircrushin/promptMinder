import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { db } from '@/lib/db.js'
import { agentConversations, agentMessages } from '@/drizzle/schema/index.js'
import { eq, and, max, sql } from 'drizzle-orm'

// 保存消息
export async function POST(request) {
  try {
    const userId = await requireUserId()
    const data = await request.json()
    const { conversationId, role, content, toolCalls, toolResults, metadata } = data

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    if (!role || !content) {
      return NextResponse.json({ error: 'Role and content are required' }, { status: 400 })
    }

    // 验证对话存在且属于当前用户
    const conversationResult = await db
      .select()
      .from(agentConversations)
      .where(and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId)
      ))
      .limit(1)

    if (conversationResult.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 获取当前最大 sequence
    const maxSequenceResult = await db
      .select({ maxSeq: max(agentMessages.sequence) })
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId))

    const maxSeq = maxSequenceResult[0]?.maxSeq || '0000000000'
    const nextSeq = String(Number(maxSeq) + 1).padStart(10, '0')

    // 插入消息
    const result = await db
      .insert(agentMessages)
      .values({
        conversationId,
        role,
        content,
        toolCalls: toolCalls || null,
        toolResults: toolResults || null,
        sequence: nextSeq,
        metadata: metadata || null,
      })
      .returning()

    // 更新对话的最后消息时间
    await db
      .update(agentConversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentConversations.id, conversationId))

    return NextResponse.json({ message: result[0] }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to save message')
  }
}

// 批量保存消息（用于保存整个对话）
export async function PUT(request) {
  try {
    const userId = await requireUserId()
    const data = await request.json()
    const { conversationId, messages } = data

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // 验证对话存在且属于当前用户
    const conversationResult = await db
      .select()
      .from(agentConversations)
      .where(and(
        eq(agentConversations.id, conversationId),
        eq(agentConversations.userId, userId)
      ))
      .limit(1)

    if (conversationResult.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // 获取当前最大 sequence
    const maxSequenceResult = await db
      .select({ maxSeq: max(agentMessages.sequence) })
      .from(agentMessages)
      .where(eq(agentMessages.conversationId, conversationId))

    let currentSeq = Number(maxSequenceResult[0]?.maxSeq || '0000000000')

    // 批量插入消息
    const values = messages.map((msg) => {
      currentSeq += 1
      return {
        conversationId,
        role: msg.role,
        content: msg.content,
        toolCalls: msg.toolCalls || null,
        toolResults: msg.toolResults || null,
        sequence: String(currentSeq).padStart(10, '0'),
        metadata: msg.metadata || null,
      }
    })

    const result = await db
      .insert(agentMessages)
      .values(values)
      .returning()

    // 更新对话的最后消息时间
    await db
      .update(agentConversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentConversations.id, conversationId))

    return NextResponse.json({ messages: result }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to save messages')
  }
}
