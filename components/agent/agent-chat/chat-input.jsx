'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Square } from 'lucide-react';

export function ChatInput({
  input,
  setInput,
  onSend,
  onKeyDown,
  isStreaming,
  onStop,
  messageCount,
  onClear,
  textareaRef,
}) {
  const { t, language } = useLanguage();

  return (
    <div className="border-t border-zinc-100 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-1.5 shadow-sm transition-all duration-200 focus-within:border-zinc-400 focus-within:bg-white focus-within:shadow-md focus-within:ring-4 focus-within:ring-zinc-100 sm:gap-3 sm:p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.agent.chat.inputPlaceholder}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-2.5 py-2 text-[14px] text-zinc-900 sm:px-3 sm:py-2.5 sm:text-[15px]',
              'placeholder:text-zinc-400',
              'focus:outline-none',
              'disabled:opacity-50'
            )}
            disabled={isStreaming}
          />

          <div className="flex items-center gap-1.5 pb-0.5 sm:pb-1">
            {isStreaming ? (
              <Button
                onClick={onStop}
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-zinc-200 text-zinc-600 hover:bg-zinc-300 sm:h-9 sm:w-9"
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            ) : (
              <Button
                onClick={() => onSend()}
                size="icon"
                disabled={!input.trim()}
                className={cn(
                  'h-10 w-10 rounded-xl transition-all duration-200 sm:h-9 sm:w-9',
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

        <div className="mt-2 flex items-start justify-between gap-3 px-1 sm:mt-2.5 sm:items-center">
          <div className="hidden text-xs text-zinc-400 sm:block">
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
          {messageCount > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-600"
            >
              {t.agent.chat.clearConversation}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
