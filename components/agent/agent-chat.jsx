'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  ChevronRight,
  Terminal,
  Download,
  Loader2,
  X,
  Tag,
  Pencil,
} from 'lucide-react';

// ============================================================================
// Import Prompt Dialog — tags + AI-generated title & description
// ============================================================================

function ImportPromptDialog({ open, onOpenChange, codeContent, onConfirm }) {
  const { activeTeamId } = useTeam();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const codeString = String(codeContent || '').replace(/\n$/, '');

  useEffect(() => {
    if (!open) return;

    setSelectedTags([]);
    setTagInput('');
    setTitle('');
    setDescription('');

    // Fetch available tags
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {});
        const teamTags = Array.isArray(data?.team) ? data.team : [];
        const personalTags = Array.isArray(data?.personal) ? data.personal : [];
        const fallback = Array.isArray(data) ? data : [];
        const combined = teamTags.length || personalTags.length
          ? [...teamTags, ...personalTags]
          : fallback;
        setAvailableTags(Array.from(new Map(combined.map(t => [t.name, t])).values()));
      } catch {
        // ignore tag fetch errors
      }
    };

    // AI-generate title + description
    const generateMeta = async () => {
      setIsSummarizing(true);
      try {
        const res = await fetch('/api/generate/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: codeString }),
        });
        if (!res.ok) throw new Error('meta api failed');
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
      } catch {
        const firstLine = codeString.split('\n').find(l => l.trim()) || '';
        setTitle(firstLine.slice(0, 60) || '优化后的提示词');
      } finally {
        setIsSummarizing(false);
      }
    };

    fetchTags();
    generateMeta();
  }, [open, activeTeamId, codeString]);

  const addTag = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    setSelectedTags(prev => [...prev, trimmed]);
    setTagInput('');
  }, [selectedTags]);

  const removeTag = useCallback((name) => {
    setSelectedTags(prev => prev.filter(t => t !== name));
  }, []);

  const handleTagKeyDown = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }, [tagInput, selectedTags, addTag, removeTag]);

  const handleConfirm = useCallback(async () => {
    if (!title.trim() || isImporting) return;
    setIsImporting(true);
    try {
      await onConfirm({
        title: title.trim(),
        content: codeString,
        description: description.trim(),
        tags: selectedTags.join(','),
      });
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  }, [title, description, selectedTags, codeString, onConfirm, onOpenChange, isImporting]);

  const suggestions = useMemo(() =>
    availableTags.filter(t =>
      !selectedTags.includes(t.name) &&
      (tagInput ? t.name.toLowerCase().includes(tagInput.toLowerCase()) : true)
    ).slice(0, 14),
    [availableTags, selectedTags, tagInput]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-emerald-600" />
            导入提示词
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">标题</label>
              {isSummarizing && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
                  AI 生成中...
                </span>
              )}
            </div>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isSummarizing ? 'AI 正在生成标题...' : '为这个提示词起个名字'}
              disabled={isSummarizing}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">描述</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isSummarizing ? 'AI 正在生成描述...' : '简短描述这个提示词的用途（选填）'}
              disabled={isSummarizing}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Tag className="h-3.5 w-3.5 text-zinc-400" />
              标签
            </label>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-emerald-900 transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="输入标签名，按 Enter 或 , 添加自定义标签"
              className="text-sm"
            />

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-400">点击添加已有标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(tag => (
                    <button
                      key={tag.id || tag.name}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-xs hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content preview */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">内容预览</label>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {codeString.slice(0, 400)}{codeString.length > 400 ? '\n...' : ''}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!title.trim() || isImporting || isSummarizing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                确认导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Code Block with Copy + Import Button
// ============================================================================

function CodeBlockWrapper({ children, onImport }) {
  const [copied, setCopied] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

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
    <>
      <div className="group relative my-4 first:mt-0 last:mb-0 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            {language || 'code'}
          </span>
          <div className="flex items-center gap-3">
            {onImport && (
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>导入</span>
              </button>
            )}
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
        </div>
        <pre className="!mt-0 !rounded-t-none bg-zinc-900 text-zinc-100 p-4 overflow-x-auto text-sm">
          <code className="font-mono">{codeContent}</code>
        </pre>
      </div>

      {onImport && (
        <ImportPromptDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          codeContent={codeContent}
          onConfirm={onImport}
        />
      )}
    </>
  );
}

function InlineCode({ children }) {
  return (
    <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[13px] font-mono">
      {children}
    </code>
  );
}

// Factory that creates markdown components with an optional import callback
function createMarkdownComponents(onImport) {
  return {
    pre: ({ children }) => <CodeBlockWrapper onImport={onImport}>{children}</CodeBlockWrapper>,
    code: ({ inline, children, ...props }) => {
      if (inline) {
        return <InlineCode>{children}</InlineCode>;
      }
      return <code {...props}>{children}</code>;
    },
    table: ({ children }) => (
      <div className="my-4 w-full overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
        <table className="w-full border-collapse text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-zinc-50 border-b border-zinc-200">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-zinc-100">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="transition-colors hover:bg-zinc-50/70">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-zinc-700 align-top">
        {children}
      </td>
    ),
  };
}

// ============================================================================
// Custom ChatTransport for Coze SSE API
// ============================================================================

function createCozeTransport(sessionId, onToolCall, onStreamEvent) {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
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

      const textId = `text-${Date.now()}`;
      let started = false;
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
                onStreamEvent?.({ type: 'message_start', data: parsed.content?.message_start });
              } else if (parsed.type === 'answer') {
                const answerText = parsed.content?.answer ?? '';

                if (!started) {
                  started = true;
                  controller.enqueue({ type: 'text-start', id: textId });
                }

                if (answerText) {
                  onStreamEvent?.({ type: 'content_start' });
                  controller.enqueue({
                    type: 'text-delta',
                    id: textId,
                    delta: answerText,
                  });
                }
              } else if (parsed.type === 'message_end') {
                onStreamEvent?.({ type: 'message_end' });
              } else if (parsed.type === 'error') {
                controller.enqueue({
                  type: 'error',
                  errorText: parsed.content?.message || 'Unknown error',
                });
              } else if (parsed.type === 'tool_request') {
                const toolRequest = parsed.content?.tool_request;
                if (toolRequest) {
                  const toolCallId = toolRequest?.tool_call_id;
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
                  onToolCall?.({ type: 'request', toolCall });
                }
              } else if (parsed.type === 'tool_response') {
                const toolResponse = parsed.content?.tool_response;
                if (toolResponse) {
                  const toolCallId = toolResponse?.tool_call_id;
                  const pendingCall = pendingToolCalls.get(toolCallId);
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

function ToolCallItem({ toolCall }) {
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
            {/* {isSuccess && toolCall.timeCost !== undefined && (
              <span className="text-[11px] text-zinc-400 tabular-nums flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {toolCall.timeCost}ms
              </span>
            )} */}
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

function UserMessageActions({ content, onEditResend }) {
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

function ChatMessage({ message, isStreaming, isLast, onRegenerate, status, user, toolCalls = [], onImport, onEditResend, messageIndex }) {
  const isUser = message.role === 'user';
  const { t } = useLanguage();

  const textContent = useMemo(() => {
    if (!message.parts) return '';
    return message.parts
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('');
  }, [message.parts]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(isUser ? null : onImport),
    [isUser, onImport]
  );

  const showStreamingIndicator = isStreaming && isLast && message.role === 'assistant';
  const showActions = !isUser && !isStreaming && textContent;
  const showUserActions = isUser && textContent && !isStreaming;
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
              onEditResend={() => onEditResend?.(messageIndex, textContent)}
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
          <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl shadow-slate-900/25 ring-1 ring-amber-500/30 overflow-hidden">
            <img 
              src="/decant-logo.svg" 
              alt="Decant" 
              className="h-16 w-16 object-contain"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900 mb-1 tracking-tight">
          {t.agent.welcome.title}
        </h1>
        <p className="text-lg text-zinc-500 mb-4">
          {t.agent.welcome.subtitle}
        </p>

        <div className="text-center max-w-md mb-10">
          <p className="text-base text-zinc-500 leading-relaxed">
            {t.agent.welcome.description}
          </p>
        </div>

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
          <span className="absolute inset-0 rounded-full animate-ping bg-zinc-400 opacity-20" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200 p-4"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />

            <div className="flex items-center gap-3">
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
                    className="flex items-center justify-center"
                  >
                    <img 
                      src="/decant-logo.svg" 
                      alt="Decant" 
                      className="h-5 w-5 object-contain"
                    />
                  </motion.div>
                </motion.div>
                <motion.span
                  className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </div>

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
                        animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      />
                    ))}
                  </motion.span>
                </div>

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

            <div className="mt-3 h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-400 rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
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
  const { activeTeamId } = useTeam();
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => `session-${generateId()}`);

  const [toolCallsMap, setToolCallsMap] = useState({});

  // Stream state tracking: 'idle' | 'message_start' | 'content_started' | 'ended'
  const [streamPhase, setStreamPhase] = useState('idle');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

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

  const currentToolCalls = useMemo(() => {
    return Object.values(toolCallsMap);
  }, [toolCallsMap]);

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

  const handleSend = useCallback(
    (text) => {
      const content = (text || input).trim();
      if (!content || isStreaming) return;

      setStreamPhase('idle');
      setToolCallsMap({});

      sendMessage({ text: content });
      setInput('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    [input, isStreaming, sendMessage]
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
  }, [setMessages]);

  const handleEditResend = useCallback((messageIndex, content) => {
    setMessages(prev => prev.slice(0, messageIndex));
    setToolCallsMap({});
    setStreamPhase('idle');
    setInput(content);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [setMessages]);

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
                  onImport={handleImportPrompt}
                  onEditResend={handleEditResend}
                  messageIndex={index}
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
