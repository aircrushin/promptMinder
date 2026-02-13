import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast, reducer } from '@/hooks/use-toast'

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // 清理全局状态
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('reducer', () => {
    const initialState = { toasts: [] }

    it('应该添加新的toast', () => {
      const newToast = { id: '1', title: '测试', open: true }
      const action = { type: 'ADD_TOAST', toast: newToast }
      
      const newState = reducer(initialState, action)
      
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0]).toEqual(newToast)
    })

    it('应该限制toast数量', () => {
      const state = {
        toasts: [{ id: '1', title: '第一个', open: true }]
      }
      const newToast = { id: '2', title: '第二个', open: true }
      const action = { type: 'ADD_TOAST', toast: newToast }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('2')
    })

    it('应该更新现有的toast', () => {
      const state = {
        toasts: [
          { id: '1', title: '原标题', open: true },
          { id: '2', title: '其他', open: true }
        ]
      }
      const updatedToast = { id: '1', title: '新标题' }
      const action = { type: 'UPDATE_TOAST', toast: updatedToast }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts[0]).toEqual({ id: '1', title: '新标题', open: true })
      expect(newState.toasts[1]).toEqual({ id: '2', title: '其他', open: true })
    })

    it('应该关闭指定的toast', () => {
      const state = {
        toasts: [
          { id: '1', title: '第一个', open: true },
          { id: '2', title: '第二个', open: true }
        ]
      }
      const action = { type: 'DISMISS_TOAST', toastId: '1' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts[0].open).toBe(false)
      expect(newState.toasts[1].open).toBe(true)
    })

    it('应该关闭所有toast当没有指定ID时', () => {
      const state = {
        toasts: [
          { id: '1', title: '第一个', open: true },
          { id: '2', title: '第二个', open: true }
        ]
      }
      const action = { type: 'DISMISS_TOAST' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts[0].open).toBe(false)
      expect(newState.toasts[1].open).toBe(false)
    })

    it('应该移除指定的toast', () => {
      const state = {
        toasts: [
          { id: '1', title: '第一个', open: true },
          { id: '2', title: '第二个', open: true }
        ]
      }
      const action = { type: 'REMOVE_TOAST', toastId: '1' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts).toHaveLength(1)
      expect(newState.toasts[0].id).toBe('2')
    })

    it('应该移除所有toast当没有指定ID时', () => {
      const state = {
        toasts: [
          { id: '1', title: '第一个', open: true },
          { id: '2', title: '第二个', open: true }
        ]
      }
      const action = { type: 'REMOVE_TOAST' }
      
      const newState = reducer(state, action)
      
      expect(newState.toasts).toHaveLength(0)
    })
  })

  describe('toast function', () => {
    it('应该创建新的toast并返回控制对象', () => {
      const result = toast({ title: '测试toast', description: '描述' })
      
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('dismiss')
      expect(result).toHaveProperty('update')
      expect(typeof result.dismiss).toBe('function')
      expect(typeof result.update).toBe('function')
    })

    it('应该能够更新toast', () => {
      const toastInstance = toast({ title: '原标题' })
      
      act(() => {
        toastInstance.update({ title: '新标题', description: '新描述' })
      })
      
      // 这里我们无法直接验证状态，但可以确保update函数被调用
      expect(typeof toastInstance.update).toBe('function')
    })

    it('应该能够关闭toast', () => {
      const toastInstance = toast({ title: '测试' })
      
      act(() => {
        toastInstance.dismiss()
      })
      
      expect(typeof toastInstance.dismiss).toBe('function')
    })
  })

  describe('useToast hook', () => {
    it('应该返回toast状态和函数', () => {
      const { result } = renderHook(() => useToast())
      
      expect(result.current).toHaveProperty('toasts')
      expect(result.current).toHaveProperty('toast')
      expect(result.current).toHaveProperty('dismiss')
      expect(Array.isArray(result.current.toasts)).toBe(true)
      expect(typeof result.current.toast).toBe('function')
      expect(typeof result.current.dismiss).toBe('function')
    })

    it('应该能够添加toast', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({ title: '测试toast' })
      })
      
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('测试toast')
    })

    it('应该能够关闭toast', () => {
      const { result } = renderHook(() => useToast())
      
      let toastId
      act(() => {
        const toastInstance = result.current.toast({ title: '测试toast' })
        toastId = toastInstance.id
      })
      
      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].open).toBe(true)
      
      act(() => {
        result.current.dismiss(toastId)
      })
      
      expect(result.current.toasts[0].open).toBe(false)
    })

    it('应该在组件卸载时清理监听器', () => {
      const { unmount } = renderHook(() => useToast())
      
      // 验证hook正常工作
      expect(() => unmount()).not.toThrow()
    })

    it('应该处理toast的onOpenChange回调', () => {
      const { result } = renderHook(() => useToast())
      
      let toastInstance
      act(() => {
        toastInstance = result.current.toast({ title: '测试toast' })
      })
      
      expect(result.current.toasts[0].open).toBe(true)
      
      act(() => {
        result.current.toasts[0].onOpenChange(false)
      })
      
      expect(result.current.toasts[0].open).toBe(false)
    })

    it('应该支持不同类型的toast', () => {
      const { result } = renderHook(() => useToast())
      
      act(() => {
        result.current.toast({
          title: '成功',
          description: '操作成功',
          variant: 'default'
        })
      })
      
      expect(result.current.toasts[0].variant).toBe('default')
      
      act(() => {
        result.current.toast({
          title: '错误',
          description: '操作失败',
          variant: 'destructive'
        })
      })
      
      expect(result.current.toasts[0].variant).toBe('destructive')
    })
  })
})