'use client';

import { Suspense } from 'react';
import AgentChat from '@/components/agent/agent-chat';

export default function AgentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-gray-50 overflow-hidden">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <AgentChat />
      </Suspense>
    </div>
  );
}
