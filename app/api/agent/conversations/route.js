import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { db } from '@/lib/db.js'
import { agentConversations, agentMessages } from '@/drizzle/schema/index.js'
import { eq, and, desc, isNull } from 'drizzle-orm'

// 获取对话列表
export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 构建查询条件
    const conditions = [eq(agentConversations.userId, userId)]
    if (teamId) {
      conditions.push(eq(agentConversations.teamId, teamId))
    } else {
      conditions.push(isNull(agentConversations.teamId))
    }

    const conversations = await db
      .select({
        id: agentConversations.id,
        title: agentConversations.title,
        sessionId: agentConversations.sessionId,
        lastMessageAt: agentConversations.lastMessageAt,
        createdAt: agentConversations.createdAt,
        updatedAt: agentConversations.updatedAt,
      })
      .from(agentConversations)
      .where(and(...conditions))
      .orderBy(desc(agentConversations.lastMessageAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({ conversations })
  } catch (error) {
    return handleApiError(error, 'Unable to load conversations')
  }
}

// 创建新对话
export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const data = await request.json()
    const { sessionId, title = '新对话' } = data

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const result = await db
      .insert(agentConversations)
      .values({
        teamId: teamId || null,
        userId,
        title,
        sessionId,
        lastMessageAt: new Date(),
      })
      .returning()

    return NextResponse.json({ conversation: result[0] }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create conversation')
  }
}
