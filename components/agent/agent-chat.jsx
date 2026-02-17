'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Bot,
  Square,
  User,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';

// ============================================================================
// Code Block with Copy Button
// ============================================================================

function CodeBlockWrapper({ children }) {
  const [copied, setCopied] = useState(false);

  // Extract code content and language from children
  const codeElement = children?.props ? children : null;
  const className = codeElement?.props?.className || '';
  const codeContent = codeElement?.props?.children || '';
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : '';
  const codeString = String(codeContent).replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [codeString]);

  return (
    <div className="group relative my-4 first:mt-0 last:mb-0 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="!mt-0 !rounded-t-none bg-zinc-900 text-zinc-100 p-4 overflow-x-auto text-sm">
        <code className="font-mono">{codeContent}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }) {
  return (
    <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[13px] font-mono">
      {children}
    </code>
  );
}

// Markdown components with copy functionality
const markdownComponents = {
  // pre wraps code blocks - we add the copy header here
  pre: CodeBlockWrapper,
  // code is for inline code only (when not inside pre)
  code: ({ inline, children, ...props }) => {
    // If inline prop exists and is true, or if no className (inline detection fallback)
    if (inline) {
      return <InlineCode>{children}</InlineCode>;
    }
    // For code inside pre, just return the code element (pre will handle it)
    return <code {...props}>{children}</code>;
  },
};

// ============================================================================
// Custom ChatTransport for Coze SSE API
// ============================================================================

function createCozeTransport(sessionId) {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      const userText = lastMessage?.parts?.find(p => p.type === 'text')?.text || '';

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, sessionId }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      // Transform Coze SSE format to UIMessageChunk format
      const textId = `text-${Date.now()}`;
      let started = false;

      const transformStream = new TransformStream({
        start() {},
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const blocks = text.split('\n\n');

          for (const block of blocks) {
            if (!block.trim()) continue;

            const dataLines = block
              .split('\n')
              .filter(line => line.startsWith('data:'))
              .map(line => line.slice(5).trim());

            if (dataLines.length === 0) continue;

            try {
              const parsed = JSON.parse(dataLines.join('\n'));

              if (parsed.type === 'answer') {
                const answerText = parsed.content?.answer ?? '';

                if (!started) {
                  started = true;
                  controller.enqueue({ type: 'text-start', id: textId });
                }

                if (answerText) {
                  controller.enqueue({
                    type: 'text-delta',
                    id: textId,
                    delta: answerText,
                  });
                }
              } else if (parsed.type === 'error') {
                controller.enqueue({
                  type: 'error',
                  errorText: parsed.content?.message || 'Unknown error',
                });
              }
            } catch {
              // Ignore non-JSON blocks
            }
          }
        },
        flush(controller) {
          if (started) {
            controller.enqueue({ type: 'text-end', id: textId });
          }
        },
      });

      return response.body.pipeThrough(transformStream);
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatRelativeTime(date) {
  if (!date) return '';
  const timestamp = date instanceof Date ? date.getTime() : date;
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

function MessageActions({ content, onRegenerate, showRegenerate }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [reaction, setReaction] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ description: t.agent.chat.copied });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ description: t.agent.chat.copyFailed, variant: 'destructive' });
    }
  }, [content, toast, t.agent.chat.copied, t.agent.chat.copyFailed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-0.5 mt-2"
    >
      <button
        onClick={() => setReaction(reaction === 'up' ? null : 'up')}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          reaction === 'up'
            ? 'text-emerald-600 bg-emerald-50'
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
        )}
        title="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setReaction(reaction === 'down' ? null : 'down')}
        className={cn(
          'p-1.5 rounded-lg transition-all duration-200',
          reaction === 'down'
            ? 'text-rose-600 bg-rose-50'
            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
        )}
        title="Bad response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all duration-200"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {showRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all duration-200"
          title="Regenerate"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function ChatMessage({ message, isStreaming, isLast, onRegenerate, status }) {
  const isUser = message.role === 'user';
  const { t } = useLanguage();

  // Extract text content from parts
  const textContent = useMemo(() => {
    if (!message.parts) return '';
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  }, [message.parts]);

  const showStreamingIndicator = isStreaming && isLast && message.role === 'assistant';
  const showActions = !isUser && !isStreaming && textContent;
  const showRegenerate = isLast && status === 'ready';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl flex gap-4">
        {/* Avatar */}
        <Avatar className={cn(
          'h-8 w-8 shrink-0 ring-2 ring-offset-2 shadow-sm',
          isUser
            ? 'bg-zinc-200 ring-zinc-200'
            : 'bg-zinc-900 ring-zinc-300'
        )}>
          <AvatarFallback className={cn('bg-transparent', isUser ? 'text-zinc-600' : 'text-white')}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              {isUser ? t.agent.chat.you : t.agent.chat.agentName}
            </span>
            {message.createdAt && (
              <span className="text-xs text-zinc-400">
                {formatRelativeTime(message.createdAt)}
              </span>
            )}
          </div>

          {/* Message Body */}
          <div className="text-[15px] leading-relaxed text-zinc-700">
            {isUser ? (
              <p className="whitespace-pre-wrap">{textContent}</p>
            ) : (
              <div className="prose prose-zinc prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {textContent ? (
                  <ReactMarkdown components={markdownComponents}>{textContent}</ReactMarkdown>
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
        </div>
      </div>
    </motion.div>
  );
}

function WelcomeScreen({ onSuggestionClick }) {
  const { t } = useLanguage();
  const suggestions = [
    { icon: '✨', key: 'chatbot' },
    { icon: '🔧', key: 'optimize' },
    { icon: '💡', key: 'tips' },
    { icon: '📝', key: 'codeReview' },
  ];

  return (
    <div className="flex h-full min-h-full flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center max-w-2xl"
      >
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-zinc-400 rounded-3xl blur-2xl opacity-20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-900 shadow-xl shadow-zinc-900/25">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-zinc-900 mb-1 tracking-tight">
          {t.agent.welcome.title}
        </h1>
        <p className="text-lg text-zinc-500 mb-4">
          {t.agent.welcome.subtitle}
        </p>

        {/* Description */}
        <div className="text-center max-w-md mb-10">
          <p className="text-base text-zinc-500 leading-relaxed">
            {t.agent.welcome.description}
          </p>
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          {suggestions.map((suggestion, index) => {
            const suggestionText = t.agent.welcome.suggestions[suggestion.key];
            return (
              <motion.button
                key={suggestion.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                onClick={() => onSuggestionClick(suggestionText)}
                className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md"
              >
                <span className="text-lg">{suggestion.icon}</span>
                <span className="flex-1 text-sm text-zinc-700">{suggestionText}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function ErrorBanner({ error, onRetry, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mx-4 mb-4"
    >
      <div className="mx-auto max-w-3xl rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
        <p className="flex-1 text-sm text-rose-700">
          {error?.message || 'Something went wrong. Please try again.'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="text-sm font-medium text-rose-600 hover:text-rose-700 px-3 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-rose-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AgentChat() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${generateId()}`);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Create custom transport
  const transport = useMemo(() => createCozeTransport(sessionId), [sessionId]);

  // useChat hook from Vercel AI SDK
  const {
    messages,
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

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Handle send
  const handleSend = useCallback(
    (text) => {
      const content = (text || input).trim();
      if (!content || isStreaming) return;

      sendMessage({ text: content });
      setInput('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    [input, isStreaming, sendMessage]
  );

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    regenerate();
  }, [regenerate]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    clearError();
    regenerate();
  }, [clearError, regenerate]);

  // Handle clear conversation
  const handleClear = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return (
    <div className="flex flex-1 flex-col h-full bg-white overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestionClick={handleSend} />
        ) : (
          <div className="min-h-full">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming}
                  isLast={index === messages.length - 1}
                  onRegenerate={handleRegenerate}
                  status={status}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-32" />
          </div>
        )}
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <ErrorBanner
            error={error}
            onRetry={handleRetry}
            onDismiss={clearError}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-zinc-100 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          {/* Input Container */}
          <div className="relative flex items-end gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-2 shadow-sm transition-all duration-200 focus-within:border-zinc-400 focus-within:bg-white focus-within:shadow-md focus-within:ring-4 focus-within:ring-zinc-100">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.agent.chat.inputPlaceholder}
              rows={1}
              className={cn(
                'flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-zinc-900',
                'placeholder:text-zinc-400',
                'focus:outline-none',
                'disabled:opacity-50'
              )}
              disabled={isStreaming}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 pb-1">
              {isStreaming ? (
                <Button
                  onClick={stop}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-600"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSend()}
                  size="icon"
                  disabled={!input.trim()}
                  className={cn(
                    'h-9 w-9 rounded-xl transition-all duration-200',
                    input.trim()
                      ? 'bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-900/25 text-white'
                      : 'bg-zinc-200 text-zinc-400'
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2.5 px-1">
            <div className="text-xs text-zinc-400">
              {language === 'zh' ? (
                <>
                  按 <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]">Enter</kbd> 发送，<kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]">Shift+Enter</kbd> 换行
                </>
              ) : (
                <>
                  Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
                </>
              )}
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {t.agent.chat.clearConversation}
              </button>
            )}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
