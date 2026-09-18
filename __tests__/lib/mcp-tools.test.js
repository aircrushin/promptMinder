import { registerPromptMinderMcp } from '@/lib/mcp/tools.js'
import { requireMcpUserId } from '@/lib/mcp/auth.js'
import { getMcpPrompt, listMcpWorkspaces, searchMcpPrompts } from '@/lib/mcp/prompts.js'

jest.mock('@/lib/mcp/auth.js', () => ({
  requireMcpUserId: jest.fn(),
}))

jest.mock('@/lib/mcp/prompts.js', () => ({
  getMcpPrompt: jest.fn(),
  listMcpWorkspaces: jest.fn(),
  resolveMcpPromptContent: jest.fn(),
  searchMcpPrompts: jest.fn(),
}))

describe('MCP tool registration', () => {
  it('应该注册搜索、获取和团队工具', async () => {
    const server = {
      registerTool: jest.fn(),
      registerPrompt: jest.fn(),
    }
    requireMcpUserId.mockReturnValue('user-1')
    searchMcpPrompts.mockResolvedValue({ matches: [{ id: 'prompt-1', title: 'Code Review' }] })
    getMcpPrompt.mockResolvedValue({ id: 'prompt-1', content: 'Review this' })
    listMcpWorkspaces.mockResolvedValue({ workspaces: [{ id: null, name: 'Personal' }] })

    registerPromptMinderMcp(server)

    expect(server.registerTool.mock.calls.map((call) => call[0])).toEqual([
      'search_prompts',
      'get_prompt',
      'list_teams',
    ])
    expect(server.registerPrompt).toHaveBeenCalledWith('prompt', expect.any(Object), expect.any(Function))

    const searchHandler = server.registerTool.mock.calls[0][2]
    const searchResult = await searchHandler({ query: '/code-review' }, {})
    expect(searchMcpPrompts).toHaveBeenCalledWith('user-1', { query: '/code-review', teamId: undefined, limit: undefined })
    expect(searchResult.content[0].text).toContain('Code Review')
  })
})
