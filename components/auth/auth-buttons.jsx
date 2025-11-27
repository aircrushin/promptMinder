'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { AuthModal } from './auth-forms'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

// 登录按钮
export function SignInButton({ children, mode = 'redirect', redirectUrl = '/prompts' }) {
  const [showModal, setShowModal] = useState(false)

  const handleClick = () => {
    if (mode === 'modal') {
      setShowModal(true)
    } else {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    }
  }

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
      <AuthModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        defaultTab="login" 
      />
    </>
  )
}

// 注册按钮
export function SignUpButton({ children, mode = 'redirect', redirectUrl = '/prompts' }) {
  const [showModal, setShowModal] = useState(false)

  const handleClick = () => {
    if (mode === 'modal') {
      setShowModal(true)
    } else {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
    }
  }

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
      <AuthModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        defaultTab="register" 
      />
    </>
  )
}

// 用户按钮（头像下拉菜单）
export function UserButton({ appearance }) {
  const { user, logout } = useAuth()

  if (!user) return null

  const initials = (user.display_name || user.username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className={appearance?.elements?.avatarBox || 'h-9 w-9'}>
            <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.display_name || user.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{user.display_name || user.username}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 重新导出条件渲染组件
export { SignedIn, SignedOut } from '@/contexts/auth-context'
