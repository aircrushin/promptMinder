'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AgentPageSkeleton } from '@/components/agent/agent-skeleton';

// 动态导入组件以避免 SSR 问题
const AgentChat = dynamic(() => import('@/components/agent/agent-chat'), {
  ssr: false,
  loading: () => <AgentPageSkeleton />
});

const ConversationSidebar = dynamic(() => import('@/components/agent/conversation-sidebar'), {
  ssr: false,
  loading: () => <AgentPageSkeleton />
});

function AgentPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentConversation, setCurrentConversation] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const generateNewSession = useCallback(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setSessionId(newSessionId);
    setCurrentConversation(null);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      generateNewSession();
    }
  }, [sessionId, generateNewSession]);

  const handleSelectConversation = useCallback((conversation) => {
    if (conversation) {
      setCurrentConversation(conversation);
      setSessionId(conversation.sessionId);
    } else {
      generateNewSession();
    }
  }, [generateNewSession]);

  const handleCreateConversation = useCallback((conversation) => {
    setCurrentConversation(conversation);
    setSessionId(conversation.sessionId);
  }, []);

  const handleConversationChange = useCallback(() => {
    if (typeof window !== 'undefined' && window.refreshConversationSidebar) {
      window.refreshConversationSidebar();
    }
  }, []);

  if (!isLoaded || !user) {
    return <AgentPageSkeleton />;
  }

  return (
    <div className="flex h-full w-full">
      {/* 侧边栏 */}
      <ConversationSidebar
        currentConversationId={currentConversation?.id}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onConversationChange={handleConversationChange}
      />
      
      {/* 聊天区域 - 占满剩余空间 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <Suspense fallback={<AgentPageSkeleton />}>
          {sessionId && (
            <AgentChat
              key={sessionId}
              conversationId={currentConversation?.id}
              sessionId={sessionId}
              onConversationCreated={handleCreateConversation}
              onMessagesChange={handleConversationChange}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default function AgentPage() {
  return (
    <div className="h-[calc(100vh-65px)] bg-white overflow-hidden">
      <AgentPageContent />
    </div>
  );
}
