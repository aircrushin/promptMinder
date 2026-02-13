// @ts-nocheck
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PromptCard } from '@/components/prompt/PromptCard'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { apiClient } from '@/lib/api-client'
import { useClipboard } from '@/lib/clipboard'

// Mock dependencies
jest.mock('@/hooks/use-toast')
jest.mock('@/contexts/LanguageContext')
jest.mock('@/lib/api-client')
jest.mock('@/lib/clipboard')

describe('PromptCard', () => {
  const mockToast = jest.fn()
  const mockCopy = jest.fn()
  const mockApiClient = {
    copyPrompt: jest.fn()
  }

  const mockTranslations = {
    publicPage: {
      copySuccess: '已复制',
      copyError: '复制失败',
      importTooltip: '导入到我的提示词',
      copyTooltip: '复制提示词',
      copiedTooltip: '已复制',
      importSuccessTitle: '导入成功',
      importSuccessDescription: '提示词已成功导入到您的收藏',
      importErrorTitle: '导入失败',
    }
  }

  const mockPrompt = {
    id: '1',
    role: '代码助手',
    prompt: '你是一个专业的代码助手，请帮助用户解决编程问题。',
    category: '开发工具'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    useToast.mockReturnValue({ toast: mockToast })
    useLanguage.mockReturnValue({ t: mockTranslations })
    useClipboard.mockReturnValue({ copy: mockCopy, copied: false })
    apiClient.copyPrompt = mockApiClient.copyPrompt
  })

  it('应该正确渲染提示词卡片', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    expect(screen.getByText('代码助手')).toBeInTheDocument()
    expect(screen.getByText('你是一个专业的代码助手，请帮助用户解决编程问题。')).toBeInTheDocument()
    expect(screen.getByText('开发工具')).toBeInTheDocument()
  })

  it('应该显示复制和导入按钮', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2) // 导入按钮和复制按钮
  })

  it('点击复制按钮应该复制提示词内容', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    const copyButton = screen.getAllByRole('button')[1] // 复制按钮是第二个
    fireEvent.click(copyButton)
    
    expect(mockCopy).toHaveBeenCalledWith('你是一个专业的代码助手，请帮助用户解决编程问题。')
  })

  it('复制成功后应该显示已复制状态', () => {
    useClipboard.mockReturnValue({ copy: mockCopy, copied: true })
    
    render(<PromptCard prompt={mockPrompt} />)
    
    // 检查是否显示了CheckIcon（已复制状态）
    const copyButton = screen.getAllByRole('button')[1]
    expect(copyButton).toHaveClass('bg-green-100')
  })

  it('点击导入按钮应该调用API导入提示词', async () => {
    mockApiClient.copyPrompt.mockResolvedValue({})
    
    render(<PromptCard prompt={mockPrompt} />)
    
    const importButton = screen.getAllByRole('button')[0] // 导入按钮是第一个
    fireEvent.click(importButton)
    
    expect(mockApiClient.copyPrompt).toHaveBeenCalledWith(mockPrompt)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '导入成功',
        description: '提示词已成功导入到您的收藏',
      })
    })
  })

  it('导入失败时应该显示错误提示', async () => {
    const error = new Error('网络错误')
    mockApiClient.copyPrompt.mockRejectedValue(error)
    
    render(<PromptCard prompt={mockPrompt} />)
    
    const importButton = screen.getAllByRole('button')[0]
    fireEvent.click(importButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '导入失败',
        description: '网络错误',
        variant: 'destructive',
      })
    })
  })

  it('导入过程中应该禁用导入按钮', async () => {
    let resolvePromise
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockApiClient.copyPrompt.mockReturnValue(promise)
    
    render(<PromptCard prompt={mockPrompt} />)
    
    const importButton = screen.getAllByRole('button')[0]
    fireEvent.click(importButton)
    
    expect(importButton).toBeDisabled()
    
    resolvePromise({})
    await waitFor(() => {
      expect(importButton).not.toBeDisabled()
    })
  })

  it('没有分类时不应该显示分类标签', () => {
    const promptWithoutCategory = { ...mockPrompt, category: null }
    
    render(<PromptCard prompt={promptWithoutCategory} />)
    
    expect(screen.queryByText('开发工具')).not.toBeInTheDocument()
  })

  it('翻译未加载时应该返回null', () => {
    useLanguage.mockReturnValue({ t: null })
    
    const { container } = render(<PromptCard prompt={mockPrompt} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('翻译的publicPage未加载时应该返回null', () => {
    useLanguage.mockReturnValue({ t: {} })
    
    const { container } = render(<PromptCard prompt={mockPrompt} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('应该正确处理多行提示词内容', () => {
    const multilinePrompt = {
      ...mockPrompt,
      prompt: '第一行内容\n第二行内容\n第三行内容'
    }
    
    render(<PromptCard prompt={multilinePrompt} />)
    
    const content = screen.getByText('第一行内容\n第二行内容\n第三行内容')
    expect(content).toHaveClass('whitespace-pre-line')
  })

  it('鼠标悬停时应该应用hover样式', () => {
    render(<PromptCard prompt={mockPrompt} />)
    
    const card = screen.getByText('代码助手').closest('.group')
    expect(card).toHaveClass('group')
    
    // 检查卡片是否有hover相关的类
    const cardElement = card.querySelector('[class*="hover:"]')
    expect(cardElement).toBeInTheDocument()
  })
})