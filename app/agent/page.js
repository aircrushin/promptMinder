'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateViewport = (event) => {
      const mobile = event.matches;
      setIsMobileView(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    updateViewport(mediaQuery);
    mediaQuery.addEventListener('change', updateViewport);

    return () => {
      mediaQuery.removeEventListener('change', updateViewport);
    };
  }, []);

  const handleSelectConversation = useCallback((conversation) => {
    if (conversation) {
      setCurrentConversation(conversation);
      setSessionId(conversation.sessionId);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } else {
      generateNewSession();
    }
  }, [generateNewSession]);

  const handleCreateConversation = useCallback((conversation) => {
    setCurrentConversation(conversation);
    setSessionId(conversation.sessionId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleConversationChange = useCallback(() => {
    if (typeof window !== 'undefined' && window.refreshConversationSidebar) {
      window.refreshConversationSidebar();
    }
  }, []);

  const handleClearConversation = useCallback(() => {
    // 清除当前对话状态，生成新的 session
    setCurrentConversation(null);
    generateNewSession();
  }, [generateNewSession]);

  if (!isLoaded || !user) {
    return <AgentPageSkeleton />;
  }

  return (
    <div className="relative flex h-full w-full overflow-hidden">
      {isSidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close conversation history"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`absolute inset-y-0 left-0 z-40 w-72 max-w-[85vw] transition-transform duration-200 lg:relative lg:z-auto lg:w-64 lg:max-w-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <ConversationSidebar
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
          onConversationChange={handleConversationChange}
          isMobile={isMobileView}
          onRequestClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 px-3 py-2.5 backdrop-blur lg:hidden">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Open conversation history"
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <p className="text-sm font-medium text-zinc-700">Agent</p>
          <div className="h-9 w-9" />
        </div>

        <Suspense fallback={<AgentPageSkeleton />}>
          {sessionId && (
            <AgentChat
              key={sessionId}
              conversationId={currentConversation?.id}
              sessionId={sessionId}
              onConversationCreated={handleCreateConversation}
              onMessagesChange={handleConversationChange}
              onClearConversation={handleClearConversation}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

export default function AgentPage() {
  return (
    <div className="h-[calc(100dvh-65px)] overflow-hidden bg-white md:h-[calc(100vh-65px)]">
      <AgentPageContent />
    </div>
  );
}
