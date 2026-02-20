'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * Agent 页面骨架屏组件
 * 用于在 AgentChat 和 ConversationSidebar 加载时显示
 */

// 侧边栏骨架屏
export function AgentSidebarSkeleton() {
  return (
    <div className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-20" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
        {/* Search */}
        <Skeleton className="h-8 w-full rounded-md" />
      </div>

      {/* Conversation List */}
      <div className="flex-1 p-3 space-y-4">
        {/* 今天分组 */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-3 w-14" />
              </div>
            </div>
          </div>
        </div>

        {/* 昨天分组 */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-[90%]" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* 过去7天分组 */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-[75%]" />
                <Skeleton className="h-3 w-18" />
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 聊天区域骨架屏 - 欢迎界面风格
export function AgentChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
      {/* Welcome Screen Skeleton */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col items-center max-w-2xl w-full">
          {/* Logo */}
          <div className="relative mb-6">
            <Skeleton className="h-20 w-20 rounded-3xl" />
          </div>

          {/* Title */}
          <Skeleton className="h-9 w-48 mb-2" />
          {/* Subtitle */}
          <Skeleton className="h-6 w-64 mb-4" />
          {/* Description */}
          <Skeleton className="h-5 w-full max-w-md mb-2" />
          <Skeleton className="h-5 w-[80%] max-w-sm mb-10" />

          {/* Suggestion Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-3.5">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="border-t border-zinc-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="flex items-center justify-between mt-2.5 px-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 完整页面骨架屏
export function AgentPageSkeleton() {
  return (
    <div className="flex h-full w-full">
      <AgentSidebarSkeleton />
      <AgentChatSkeleton />
    </div>
  );
}

export default AgentPageSkeleton;
