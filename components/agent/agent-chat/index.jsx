'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { createCozeTransport } from './coze-transport';
import { generateId } from './utils';
import { ChatMessage } from './chat-message';
import { WelcomeScreen } from './welcome-screen';
import { ErrorBanner } from './error-banner';
import { StreamLoadingIndicator } from './stream-loading-indicator';
import { ChatInput } from './chat-input';

export default function AgentChat({
  conversationId,
  sessionId: externalSessionId,
  onConversationCreated,
  onMessagesChange,
  onClearConversation,
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const { activeTeamId } = useTeam();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => externalSessionId || `session-${generateId()}`);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const [isSaving, setIsSaving] = useState(false);

  const [toolCallsMap, setToolCallsMap] = useState({});
  const [sourcePrompt, setSourcePrompt] = useState(null);
  const [streamPhase, setStreamPhase] = useState('idle');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hasCreatedConversation = useRef(false);
  const pendingMessages = useRef([]);

  const handleToolCall = useCallback(({ type, toolCall, toolResult }) => {
    if (type === 'request' && toolCall) {
      setToolCallsMap(prev => {
        if (prev[toolCall.id]) return prev;
        return { ...prev, [toolCall.id]: toolCall };
      });
    } else if (type === 'response' && toolResult) {
      setToolCallsMap(prev => {
        const existing = prev[toolResult.id];
        if (existing && existing.status !== 'pending') return prev;
        return { ...prev, [toolResult.id]: { ...existing, ...toolResult } };
      });
    }
  }, []);

  const handleStreamEvent = useCallback(({ type }) => {
    if (type === 'message_start') {
      setStreamPhase('message_start');
    } else if (type === 'content_start') {
      setStreamPhase('content_started');
    } else if (type === 'message_end') {
      setStreamPhase('ended');
    }
  }, []);

  const transport = useMemo(
    () => createCozeTransport(sessionId, handleToolCall, handleStreamEvent),
    [sessionId, handleToolCall, handleStreamEvent]
  );

  const {
    messages: rawMessages,
    sendMessage,
    status,
    stop,
    error,
    clearError,
    regenerate,
    setMessages,
  } = useChat({
    id: sessionId,
    transport,
  });

  const currentToolCalls = useMemo(() => Object.values(toolCallsMap), [toolCallsMap]);
  const isStreaming = status === 'streaming' || status === 'submitted';

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [rawMessages, streamPhase, scrollToBottom]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const saveMessage = useCallback(async (role, content, toolCallsData, toolResultsData) => {
    if (!currentConversationId) return;
    try {
      await apiClient.saveAgentMessage({
        conversationId: currentConversationId,
        role,
        content,
        toolCalls: toolCallsData,
        toolResults: toolResultsData,
      }, { teamId: activeTeamId });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }, [currentConversationId, activeTeamId]);

  const createConversation = useCallback(async (firstMessage) => {
    if (hasCreatedConversation.current) return;
    hasCreatedConversation.current = true;

    try {
      setIsSaving(true);
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      const data = await apiClient.createAgentConversation(
        { sessionId, title },
        { teamId: activeTeamId }
      );

      const newConversation = data.conversation;
      setCurrentConversationId(newConversation.id);
      onConversationCreated?.(newConversation);

      await apiClient.saveAgentMessage({
        conversationId: newConversation.id,
        role: 'user',
        content: firstMessage,
      }, { teamId: activeTeamId });

      for (const msg of pendingMessages.current) {
        await apiClient.saveAgentMessage({
          conversationId: newConversation.id,
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        }, { teamId: activeTeamId });
      }
      pendingMessages.current = [];
    } catch (error) {
      console.error('Failed to create conversation:', error);
      hasCreatedConversation.current = false;
    } finally {
      setIsSaving(false);
    }
  }, [sessionId, activeTeamId, onConversationCreated]);

  useEffect(() => {
    onMessagesChange?.(rawMessages);

    if (currentConversationId && rawMessages.length > 0) {
      const lastMessage = rawMessages[rawMessages.length - 1];
      const textContent = lastMessage?.parts
        ?.filter(p => p.type === 'text')
        .map(p => p.text)
        .join('') || '';

      if (textContent && lastMessage.role) {
        const timeoutId = setTimeout(() => {
          saveMessage(
            lastMessage.role,
            textContent,
            lastMessage.role === 'assistant' ? Object.values(toolCallsMap) : null,
            null
          );
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [rawMessages, currentConversationId, toolCallsMap, onMessagesChange, saveMessage]);

  const handleSend = useCallback(
    (text) => {
      const content = (text || input).trim();
      if (!content || isStreaming) return;

      setStreamPhase('idle');
      setToolCallsMap({});

      if (!currentConversationId && !hasCreatedConversation.current) {
        createConversation(content);
      }

      sendMessage({ text: content });
      setInput('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    [input, isStreaming, currentConversationId, createConversation, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleRegenerate = useCallback(() => {
    setToolCallsMap({});
    setStreamPhase('idle');
    regenerate();
  }, [regenerate]);

  const handleRetry = useCallback(() => {
    setToolCallsMap({});
    setStreamPhase('idle');
    clearError();
    regenerate();
  }, [clearError, regenerate]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setToolCallsMap({});
    setStreamPhase('idle');
    hasCreatedConversation.current = false;
    setCurrentConversationId(null);
    setSourcePrompt(null);
    // 通知父组件清除对话，生成新的 session
    onClearConversation?.();
  }, [setMessages, onClearConversation]);

  const handleEditResend = useCallback((messageIndex, content) => {
    setMessages(prev => prev.slice(0, messageIndex));
    setToolCallsMap({});
    setStreamPhase('idle');
    setTimeout(() => {
      sendMessage({ text: content });
    }, 0);
  }, [setMessages, sendMessage]);

  const handleImportPrompt = useCallback(async ({ title, content, description, tags }) => {
    try {
      await apiClient.createPrompt(
        { title, content, description: description || null, tags: tags || null, version: '1.0.0', is_public: false },
        activeTeamId ? { teamId: activeTeamId } : {}
      );
      toast({
        description: `「${title}」已成功导入提示词库`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Import prompt failed:', error);
      toast({
        variant: 'destructive',
        description: error.message || '导入失败，请重试',
        duration: 3000,
      });
      throw error;
    }
  }, [activeTeamId, toast]);

  const handleUpdatePrompt = useCallback(async (optimizedContent) => {
    if (!sourcePrompt?.id) {
      toast({
        variant: 'destructive',
        description: '未找到原提示词信息',
        duration: 3000,
      });
      return;
    }

    try {
      const { prompt: currentPrompt } = await apiClient.getPrompt(sourcePrompt.id, { teamId: activeTeamId });
      const currentVersion = currentPrompt.version || '1.0.0';
      const versionParts = currentVersion.split('.').map(Number);
      const newVersion = versionParts.length >= 2
        ? `${versionParts[0]}.${versionParts[1] + 1}${versionParts[2] ? '.' + versionParts[2] : ''}`
        : '1.1.0';

      await apiClient.updatePrompt(
        sourcePrompt.id,
        { content: optimizedContent, version: newVersion },
        { teamId: activeTeamId }
      );

      toast({
        description: `「${currentPrompt.title}」已更新至版本 ${newVersion}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Update prompt failed:', error);
      toast({
        variant: 'destructive',
        description: error.message || '更新失败，请重试',
        duration: 3000,
      });
      throw error;
    }
  }, [sourcePrompt, activeTeamId, toast]);

  useEffect(() => {
    if (conversationId) {
      if (conversationId !== currentConversationId || rawMessages.length === 0) {
        setCurrentConversationId(conversationId);
        hasCreatedConversation.current = true;

        const loadConversation = async () => {
          try {
            const data = await apiClient.getAgentConversation(conversationId, { teamId: activeTeamId });
            const { messages: serverMessages } = data.conversation;

            const chatMessages = serverMessages.map((msg, index) => ({
              id: msg.id || `msg-${index}`,
              role: msg.role,
              parts: [{ type: 'text', text: msg.content }],
              createdAt: new Date(msg.createdAt),
            }));

            setMessages(chatMessages);
          } catch (error) {
            console.error('Failed to load conversation:', error);
            toast({
              variant: 'destructive',
              description: '加载对话失败',
            });
          }
        };

        loadConversation();
      }
    }
  }, [conversationId, currentConversationId, activeTeamId, setMessages, toast, rawMessages.length]);

  return (
    <div className="flex flex-1 flex-col h-full bg-white overflow-hidden">
      {rawMessages.length === 0 && streamPhase !== 'message_start' ? (
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <WelcomeScreen onSuggestionClick={handleSend} onSelectPrompt={setSourcePrompt} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            <AnimatePresence mode="popLayout">
              {rawMessages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming}
                  isLast={index === rawMessages.length - 1}
                  onRegenerate={handleRegenerate}
                  status={status}
                  user={user}
                  toolCalls={index === rawMessages.length - 1 && message.role === 'assistant' ? currentToolCalls : []}
                  onImport={handleImportPrompt}
                  onEditResend={handleEditResend}
                  messageIndex={index}
                  onUpdate={sourcePrompt?.id ? handleUpdatePrompt : null}
                  sourcePrompt={sourcePrompt}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {streamPhase === 'message_start' && <StreamLoadingIndicator />}
            </AnimatePresence>

            <div ref={messagesEndRef} className="h-32" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <ErrorBanner
            error={error}
            onRetry={handleRetry}
            onDismiss={clearError}
          />
        )}
      </AnimatePresence>

      <ChatInput
        input={input}
        setInput={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        isStreaming={isStreaming}
        onStop={stop}
        messageCount={rawMessages.length}
        onClear={handleClear}
        textareaRef={textareaRef}
      />

      <Toaster />
    </div>
  );
}
