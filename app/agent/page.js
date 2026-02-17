'use client';

import { Suspense } from 'react';
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

export default function AgentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-white overflow-hidden">
      <Suspense fallback={<LoadingSpinner />}>
        <AgentChat />
      </Suspense>
    </div>
  );
}
