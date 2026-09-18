import React from 'react'
import { render, screen } from '@testing-library/react'
import McpSettingsPage from '@/app/settings/mcp/page'
import { useLanguage } from '@/contexts/LanguageContext'

jest.mock('@/contexts/LanguageContext', () => ({
  useLanguage: jest.fn(),
}))

jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
  SignInButton: ({ children }) => children,
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>
})

describe('MCP settings page', () => {
  beforeEach(() => {
    useLanguage.mockReturnValue({
      language: 'zh',
      t: {},
    })
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('应该展示 MCP 地址、斜杠快捷方式和客户端接入说明', () => {
    render(<McpSettingsPage />)

    expect(screen.getByText('MCP')).toBeInTheDocument()
    expect(screen.getByText('search_prompts')).toBeInTheDocument()
    expect(screen.getByText('/code-review')).toBeInTheDocument()
    expect(screen.getByText(/claude mcp add --transport http promptminder/)).toBeInTheDocument()
  })
})
