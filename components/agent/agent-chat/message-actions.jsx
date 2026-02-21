'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, RotateCcw, ThumbsDown, ThumbsUp, Pencil, ChevronRight, AlertCircle, Terminal, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function ToolCallItem({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  const isPending = toolCall.status === 'pending';
  const isSuccess = toolCall.status === 'success';
  const isError = toolCall.status === 'error';

  const paramsText = useMemo(() => {
    if (!toolCall.parameters) return '';
    try {
      return JSON.stringify(toolCall.parameters, null, 2);
    } catch {
      return String(toolCall.parameters);
    }
  }, [toolCall.parameters]);

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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="mb-1.5 last:mb-0"
    >
      <div
        className={cn(
          'rounded-lg border overflow-hidden transition-colors duration-300',
          isPending && 'border-zinc-200 bg-zinc-50/80',
          isSuccess && 'border-emerald-100 bg-emerald-50/50',
          isError && 'border-rose-100 bg-rose-50/50',
          !isPending && !isSuccess && !isError && 'border-zinc-200 bg-zinc-50'
        )}
      >
        {/* Main row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
        >
          {/* Status indicator */}
          <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isPending ? (
              <svg className="h-4 w-4 text-zinc-400 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" className="opacity-25" />
                <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : isSuccess ? (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </motion.div>
            ) : isError ? (
              <div className="w-4 h-4 rounded-full bg-rose-400 flex items-center justify-center">
                <AlertCircle className="h-2.5 w-2.5 text-white" />
              </div>
            ) : (
              <Wrench className="h-4 w-4 text-zinc-400" />
            )}
          </div>

          {/* Tool name */}
          <span className={cn(
            'flex-1 text-[13px] font-mono truncate',
            isPending && 'text-zinc-500',
            isSuccess && 'text-zinc-600',
            isError && 'text-rose-500'
          )}>
            {toolCall.toolName || 'tool'}
          </span>

          {/* Right-side meta */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {isPending && (
              <span className="text-[11px] text-zinc-400 select-none">运行中</span>
            )}
            {isError && (
              <span className="text-[11px] text-rose-400">失败</span>
            )}
            <ChevronRight
              className={cn(
                'h-3 w-3 text-zinc-300 transition-transform duration-200 flex-shrink-0',
                expanded && 'rotate-90'
              )}
            />
          </div>
        </button>

        {/* Expanded detail panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-zinc-100 px-3 py-3 space-y-3">
                {paramsText && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                      <Terminal className="h-3 w-3" />
                      <span>输入参数</span>
                    </div>
                    <pre className="text-xs bg-zinc-900/[0.04] border border-zinc-100 text-zinc-600 px-3 py-2 rounded-md overflow-x-auto leading-relaxed">
                      <code>{paramsText}</code>
                    </pre>
                  </div>
                )}

                {resultText && (
                  <div>
                    <div className={cn(
                      'flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider mb-1.5',
                      isError ? 'text-rose-400' : 'text-zinc-400'
                    )}>
                      <Check className="h-3 w-3" />
                      <span>输出结果</span>
                    </div>
                    <pre className={cn(
                      'text-xs px-3 py-2 rounded-md overflow-x-auto leading-relaxed border',
                      isError
                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                        : 'bg-zinc-900/[0.04] border-zinc-100 text-zinc-600'
                    )}>
                      <code>{resultText}</code>
                    </pre>
                  </div>
                )}

                {toolCall.message && isError && (
                  <p className="text-xs text-rose-500">{toolCall.message}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function UserMessageActions({ content, onEditResend }) {
  const { toast } = useToast();
  const { t } = useLanguage();
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
        onClick={handleCopy}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all duration-200"
        title={t.agent.chat.copy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={onEditResend}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all duration-200"
        title={t.agent.chat.editResend}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function MessageActions({ content, onRegenerate, showRegenerate }) {
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
