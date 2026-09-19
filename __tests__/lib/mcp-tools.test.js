import { registerPromptMinderMcp } from '@/lib/mcp/tools.js'
import { requireMcpUserId } from '@/lib/mcp/auth.js'
import { ApiError } from '@/lib/api-error.js'
import { createMcpPrompt, deleteMcpPrompt, updateMcpPrompt } from '@/lib/mcp/mutations.js'
import { getMcpPrompt, listMcpWorkspaces, resolveMcpPromptContent, searchMcpPrompts } from '@/lib/mcp/prompts.js'

jest.mock('@/lib/mcp/auth.js', () => ({
  requireMcpUserId: jest.fn(),
}))

jest.mock('@/lib/mcp/prompts.js', () => ({
  getMcpPrompt: jest.fn(),
  listMcpWorkspaces: jest.fn(),
  resolveMcpPromptContent: jest.fn(),
  searchMcpPrompts: jest.fn(),
}))

jest.mock('@/lib/mcp/mutations.js', () => ({
  createMcpPrompt: jest.fn(),
  deleteMcpPrompt: jest.fn(),
  updateMcpPrompt: jest.fn(),
}))

describe('MCP tool registration', () => {
  it('应该注册搜索、获取、团队和增删改工具', async () => {
    const server = {
      registerTool: jest.fn(),
      registerPrompt: jest.fn(),
    }
    requireMcpUserId.mockReturnValue('user-1')
    searchMcpPrompts.mockResolvedValue({ matches: [{ id: 'prompt-1', title: 'Code Review' }] })
    getMcpPrompt.mockResolvedValue({ id: 'prompt-1', content: 'Review this' })
    listMcpWorkspaces.mockResolvedValue({ workspaces: [{ id: null, name: 'Personal' }] })
    createMcpPrompt.mockResolvedValue({ mode: 'created', prompt: { id: 'prompt-2', title: 'New' } })
    updateMcpPrompt.mockResolvedValue({ mode: 'updated', prompt: { id: 'prompt-1', title: 'Updated' } })
    deleteMcpPrompt.mockResolvedValue({ mode: 'deleted', id: 'prompt-1' })

    registerPromptMinderMcp(server)

    expect(server.registerTool.mock.calls.map((call) => call[0])).toEqual([
      'search_prompts',
      'get_prompt',
      'list_teams',
      'create_prompt',
      'update_prompt',
      'delete_prompt',
    ])
    expect(server.registerPrompt).toHaveBeenCalledWith('prompt', expect.any(Object), expect.any(Function))

    const searchHandler = server.registerTool.mock.calls[0][2]
    const searchResult = await searchHandler({ query: '/code-review' }, {})
    expect(searchMcpPrompts).toHaveBeenCalledWith('user-1', { query: '/code-review', teamId: undefined, limit: undefined })
    expect(searchResult.content[0].text).toContain('Code Review')

    const getHandler = server.registerTool.mock.calls[1][2]
    const getResult = await getHandler({ id: 'prompt-1', team_id: 'team-1' }, {})
    expect(getMcpPrompt).toHaveBeenCalledWith('user-1', { id: 'prompt-1', teamId: 'team-1' })
    expect(getResult.content[0].text).toContain('Review this')

    const listHandler = server.registerTool.mock.calls[2][2]
    const listResult = await listHandler({}, {})
    expect(listMcpWorkspaces).toHaveBeenCalledWith('user-1')
    expect(listResult.content[0].text).toContain('Personal')

    const createHandler = server.registerTool.mock.calls[3][2]
    const createResult = await createHandler({ title: 'New', content: 'Body', tags: 'dev' }, {})
    expect(createMcpPrompt).toHaveBeenCalledWith('user-1', {
      title: 'New',
      content: 'Body',
      description: undefined,
      tags: 'dev',
      version: undefined,
      teamId: undefined,
    })
    expect(createResult.content[0].text).toContain('prompt-2')

    const updateHandler = server.registerTool.mock.calls[4][2]
    const updateResult = await updateHandler({ id: 'prompt-1', title: 'Updated' }, {})
    expect(updateMcpPrompt).toHaveBeenCalledWith('user-1', {
      id: 'prompt-1',
      teamId: undefined,
      title: 'Updated',
      content: undefined,
      description: undefined,
      tags: undefined,
      version: undefined,
    })
    expect(updateResult.content[0].text).toContain('Updated')

    const deleteHandler = server.registerTool.mock.calls[5][2]
    const deleteResult = await deleteHandler({ id: 'prompt-1', confirm: true }, {})
    expect(deleteMcpPrompt).toHaveBeenCalledWith('user-1', { id: 'prompt-1', teamId: undefined, confirm: true })
    expect(deleteResult.content[0].text).toContain('deleted')
  })

  it('应该把业务错误转成 MCP error result', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockReturnValue('user-1')
    getMcpPrompt.mockRejectedValue(new ApiError(404, 'Prompt not found'))
    registerPromptMinderMcp(server)

    const getHandler = server.registerTool.mock.calls[1][2]
    const result = await getHandler({ id: 'missing' }, {})
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('Prompt not found')
  })

  it('应该把未知错误转成 MCP error result', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockReturnValue('user-1')
    searchMcpPrompts.mockRejectedValue(new Error('db down'))
    registerPromptMinderMcp(server)

    const searchHandler = server.registerTool.mock.calls[0][2]
    const result = await searchHandler({ query: 'sql' }, {})
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toBe('db down')
  })

  it('MCP prompt 在唯一匹配时应返回完整内容', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockReturnValue('user-1')
    resolveMcpPromptContent.mockResolvedValue({
      mode: 'exact',
      prompt: {
        title: 'Code Review',
        description: 'Review PRs',
        tags: 'dev',
        content: 'Review this diff carefully.',
      },
    })
    registerPromptMinderMcp(server)

    const promptHandler = server.registerPrompt.mock.calls[0][2]
    const result = await promptHandler({ query: '/code-review' }, {})
    expect(result.description).toBe('Code Review')
    expect(result.messages[0].content.text).toContain('Review this diff carefully.')
  })

  it('MCP prompt 在多结果时应列出候选项', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockReturnValue('user-1')
    resolveMcpPromptContent.mockResolvedValue({
      mode: 'choices',
      matches: [{ id: '1', title: 'A' }, { id: '2', title: 'B' }],
    })
    registerPromptMinderMcp(server)

    const promptHandler = server.registerPrompt.mock.calls[0][2]
    const result = await promptHandler({ query: 'review' }, {})
    expect(result.messages[0].content.text).toContain('Multiple PromptMinder prompts matched')
  })

  it('MCP prompt 未登录时应返回认证错误', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockImplementation(() => {
      throw new Error('Authentication required')
    })
    registerPromptMinderMcp(server)

    const promptHandler = server.registerPrompt.mock.calls[0][2]
    const result = await promptHandler({ query: '/code-review' }, {})
    expect(result.description).toBe('Authentication required')
  })

  it('MCP prompt 无匹配时应给出空结果提示', async () => {
    const server = { registerTool: jest.fn(), registerPrompt: jest.fn() }
    requireMcpUserId.mockReturnValue('user-1')
    resolveMcpPromptContent.mockResolvedValue({ mode: 'empty', matches: [] })
    registerPromptMinderMcp(server)

    const promptHandler = server.registerPrompt.mock.calls[0][2]
    const result = await promptHandler({ query: 'nope' }, {})
    expect(result.messages[0].content.text).toContain('No PromptMinder prompt matched')
  })
})
