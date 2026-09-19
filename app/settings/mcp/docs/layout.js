export const metadata = {
  title: 'MCP 接入说明',
  description:
    '把 PromptMinder 接到 Cursor、Claude、ChatGPT 或其他 MCP 客户端。一次 OAuth 授权后，即可用模糊查询或斜杠快捷方式取出提示词。',
  keywords: [
    'MCP',
    'Model Context Protocol',
    'PromptMinder MCP',
    'Cursor MCP',
    'Claude MCP',
    'ChatGPT MCP',
    'OAuth',
    '提示词管理',
  ],
  alternates: { canonical: '/settings/mcp/docs' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'PromptMinder MCP 接入说明',
    description:
      '远程 MCP 让 AI 客户端查找你的提示词库。支持 Clerk OAuth、斜杠快捷方式和模糊搜索。',
    url: '/settings/mcp/docs',
  },
}

export default function McpDocsLayout({ children }) {
  return children
}
