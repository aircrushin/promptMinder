import React from 'react'
import { render, screen } from '@testing-library/react'
import McpDocsPage from '@/app/settings/mcp/docs/page'
import { useLanguage } from '@/contexts/LanguageContext'

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(),
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>
})

jest.mock('lucide-react', () => ({
  AlertTriangle: (props) => <svg data-testid="alert-triangle-icon" {...props} />,
  ArrowLeft: (props) => <svg data-testid="arrow-left-icon" {...props} />,
  BookOpenText: (props) => <svg data-testid="book-open-text-icon" {...props} />,
  Bot: (props) => <svg data-testid="bot-icon" {...props} />,
  Check: (props) => <svg data-testid="check-icon" {...props} />,
  Copy: (props) => <svg data-testid="copy-icon" {...props} />,
  Plug: (props) => <svg data-testid="plug-icon" {...props} />,
  ShieldCheck: (props) => <svg data-testid="shield-check-icon" {...props} />,
  TerminalSquare: (props) => <svg data-testid="terminal-square-icon" {...props} />,
  Wand2: (props) => <svg data-testid="wand-sparkles-icon" {...props} />,
  Wrench: (props) => <svg data-testid="wrench-icon" {...props} />,
}))

describe('MCP docs page', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('应该渲染英文安装文档', () => {
    useLanguage.mockReturnValue({
      language: 'en',
      t: {},
    })

    render(<McpDocsPage />)

    expect(screen.getByText('MCP install guide')).toBeInTheDocument()
    expect(screen.getByText('search_prompts')).toBeInTheDocument()
    expect(screen.getByText('create_prompt')).toBeInTheDocument()
    expect(screen.getByText('update_prompt')).toBeInTheDocument()
    expect(screen.getByText('delete_prompt')).toBeInTheDocument()
    expect(screen.getAllByText('/code-review').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/claude mcp add --transport http promptminder/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/mcp-remote/).length).toBeGreaterThan(0)
    expect(screen.getByText(/oauth-protected-resource\/mcp/)).toBeInTheDocument()
    expect(screen.getAllByText(/oauth\/register/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Bearer pm_xxx/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Back to MCP settings/i })).toHaveAttribute('href', '/settings/mcp')
  })

  it('应该渲染中文安装文档', () => {
    useLanguage.mockReturnValue({
      language: 'zh',
      t: {},
    })

    render(<McpDocsPage />)

    expect(screen.getByText('MCP 接入说明')).toBeInTheDocument()
    expect(screen.getByText('search_prompts')).toBeInTheDocument()
    expect(screen.getByText('create_prompt')).toBeInTheDocument()
    expect(screen.getByText('update_prompt')).toBeInTheDocument()
    expect(screen.getByText('delete_prompt')).toBeInTheDocument()
    expect(screen.getAllByText('/code-review').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/claude mcp add --transport http promptminder/).length).toBeGreaterThan(0)
    expect(screen.getByText('帮我在 PromptMinder 里找周报相关提示词。')).toBeInTheDocument()
    expect(screen.getByText(/Incompatible auth server/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /返回 MCP 设置/ })).toHaveAttribute('href', '/settings/mcp')
  })
})
