'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Bot,
  Loader2,
  Square,
  User,
  Sparkles,
} from 'lucide-react';

function formatRelativeTime(timestamp) {
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

function MessageReactions({ content }) {
  const { toast } = useToast();
  const [reaction, setReaction] = useState(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ description: 'Copied to clipboard' });
    } catch {
      toast({ description: 'Failed to copy', variant: 'destructive' });
    }
  }, [content, toast]);

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <button
        onClick={() => setReaction(reaction === 'up' ? null : 'up')}
        className={cn(
          'p-1 rounded-md transition-colors',
          reaction === 'up'
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
        )}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setReaction(reaction === 'down' ? null : 'down')}
        className={cn(
          'p-1 rounded-md transition-colors',
          reaction === 'down'
            ? 'text-destructive bg-destructive/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
        )}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={handleCopy}
        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex gap-3 px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <Avatar className={cn('h-8 w-8 shrink-0', isUser ? 'bg-gray-200' : 'bg-primary/10')}>
        <AvatarFallback className={cn(isUser ? 'bg-gray-200 text-gray-600' : 'bg-primary/10 text-primary')}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col max-w-[75%]', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? 'Me' : 'Prompt Agent'}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-gray-100 text-foreground'
              : 'bg-white border border-gray-100 shadow-sm text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content || ''}</ReactMarkdown>
              {isStreaming && !message.content && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Thinking...
                </span>
              )}
              {isStreaming && message.content && (
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
              )}
            </div>
          )}
        </div>

        {!isUser && !isStreaming && message.content && (
          <MessageReactions content={message.content} />
        )}
      </div>
    </motion.div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Prompt Agent</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          I can help you create, optimize, and refine AI prompts. Ask me anything about prompt engineering!
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            'Help me write a chatbot prompt',
            'Optimize my existing prompt',
            'Explain prompt engineering tips',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              data-suggestion={suggestion}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function DateSeparator() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="rounded-full bg-gray-100 px-3 py-1 text-xs text-muted-foreground font-medium">
        TODAY
      </div>
    </div>
  );
}

export default function AgentChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const content = (text || input).trim();
      if (!content || isStreaming) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const agentMessageId = `agent-${Date.now()}`;
      const agentMessage = {
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage, agentMessage]);
      setInput('');
      setIsStreaming(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content, sessionId }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            const dataLines = block
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim());
            if (dataLines.length === 0) continue;

            try {
              const parsed = JSON.parse(dataLines.join('\n'));
              if (parsed.type === 'answer') {
                const chunk = parsed.content?.answer ?? '';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === agentMessageId
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  )
                );
              } else if (parsed.type === 'error') {
                console.error('LangGraph stream error:', parsed.content);
              }
            } catch {
              // ignore non-JSON blocks
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sending message:', error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === agentMessageId
                ? { ...msg, content: 'Sorry, something went wrong. Please try again.' }
                : msg
            )
          );
          toast({
            title: 'Connection Error',
            description: error.message || 'Failed to connect to the agent.',
            variant: 'destructive',
          });
        }
      } finally {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    },
    [input, isStreaming, sessionId, toast]
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

  const handleSuggestionClick = useCallback(
    (e) => {
      const suggestion = e.target.closest('[data-suggestion]')?.dataset?.suggestion;
      if (suggestion) {
        handleSend(suggestion);
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden" onClick={handleSuggestionClick}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="mx-auto max-w-3xl py-4 space-y-4">
            <DateSeparator />
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isStreaming && message.role === 'agent' && message.id === messages[messages.length - 1]?.id}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-4 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm',
                'placeholder:text-muted-foreground/60',
                'focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/20',
                'transition-colors'
              )}
              disabled={isStreaming}
            />
          </div>
          {isStreaming ? (
            <Button
              onClick={handleStop}
              size="icon"
              variant="outline"
              className="h-10 w-10 shrink-0 rounded-xl border-gray-200"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSend()}
              size="icon"
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground/50">
          Prompt Agent may produce inaccurate information. Verify important details.
        </p>
      </div>

      <Toaster />
    </div>
  );
}
