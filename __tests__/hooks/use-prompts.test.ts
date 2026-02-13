// @ts-nocheck
import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePrompts, usePromptSearch } from '@/hooks/use-prompts'
import { apiClient } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import { DEFAULTS, UI_CONFIG } from '@/lib/constants'

// Mock dependencies
jest.mock('@/lib/api-client')
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/constants', () => ({
  DEFAULTS: {
    PROMPT_VERSION: '1.0',
    COVER_IMAGE: 'default-cover.jpg'
  },
  UI_CONFIG: {
    DEBOUNCE_DELAY: 300
  }
}))

describe('usePrompts', () => {
  const mockToast = jest.fn()
  const mockApiClient = {
    getPrompts: jest.fn(),
    createPrompt: jest.fn(),
    updatePrompt: jest.fn(),
    deletePrompt: jest.fn(),
    sharePrompt: jest.fn(),
    copyPrompt: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useToast.mockReturnValue({ toast: mockToast })
    Object.assign(apiClient, mockApiClient)
    
    // Mock crypto.randomUUID
    global.crypto = {
      randomUUID: jest.fn().mockReturnValue('test-uuid')
    }
    
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue()
      }
    })
    
    // Mock window.location
    delete window.location
    window.location = {
      origin: 'http://localhost:3000'
    }
  })

  describe('usePrompts hook', () => {
    it('应该初始化时获取提示词列表', async () => {
      const mockPrompts = [
        {
          id: '1',
          title: '测试提示词',
          content: '内容',
          tags: 'react,javascript'
        }
      ]
      
      mockApiClient.getPrompts.mockResolvedValue(mockPrompts)
      
      const { result } = renderHook(() => usePrompts())
      
      expect(result.current.isLoading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.prompts).toHaveLength(1)
      expect(result.current.prompts[0]).toEqual({
        id: '1',
        title: '测试提示词',
        content: '内容',
        tags: ['react', 'javascript'],
        version: '1.0',
        cover_img: 'default-cover.jpg'
      })
    })

    it('应该处理获取提示词失败', async () => {
      const error = new Error('获取失败')
      mockApiClient.getPrompts.mockRejectedValue(error)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.error).toBe(error)
      expect(mockToast).toHaveBeenCalledWith({
        title: '获取失败',
        description: '获取失败',
        variant: 'destructive',
      })
    })

    it('应该根据过滤器获取提示词', async () => {
      const filters = { tag: 'react' }
      mockApiClient.getPrompts.mockResolvedValue([])
      
      renderHook(() => usePrompts(filters))
      
      await waitFor(() => {
        expect(mockApiClient.getPrompts).toHaveBeenCalledWith(filters)
      })
    })

    it('应该成功创建新提示词', async () => {
      const newPromptData = {
        title: '新提示词',
        content: '新内容'
      }
      
      const createdPrompt = {
        id: 'test-uuid',
        ...newPromptData,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        is_public: true
      }
      
      mockApiClient.getPrompts.mockResolvedValue([])
      mockApiClient.createPrompt.mockResolvedValue(createdPrompt)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      let returnedPrompt
      await act(async () => {
        returnedPrompt = await result.current.createPrompt(newPromptData)
      })
      
      expect(mockApiClient.createPrompt).toHaveBeenCalledWith({
        id: 'test-uuid',
        ...newPromptData,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        is_public: true
      })
      
      expect(result.current.prompts).toHaveLength(1)
      expect(result.current.prompts[0]).toEqual(createdPrompt)
      expect(returnedPrompt).toEqual(createdPrompt)
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '创建成功',
        description: '提示词已成功创建',
      })
    })

    it('应该处理创建提示词失败', async () => {
      const error = new Error('创建失败')
      mockApiClient.getPrompts.mockResolvedValue([])
      mockApiClient.createPrompt.mockRejectedValue(error)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await expect(
        act(async () => {
          await result.current.createPrompt({ title: '测试' })
        })
      ).rejects.toThrow('创建失败')
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '创建失败',
        description: '创建失败',
        variant: 'destructive',
      })
    })

    it('应该成功更新提示词', async () => {
      const initialPrompts = [
        { id: '1', title: '原标题', content: '原内容' }
      ]
      
      const updateData = { title: '新标题' }
      const updatedPrompt = { id: '1', title: '新标题', content: '原内容' }
      
      mockApiClient.getPrompts.mockResolvedValue(initialPrompts)
      mockApiClient.updatePrompt.mockResolvedValue(updatedPrompt)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.updatePrompt('1', updateData)
      })
      
      expect(mockApiClient.updatePrompt).toHaveBeenCalledWith('1', {
        ...updateData,
        updated_at: expect.any(String)
      })
      
      expect(result.current.prompts[0].title).toBe('新标题')
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '更新成功',
        description: '提示词已成功更新',
      })
    })

    it('应该成功删除提示词', async () => {
      const initialPrompts = [
        { id: '1', title: '提示词1' },
        { id: '2', title: '提示词2' }
      ]
      
      mockApiClient.getPrompts.mockResolvedValue(initialPrompts)
      mockApiClient.deletePrompt.mockResolvedValue()
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.deletePrompt('1')
      })
      
      expect(mockApiClient.deletePrompt).toHaveBeenCalledWith('1')
      expect(result.current.prompts).toHaveLength(1)
      expect(result.current.prompts[0].id).toBe('2')
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '删除成功',
        description: '提示词已成功删除',
      })
    })

    it('应该成功分享提示词', async () => {
      mockApiClient.getPrompts.mockResolvedValue([])
      mockApiClient.sharePrompt.mockResolvedValue()
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.sharePrompt('1')
      })
      
      expect(mockApiClient.sharePrompt).toHaveBeenCalledWith('1')
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/share/1')
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '分享成功',
        description: '分享链接已复制到剪贴板',
      })
    })

    it('应该成功复制提示词', async () => {
      const promptData = { title: '复制的提示词', content: '内容' }
      const copiedPrompt = { id: 'new-id', ...promptData }
      
      mockApiClient.getPrompts.mockResolvedValue([])
      mockApiClient.copyPrompt.mockResolvedValue(copiedPrompt)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      await act(async () => {
        await result.current.copyPrompt(promptData)
      })
      
      expect(mockApiClient.copyPrompt).toHaveBeenCalledWith(promptData)
      expect(result.current.prompts).toHaveLength(1)
      expect(result.current.prompts[0]).toEqual(copiedPrompt)
      
      expect(mockToast).toHaveBeenCalledWith({
        title: '导入成功',
        description: '提示词已导入到你的库中',
      })
    })

    it('应该正确分组提示词', async () => {
      const prompts = [
        { id: '1', title: '标题A', content: '内容1' },
        { id: '2', title: '标题B', content: '内容2' },
        { id: '3', title: '标题A', content: '内容3' }
      ]
      
      mockApiClient.getPrompts.mockResolvedValue(prompts)
      
      const { result } = renderHook(() => usePrompts())
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      
      expect(result.current.groupedPrompts).toEqual({
        '标题A': [
          expect.objectContaining({ id: '1', title: '标题A' }),
          expect.objectContaining({ id: '3', title: '标题A' })
        ],
        '标题B': [
          expect.objectContaining({ id: '2', title: '标题B' })
        ]
      })
    })
  })

  describe('usePromptSearch hook', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    const mockPrompts = [
      {
        id: '1',
        title: 'React组件',
        description: 'React组件开发',
        content: '创建React组件',
        tags: ['react', 'javascript']
      },
      {
        id: '2',
        title: 'Vue应用',
        description: 'Vue应用开发',
        content: '创建Vue应用',
        tags: ['vue', 'javascript']
      },
      {
        id: '3',
        title: 'CSS样式',
        description: 'CSS样式设计',
        content: '编写CSS样式',
        tags: ['css', 'design']
      }
    ]

    it('应该根据搜索查询过滤提示词', async () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, 'React', [])
      )

      // 等待防抖
      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.filteredPrompts).toHaveLength(1)
        expect(result.current.filteredPrompts[0].title).toBe('React组件')
      })
    })

    it('应该根据标签过滤提示词', () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, '', ['javascript'])
      )

      expect(result.current.filteredPrompts).toHaveLength(2)
      expect(result.current.filteredPrompts.map(p => p.id)).toEqual(['1', '2'])
    })

    it('应该同时根据搜索查询和标签过滤', async () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, 'React', ['javascript'])
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.filteredPrompts).toHaveLength(1)
        expect(result.current.filteredPrompts[0].title).toBe('React组件')
      })
    })

    it('应该在搜索查询中包含描述和内容', async () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, '开发', [])
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.filteredPrompts).toHaveLength(2)
      })
    })

    it('应该防抖搜索查询', () => {
      const { result, rerender } = renderHook(
        ({ query }) => usePromptSearch(mockPrompts, query, []),
        { initialProps: { query: 'React' } }
      )

      // 初始状态应该没有过滤
      expect(result.current.filteredPrompts).toHaveLength(3)

      // 快速更改查询
      rerender({ query: 'Vue' })
      rerender({ query: 'CSS' })

      // 在防抖时间内，应该仍然显示所有结果
      expect(result.current.filteredPrompts).toHaveLength(3)

      // 等待防抖完成
      act(() => {
        jest.advanceTimersByTime(300)
      })

      // 现在应该显示过滤后的结果
      expect(result.current.filteredPrompts).toHaveLength(1)
      expect(result.current.filteredPrompts[0].title).toBe('CSS样式')
    })

    it('应该处理空的提示词列表', () => {
      const { result } = renderHook(() => 
        usePromptSearch(null, 'test', [])
      )

      expect(result.current.filteredPrompts).toEqual([])
    })

    it('应该处理空的搜索查询和标签', () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, '', [])
      )

      expect(result.current.filteredPrompts).toEqual(mockPrompts)
    })

    it('应该返回防抖后的查询', async () => {
      const { result, rerender } = renderHook(
        ({ query }) => usePromptSearch(mockPrompts, query, []),
        { initialProps: { query: 'React' } }
      )

      expect(result.current.debouncedQuery).toBe('')

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.debouncedQuery).toBe('React')
      })
    })

    it('应该在标签匹配时不区分大小写', async () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, 'REACT', [])
      )

      act(() => {
        jest.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.filteredPrompts).toHaveLength(1)
        expect(result.current.filteredPrompts[0].title).toBe('React组件')
      })
    })

    it('应该支持多个标签的OR逻辑', () => {
      const { result } = renderHook(() => 
        usePromptSearch(mockPrompts, '', ['react', 'css'])
      )

      expect(result.current.filteredPrompts).toHaveLength(2)
      expect(result.current.filteredPrompts.map(p => p.title)).toEqual(['React组件', 'CSS样式'])
    })
  })
})
