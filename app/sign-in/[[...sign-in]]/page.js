'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/auth-forms'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect_url') || '/prompts'

  const handleSuccess = () => {
    router.push(redirectUrl)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>
            登录您的账户以继续
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectUrl={redirectUrl} onSuccess={handleSuccess} />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}>
            <Button variant="link">没有账户？立即注册</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}