'use client';

import { useState, useCallback } from 'react';
import { Check, Copy, Download, Loader2, RefreshCw } from 'lucide-react';
import { ImportPromptDialog } from './import-prompt-dialog';

function InlineCode({ children }) {
  return (
    <code className="text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded text-[13px] font-mono">
      {children}
    </code>
  );
}

export function CodeBlockWrapper({ children, onImport, onUpdate, sourcePrompt }) {
  const [copied, setCopied] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdate = useCallback(async () => {
    if (!onUpdate || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdate(codeString);
    } finally {
      setIsUpdating(false);
    }
  }, [onUpdate, codeString, isUpdating]);

  const showUpdateButton = onUpdate && sourcePrompt?.id;

  return (
    <>
      <div className="group relative my-4 first:mt-0 last:mb-0 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            {language || 'code'}
          </span>
          <div className="flex items-center gap-3">
            {showUpdateButton && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>更新</span>
              </button>
            )}
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

export function createMarkdownComponents(onImport, onUpdate, sourcePrompt) {
  return {
    pre: ({ children }) => (
      <CodeBlockWrapper onImport={onImport} onUpdate={onUpdate} sourcePrompt={sourcePrompt}>
        {children}
      </CodeBlockWrapper>
    ),
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
