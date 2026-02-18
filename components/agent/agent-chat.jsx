'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Wrench,
  ChevronDown,
  ChevronRight,
  Clock,
  Terminal,
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

function createCozeTransport(sessionId, onToolCall, onStreamEvent) {
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
      let hasContent = false;
      
      // Track tool calls
      const pendingToolCalls = new Map();

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

              if (parsed.type === 'message_start') {
                // Notify UI that message stream has started
                onStreamEvent?.({ type: 'message_start', data: parsed.content?.message_start });
              } else if (parsed.type === 'answer') {
                const answerText = parsed.content?.answer ?? '';

                if (!started) {
                  started = true;
                  controller.enqueue({ type: 'text-start', id: textId });
                }

                if (answerText) {
                  hasContent = true;
                  // Notify UI that content has started
                  onStreamEvent?.({ type: 'content_start' });
                  controller.enqueue({
                    type: 'text-delta',
                    id: textId,
                    delta: answerText,
                  });
                }
              } else if (parsed.type === 'message_end') {
                // Notify UI that message stream has ended
                onStreamEvent?.({ type: 'message_end' });
              } else if (parsed.type === 'error') {
                controller.enqueue({
                  type: 'error',
                  errorText: parsed.content?.message || 'Unknown error',
                });
              } else if (parsed.type === 'tool_request') {
                // Tool call request - extract from data.content.tool_request
                const toolRequest = parsed.content?.tool_request;
                if (toolRequest) {
                  const toolCallId = toolRequest?.tool_call_id;
                  
                  // Skip if already exists (deduplication)
                  if (pendingToolCalls.has(toolCallId)) {
                    continue;
                  }
                  
                  const toolCall = {
                    id: toolCallId,
                    toolName: toolRequest?.tool_name,
                    parameters: toolRequest?.parameters,
                    isParallel: toolRequest?.is_parallel,
                    index: toolRequest?.index,
                    status: 'pending',
                  };
                  pendingToolCalls.set(toolCall.id, toolCall);
                  
                  // Notify parent component to update UI
                  onToolCall?.({ type: 'request', toolCall });
                }
              } else if (parsed.type === 'tool_response') {
                // Tool call response - extract from data.content.tool_response
                const toolResponse = parsed.content?.tool_response;
                if (toolResponse) {
                  const toolCallId = toolResponse?.tool_call_id;
                  const pendingCall = pendingToolCalls.get(toolCallId);
                  
                  // Skip if already processed (deduplication)
                  if (!pendingCall) {
                    continue;
                  }
                  
                  const toolResult = {
                    id: toolCallId,
                    code: toolResponse?.code,
                    message: toolResponse?.message,
                    result: toolResponse?.result,
                    timeCost: toolResponse?.time_cost_ms,
                    toolName: pendingCall?.toolName || toolResponse?.tool_name,
                    status: String(toolResponse?.code) === '0' ? 'success' : 'error',
                  };
                  
                  pendingToolCalls.delete(toolCallId);
                  
                  // Notify parent component to update UI
                  onToolCall?.({ type: 'response', toolResult });
                }
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

function ToolCallItem({ toolCall, isLast }) {
  
  const [expanded, setExpanded] = useState(false);
  
  const isPending = toolCall.status === 'pending';
  const isSuccess = toolCall.status === 'success';
  const isError = toolCall.status === 'error';
  
  // Format parameters for display
  const paramsText = useMemo(() => {
    if (!toolCall.parameters) return '';
    try {
      return JSON.stringify(toolCall.parameters, null, 2);
    } catch {
      return String(toolCall.parameters);
    }
  }, [toolCall.parameters]);
  
  // Format result for display
  const resultText = useMemo(() => {
    if (!toolCall.result) return '';
    try {
      const parsed = JSON.parse(toolCall.result);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return toolCall.result;
    }
  }, [toolCall.result]);
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-2 last:mb-0"
    >
      <div 
        className={cn(
          'rounded-lg border overflow-hidden transition-all duration-200',
          isPending && 'border-amber-200 bg-amber-50/50',
          isSuccess && 'border-emerald-200 bg-emerald-50/50',
          isError && 'border-rose-200 bg-rose-50/50',
          !isPending && !isSuccess && !isError && 'border-zinc-200 bg-zinc-50'
        )}
      >
        {/* Header - Always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          )}
          
          {/* Status Icon */}
          {isPending ? (
            <div className="relative">
              <Wrench className="h-4 w-4 text-amber-500 animate-pulse" />
              {isLast && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
          ) : isSuccess ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="h-4 w-4 text-emerald-500" />
            </motion.div>
          ) : isError ? (
            <AlertCircle className="h-4 w-4 text-rose-500" />
          ) : (
            <Wrench className="h-4 w-4 text-zinc-500" />
          )}
          
          {/* Tool Name */}
          <span className="text-sm font-medium text-zinc-700">
            {toolCall.toolName || 'Tool'}
          </span>
          
          {/* Status Badge */}
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1',
            isPending && 'text-amber-700 bg-amber-100',
            isSuccess && 'text-emerald-700 bg-emerald-100',
            isError && 'text-rose-700 bg-rose-100'
          )}>
            {isPending && (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" cy="12" r="10" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isPending ? '运行中' : isSuccess ? '成功' : isError ? '失败' : '完成'}
          </span>
        </button>
        
        {/* Progress Bar - Show when pending */}
        {isPending && (
          <div className="px-3 pb-2">
            <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ width: '50%' }}
              />
            </div>
          </div>
        )}
        
        {/* Success Animation Bar */}
        {isSuccess && (
          <motion.div 
            className="px-3 pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
        
        {/* Error Bar */}
        {isError && (
          <div className="px-3 pb-2">
            <div className="h-1.5 w-full bg-rose-500 rounded-full" />
          </div>
        )}
        
        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                {/* Parameters */}
                {paramsText && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                      <Terminal className="h-3 w-3" />
                      <span>参数</span>
                    </div>
                    <pre className="text-xs bg-zinc-900/5 text-zinc-700 p-2 rounded overflow-x-auto">
                      <code>{paramsText}</code>
                    </pre>
                  </div>
                )}
                
                {/* Result */}
                {resultText && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                      <Check className="h-3 w-3" />
                      <span>结果</span>
                    </div>
                    <pre className={cn(
                      'text-xs p-2 rounded overflow-x-auto',
                      isError 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-zinc-900/5 text-zinc-700'
                    )}>
                      <code>{resultText}</code>
                    </pre>
                  </div>
                )}
                
                {/* Error Message */}
                {toolCall.message && isError && (
                  <div className="text-xs text-rose-600">
                    {toolCall.message}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

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

function ChatMessage({ message, isStreaming, isLast, onRegenerate, status, user, toolCalls = [] }) {
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
        <Avatar className={cn(
          'h-8 w-8 shrink-0 ring-2 ring-offset-2 shadow-sm',
          isUser
            ? 'bg-zinc-200 ring-zinc-200'
            : 'bg-zinc-900 ring-zinc-300'
        )}>
          {isUser && user?.imageUrl ? (
            <AvatarImage src={user.imageUrl} alt={user?.fullName || user?.username || 'User'} />
          ) : null}
          <AvatarFallback className={cn('bg-transparent', isUser ? 'text-zinc-600' : 'text-white')}>
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
                  isLast={isLast && index === toolCalls.length - 1 && toolCall.status === 'pending'}
                />
              ))}
            </div>
          )}
          
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
    { icon: '✨', key: 'creativeContent' },
    { icon: '🔧', key: 'codingAssistant' },
    { icon: '📊', key: 'dataAnalysis' },
    { icon: '📚', key: 'onlineEducation' },
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

function StreamLoadingIndicator() {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="group relative px-4 py-6 sm:px-6"
    >
      <div className="mx-auto max-w-3xl flex gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-offset-2 shadow-sm bg-zinc-900 ring-zinc-300">
            <AvatarFallback className="bg-transparent text-white">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full animate-ping bg-zinc-400 opacity-20" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Animated loading card */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 p-4"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            
            <div className="flex items-center gap-3">
              {/* Animated brain/thinking icon */}
              <div className="relative flex-shrink-0">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-lg"
                  animate={{ 
                    boxShadow: [
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5 text-white" />
                  </motion.div>
                </motion.div>
                {/* Orbiting dots */}
                <motion.span
                  className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </div>
              
              {/* Text content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700">{t.agent.chat.thinking}</span>
                  <motion.span 
                    className="flex gap-0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1 h-1 bg-zinc-400 rounded-full"
                        animate={{ 
                          y: [0, -3, 0],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{ 
                          duration: 0.6, 
                          repeat: Infinity, 
                          delay: i * 0.15,
                          ease: 'easeInOut'
                        }}
                      />
                    ))}
                  </motion.span>
                </div>
                
                {/* Animated skeleton lines */}
                <div className="space-y-1.5">
                  <motion.div 
                    className="h-2 bg-zinc-200 rounded-full"
                    animate={{ width: ['60%', '80%', '60%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div 
                    className="h-2 bg-zinc-200 rounded-full"
                    animate={{ width: ['40%', '55%', '40%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
            
            {/* Progress bar at bottom */}
            <div className="mt-3 h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-400 rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ width: '40%' }}
              />
            </div>
          </motion.div>
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
  const { user } = useUser();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${generateId()}`);
  
  // Use ref for tool calls to ensure real-time updates during streaming
  const toolCallsRef = useRef({});
  const [, forceUpdate] = useState({});
  
  // Stream state tracking: 'idle' | 'message_start' | 'content_started' | 'ended'
  const [streamPhase, setStreamPhase] = useState('idle');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Handle tool call updates from transport - synchronous update
  const handleToolCall = useCallback(({ type, toolCall, toolResult }) => {
    if (type === 'request' && toolCall) {
      // Check if already exists
      if (toolCallsRef.current[toolCall.id]) {
        return;
      }
      toolCallsRef.current = {
        ...toolCallsRef.current,
        [toolCall.id]: toolCall,
      };
      // Force immediate re-render
      forceUpdate({});
    } else if (type === 'response' && toolResult) {
      const existing = toolCallsRef.current[toolResult.id];
      // Skip if already completed
      if (existing && existing.status !== 'pending') {
        return;
      }
      toolCallsRef.current = {
        ...toolCallsRef.current,
        [toolResult.id]: { ...existing, ...toolResult },
      };
      // Force immediate re-render
      forceUpdate({});
    }
  }, []);
  
  // Handle stream events from transport
  const handleStreamEvent = useCallback(({ type }) => {
    if (type === 'message_start') {
      setStreamPhase('message_start');
    } else if (type === 'content_start') {
      setStreamPhase('content_started');
    } else if (type === 'message_end') {
      setStreamPhase('ended');
    }
  }, []);

  // Create custom transport with tool call handler and stream event handler
  const transport = useMemo(
    () => createCozeTransport(sessionId, handleToolCall, handleStreamEvent), 
    [sessionId, handleToolCall, handleStreamEvent]
  );

  // useChat hook from Vercel AI SDK
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
  
  // Get current tool calls array for the latest assistant message
  const currentToolCalls = useMemo(() => {
    return Object.values(toolCallsRef.current);
  }, [toolCallsRef.current]);

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [rawMessages, streamPhase, scrollToBottom]);

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

      // Reset stream phase and tool calls for new message
      setStreamPhase('idle');
      toolCallsRef.current = {};
      
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
    toolCallsRef.current = {};
    setStreamPhase('idle');
    forceUpdate({});
  }, [setMessages]);

  return (
    <div className="flex flex-1 flex-col h-full bg-white overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {rawMessages.length === 0 && streamPhase !== 'message_start' ? (
          <WelcomeScreen onSuggestionClick={handleSend} />
        ) : (
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
                />
              ))}
            </AnimatePresence>
            
            {/* Loading indicator when message_start received but no content yet */}
            <AnimatePresence>
              {streamPhase === 'message_start' && (
                <StreamLoadingIndicator />
              )}
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
            {rawMessages.length > 0 && (
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
