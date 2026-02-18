'use client';

import { Suspense, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import AgentChat from '@/components/agent/agent-chat';

function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-zinc-200" />
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-zinc-800" />
      </div>
    </div>
  );
}

function AgentPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // 如果认证状态还在加载中，显示加载动画
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // 如果用户未登录，显示加载动画（等待重定向）
  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AgentChat />
    </Suspense>
  );
}

export default function AgentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-white overflow-hidden">
      <AgentPageContent />
    </div>
  );
}
