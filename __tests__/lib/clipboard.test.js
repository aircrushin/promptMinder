import { copyToClipboard, useClipboard } from '@/lib/clipboard'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

// Mock useToast
jest.mock('@/hooks/use-toast')

describe('clipboard utilities', () => {
  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useToast.mockReturnValue({ toast: mockToast })
    
    // Reset DOM and navigator mocks
    delete window.navigator
    delete document.execCommand
    
    // Mock document.createElement and related methods
    document.createElement = jest.fn()
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()
  })

  describe('copyToClipboard', () => {
    it('应该使用现代Clipboard API复制文本', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const onSuccess = jest.fn()
      const onError = jest.fn()

      const result = await copyToClipboard('测试文本', onSuccess, onError)

      expect(mockWriteText).toHaveBeenCalledWith('测试文本')
      expect(onSuccess).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('应该在非安全上下文中使用降级方案', async () => {
      // 模拟非安全上下文
      window.navigator = {}
      window.isSecureContext = false

      const mockTextarea = {
        value: '',
        style: {},
        focus: jest.fn(),
        select: jest.fn(),
      }
      document.createElement.mockReturnValue(mockTextarea)
      document.execCommand = jest.fn().mockReturnValue(true)

      const onSuccess = jest.fn()
      const onError = jest.fn()

      const result = await copyToClipboard('测试文本', onSuccess, onError)

      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(mockTextarea.value).toBe('测试文本')
      expect(mockTextarea.style.position).toBe('fixed')
      expect(mockTextarea.style.left).toBe('-999999px')
      expect(mockTextarea.style.top).toBe('-999999px')
      expect(mockTextarea.focus).toHaveBeenCalled()
      expect(mockTextarea.select).toHaveBeenCalled()
      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(document.body.appendChild).toHaveBeenCalledWith(mockTextarea)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockTextarea)
      expect(onSuccess).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('应该处理Clipboard API失败', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard API失败'))
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const onSuccess = jest.fn()
      const onError = jest.fn()

      const result = await copyToClipboard('测试文本', onSuccess, onError)

      expect(mockWriteText).toHaveBeenCalledWith('测试文本')
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(result).toBe(false)
    })

    it('应该处理execCommand失败', async () => {
      window.navigator = {}
      window.isSecureContext = false

      const mockTextarea = {
        value: '',
        style: {},
        focus: jest.fn(),
        select: jest.fn(),
      }
      document.createElement.mockReturnValue(mockTextarea)
      document.execCommand = jest.fn().mockReturnValue(false)

      const onSuccess = jest.fn()
      const onError = jest.fn()

      const result = await copyToClipboard('测试文本', onSuccess, onError)

      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(result).toBe(false)
    })

    it('应该在没有回调函数时正常工作', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const result = await copyToClipboard('测试文本')

      expect(mockWriteText).toHaveBeenCalledWith('测试文本')
      expect(result).toBe(true)
    })
  })

  describe('useClipboard hook', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('应该返回copy函数和copied状态', () => {
      const { result } = renderHook(() => useClipboard())

      expect(typeof result.current.copy).toBe('function')
      expect(result.current.copied).toBe(false)
    })

    it('复制成功时应该显示成功提示并设置copied状态', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const { result } = renderHook(() => useClipboard('复制成功', '复制失败'))

      await act(async () => {
        await result.current.copy('测试文本')
      })

      expect(mockToast).toHaveBeenCalledWith({
        description: '复制成功',
        duration: 2000,
      })
      expect(result.current.copied).toBe(true)

      // 测试2秒后copied状态重置
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(result.current.copied).toBe(false)
    })

    it('复制失败时应该显示错误提示', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('复制失败'))
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const { result } = renderHook(() => useClipboard('复制成功', '复制失败'))

      await act(async () => {
        await result.current.copy('测试文本')
      })

      expect(mockToast).toHaveBeenCalledWith({
        description: '复制失败',
        variant: 'destructive',
        duration: 2000,
      })
      expect(result.current.copied).toBe(false)
    })

    it('应该使用默认的成功和错误消息', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const { result } = renderHook(() => useClipboard())

      await act(async () => {
        await result.current.copy('测试文本')
      })

      expect(mockToast).toHaveBeenCalledWith({
        description: '已复制到剪贴板',
        duration: 2000,
      })
    })

    it('应该返回复制操作的结果', async () => {
      const mockWriteText = jest.fn().mockResolvedValue()
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const { result } = renderHook(() => useClipboard())

      let copyResult
      await act(async () => {
        copyResult = await result.current.copy('测试文本')
      })

      expect(copyResult).toBe(true)
    })

    it('复制失败时应该返回false', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('失败'))
      window.navigator = {
        clipboard: {
          writeText: mockWriteText
        }
      }
      window.isSecureContext = true

      const { result } = renderHook(() => useClipboard())

      let copyResult
      await act(async () => {
        copyResult = await result.current.copy('测试文本')
      })

      expect(copyResult).toBe(false)
    })
  })
})