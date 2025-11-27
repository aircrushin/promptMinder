'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export function LoginForm({ redirectUrl = '/prompts', onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, refreshSession } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast({
        variant: 'destructive',
        description: '请输入用户名和密码'
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      await login(username, password)
      toast({ description: '登录成功' })

      // Ensure server-set cookie is applied and session is refreshed
      try {
        await refreshSession()
      } catch (err) {
        // ignore refresh errors, proceed with redirect
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectUrl)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error.message || '登录失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          type="text"
          placeholder="请输入用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            登录中...
          </>
        ) : (
          '登录'
        )}
      </Button>
    </form>
  )
}

export function RegisterForm({ redirectUrl = '/prompts', onSuccess }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, refreshSession } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast({
        variant: 'destructive',
        description: '请填写所有必填字段'
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        description: '两次输入的密码不一致'
      })
      return
    }
    
    if (password.length < 6) {
      toast({
        variant: 'destructive',
        description: '密码长度至少 6 个字符'
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      await register(username, password, displayName || username)
      toast({ description: '注册成功' })

      // Ensure server-set cookie is applied and session is refreshed
      try {
        await refreshSession()
      } catch (err) {
        // ignore refresh errors, proceed with redirect
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(redirectUrl)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: error.message || '注册失败'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">用户名 *</Label>
        <Input
          id="reg-username"
          type="text"
          placeholder="字母、数字、下划线"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="display-name">显示名称</Label>
        <Input
          id="display-name"
          type="text"
          placeholder="可选，默认使用用户名"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">密码 *</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="至少 6 个字符"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">确认密码 *</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="再次输入密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            注册中...
          </>
        ) : (
          '注册'
        )}
      </Button>
    </form>
  )
}

// 认证模态框组件
export function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{tab === 'login' ? '登录' : '注册'}</CardTitle>
          <CardDescription>
            {tab === 'login' 
              ? '登录您的账户以继续' 
              : '创建新账户'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tab === 'login' ? (
            <LoginForm onSuccess={onClose} />
          ) : (
            <RegisterForm onSuccess={onClose} />
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
          >
            {tab === 'login' ? '没有账户？立即注册' : '已有账户？立即登录'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
