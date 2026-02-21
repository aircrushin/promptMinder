'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { formatRelativeTime } from './utils';
import { createMarkdownComponents } from './markdown-code-block';
import { ToolCallItem, UserMessageActions, MessageActions } from './message-actions';

export function ChatMessage({
  message,
  isStreaming,
  isLast,
  onRegenerate,
  status,
  user,
  toolCalls = [],
  onImport,
  onEditResend,
  messageIndex,
  onUpdate,
  sourcePrompt,
}) {
  const isUser = message.role === 'user';
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const editTextareaRef = useRef(null);

  const textContent = useMemo(() => {
    if (!message.parts) return '';
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  }, [message.parts]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(isUser ? null : onImport, isUser ? null : onUpdate, sourcePrompt),
    [isUser, onImport, onUpdate, sourcePrompt]
  );

  // Auto-resize the inline edit textarea
  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [isEditing, editValue]);

  const handleStartEdit = useCallback(() => {
    setEditValue(textContent);
    setIsEditing(true);
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
        const len = editTextareaRef.current.value.length;
        editTextareaRef.current.setSelectionRange(len, len);
      }
    }, 0);
  }, [textContent]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const handleConfirmEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    setIsEditing(false);
    setEditValue('');
    onEditResend?.(messageIndex, trimmed);
  }, [editValue, messageIndex, onEditResend]);

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleConfirmEdit, handleCancelEdit]);

  const showStreamingIndicator = isStreaming && isLast && message.role === 'assistant';
  const showActions = !isUser && !isStreaming && textContent;
  const showUserActions = isUser && textContent && !isStreaming && !isEditing;
  const showRegenerate = isLast && status === 'ready';
  const showToolCalls = toolCalls.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl flex gap-4">
        {/* Avatar */}
        <Avatar
          className={cn(
            'h-8 w-8 shrink-0 ring-2 ring-offset-2 shadow-sm overflow-hidden',
            isUser ? 'bg-zinc-200 ring-zinc-200' : 'bg-zinc-900 ring-zinc-300'
          )}
        >
          {isUser && user?.imageUrl ? (
            <AvatarImage
              src={user.imageUrl}
              alt={user?.fullName || user?.username || 'User'}
            />
          ) : null}
          {!isUser && (
            <AvatarImage
              src="/decant-logo.svg"
              alt="Decant"
              className="object-contain"
            />
          )}
          <AvatarFallback
            className={cn('bg-transparent', isUser ? 'text-zinc-600' : 'text-white')}
          >
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              {isUser ? (user?.fullName || user?.username || t.agent.chat.you) : t.agent.chat.agentName}
            </span>
            {message.createdAt && (
              <span className="text-xs text-zinc-400">
                {formatRelativeTime(message.createdAt)}
              </span>
            )}
          </div>

          {/* Tool Calls */}
          {showToolCalls && (
            <div className="mb-3">
              {toolCalls.map((toolCall, index) => (
                <ToolCallItem
                  key={toolCall.id || index}
                  toolCall={toolCall}
                />
              ))}
            </div>
          )}

          {/* Message Body */}
          <div className="text-[15px] leading-relaxed text-zinc-700">
            {isUser ? (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={editTextareaRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={1}
                    className={cn(
                      'w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5',
                      'text-[15px] text-zinc-900 leading-relaxed',
                      'focus:outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200',
                      'min-h-[42px] overflow-hidden'
                    )}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      {t.agent.chat.cancelEdit}
                    </button>
                    <button
                      onClick={handleConfirmEdit}
                      disabled={!editValue.trim()}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-lg font-medium transition-colors',
                        editValue.trim()
                          ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                          : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      )}
                    >
                      {t.agent.chat.confirmResend}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{textContent}</p>
              )
            ) : (
              <div className="prose prose-zinc prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {textContent ? (
                  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                    {textContent}
                  </ReactMarkdown>
                ) : showStreamingIndicator ? (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm">{t.agent.chat.thinking}</span>
                  </div>
                ) : null}
                {showStreamingIndicator && textContent && (
                  <span className="inline-block w-0.5 h-5 bg-zinc-800 animate-pulse ml-0.5 align-text-bottom rounded-full" />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <MessageActions
              content={textContent}
              onRegenerate={onRegenerate}
              showRegenerate={showRegenerate}
            />
          )}
          {showUserActions && (
            <UserMessageActions
              content={textContent}
              onEditResend={handleStartEdit}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
