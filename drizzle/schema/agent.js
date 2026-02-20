import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'

// ─── agent_conversations ──────────────────────────────────────────────────────
// 存储用户的 Agent 对话会话

export const agentConversations = pgTable(
  'agent_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 关联到团队（可选，null 表示个人工作区）
    teamId: uuid('team_id'),
    // 用户 ID（Clerk user id）
    userId: text('user_id').notNull(),
    // 对话标题（自动生成或用户编辑）
    title: text('title').notNull().default('新对话'),
    // 会话 ID（用于关联 Coze/LangGraph 会话）
    sessionId: text('session_id').notNull(),
    // 最后一条消息的时间
    lastMessageAt: timestamp('last_message_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // 创建时间
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // 更新时间
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_agent_conversations_user_id').on(table.userId),
    index('idx_agent_conversations_team_id').on(table.teamId),
    index('idx_agent_conversations_session_id').on(table.sessionId),
    index('idx_agent_conversations_last_message_at').on(table.lastMessageAt.desc()),
    index('idx_agent_conversations_created_at').on(table.createdAt.desc()),
  ]
)

// ─── agent_messages ───────────────────────────────────────────────────────────
// 存储对话中的消息

export const agentMessages = pgTable(
  'agent_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // 关联的对话 ID
    conversationId: uuid('conversation_id').notNull(),
    // 消息角色：user / assistant / system / tool
    role: text('role').notNull(),
    // 消息内容
    content: text('content').notNull(),
    // 工具调用信息（JSON 格式，用于存储 tool_calls）
    toolCalls: jsonb('tool_calls'),
    // 工具调用结果（JSON 格式）
    toolResults: jsonb('tool_results'),
    // 消息在对话中的顺序
    sequence: text('sequence').notNull(),
    // 创建时间
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // 元数据（JSON 格式，用于存储额外信息如 token 数等）
    metadata: jsonb('metadata'),
  },
  (table) => [
    index('idx_agent_messages_conversation_id').on(table.conversationId),
    index('idx_agent_messages_created_at').on(table.createdAt),
    index('idx_agent_messages_conversation_sequence').on(table.conversationId, table.sequence),
  ]
)
