'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  // 获取当前会话
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      const data = await res.json()
      
      setUser(data.user)
      setIsSignedIn(data.isSignedIn)
    } catch (error) {
      console.error('获取会话失败:', error)
      setUser(null)
      setIsSignedIn(false)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // 登录
  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || '登录失败')
    }
    
    setUser(data.user)
    setIsSignedIn(true)
    return data
  }

  // 注册
  const register = async (username, password, displayName) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, displayName })
    })
    
    const data = await res.json()
    
    if (!res.ok) {
      throw new Error(data.error || '注册失败')
    }
    
    setUser(data.user)
    setIsSignedIn(true)
    return data
  }

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('登出请求失败:', error)
    }
    
    setUser(null)
    setIsSignedIn(false)
  }

  // 刷新会话
  const refreshSession = () => {
    return fetchSession()
  }

  const value = {
    user,
    isLoaded,
    isSignedIn,
    login,
    register,
    logout,
    refreshSession,
    // 兼容 Clerk 的 API
    userId: user?.id || null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 主 Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 兼容 Clerk 的 useUser hook
export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth()
  return {
    user,
    isLoaded,
    isSignedIn
  }
}

// 条件渲染组件 - 已登录时显示
export function SignedIn({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  
  if (!isLoaded) return null
  if (!isSignedIn) return null
  
  return children
}

// 条件渲染组件 - 未登录时显示
export function SignedOut({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  
  if (!isLoaded) return null
  if (isSignedIn) return null
  
  return children
}
