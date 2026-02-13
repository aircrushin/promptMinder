'use client';
import { useMemo, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { diffLines } from 'diff';

export default function PromptDiffViewer({ oldContent = '', newContent = '', t }) {
  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const isScrollingRef = useRef(false);

  // 计算差异
  const diffResult = useMemo(() => {
    if (!oldContent && !newContent) {
      return { chunks: [], hasChanges: false };
    }

    const changes = diffLines(oldContent || '', newContent || '');
    const chunks = [];
    let leftLineNumber = 1;
    let rightLineNumber = 1;

    changes.forEach((change, index) => {
      const lines = change.value.split('\n');
      // 移除最后一个空行（如果存在）
      if (lines[lines.length - 1] === '') {
        lines.pop();
      }

      if (change.added) {
        // 新增的行
        lines.forEach((line, lineIndex) => {
          chunks.push({
            type: 'added',
            leftLine: null,
            rightLine: rightLineNumber++,
            leftContent: null,
            rightContent: line,
            key: `added-${index}-${lineIndex}`
          });
        });
      } else if (change.removed) {
        // 删除的行
        lines.forEach((line, lineIndex) => {
          chunks.push({
            type: 'removed',
            leftLine: leftLineNumber++,
            rightLine: null,
            leftContent: line,
            rightContent: null,
            key: `removed-${index}-${lineIndex}`
          });
        });
      } else {
        // 未变化的行
        lines.forEach((line, lineIndex) => {
          chunks.push({
            type: 'unchanged',
            leftLine: leftLineNumber++,
            rightLine: rightLineNumber++,
            leftContent: line,
            rightContent: line,
            key: `unchanged-${index}-${lineIndex}`
          });
        });
      }
    });

    const hasChanges = chunks.some(chunk => chunk.type !== 'unchanged');
    return { chunks, hasChanges };
  }, [oldContent, newContent]);

  // 同步滚动
  useEffect(() => {
    const leftContainer = leftScrollRef.current;
    const rightContainer = rightScrollRef.current;

    if (!leftContainer || !rightContainer) return;

    let leftViewport = null;
    let rightViewport = null;
    let handleLeftScroll = null;
    let handleRightScroll = null;

    // 等待 DOM 渲染完成
    const timer = setTimeout(() => {
      leftViewport = leftContainer.querySelector('[data-radix-scroll-area-viewport]');
      rightViewport = rightContainer.querySelector('[data-radix-scroll-area-viewport]');

      if (!leftViewport || !rightViewport) return;

      handleLeftScroll = () => {
        if (isScrollingRef.current) return;
        isScrollingRef.current = true;
        rightViewport.scrollTop = leftViewport.scrollTop;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 50);
      };

      handleRightScroll = () => {
        if (isScrollingRef.current) return;
        isScrollingRef.current = true;
        leftViewport.scrollTop = rightViewport.scrollTop;
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 50);
      };

      leftViewport.addEventListener('scroll', handleLeftScroll);
      rightViewport.addEventListener('scroll', handleRightScroll);
    }, 100);

    return () => {
      clearTimeout(timer);
      // 清理滚动监听器
      if (leftViewport && handleLeftScroll) {
        leftViewport.removeEventListener('scroll', handleLeftScroll);
      }
      if (rightViewport && handleRightScroll) {
        rightViewport.removeEventListener('scroll', handleRightScroll);
      }
    };
  }, [oldContent, newContent]);

  const getLineClassName = (type) => {
    const baseClass = 'px-4 py-1 min-h-[1.5rem] whitespace-pre-wrap break-words';
    switch (type) {
      case 'added':
        return `${baseClass} bg-green-500/20 dark:bg-green-500/10`;
      case 'removed':
        return `${baseClass} bg-red-500/20 dark:bg-red-500/10`;
      case 'unchanged':
        return `${baseClass} text-foreground`;
      default:
        return baseClass;
    }
  };

  const getLineNumberClassName = (type) => {
    const baseClass = 'inline-block w-12 text-right pr-4 text-xs text-muted-foreground select-none';
    switch (type) {
      case 'added':
        return `${baseClass} bg-green-500/20 dark:bg-green-500/10`;
      case 'removed':
        return `${baseClass} bg-red-500/20 dark:bg-red-500/10`;
      default:
        return baseClass;
    }
  };

  const noChangesText = t?.promptDiffPage?.noChanges || '两个版本内容完全相同';
  const oldVersionLabel = t?.promptDiffPage?.oldVersionLabel || '旧版本';
  const newVersionLabel = t?.promptDiffPage?.newVersionLabel || '新版本';

  if (!diffResult.hasChanges && oldContent === newContent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{noChangesText}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      {/* 左侧：旧版本 */}
      <div className="flex-1 flex flex-col border-r">
        <div className="bg-muted/50 px-4 py-2 border-b text-sm font-medium">
          {oldVersionLabel}
        </div>
        <ScrollArea ref={leftScrollRef} className="flex-1">
          <div className="font-mono text-sm">
            {diffResult.chunks.map((chunk) => {
              if (chunk.leftContent === null) {
                return (
                  <div
                    key={chunk.key}
                    className={getLineClassName('unchanged')}
                    style={{ minHeight: '1.5rem' }}
                  >
                    <span className={getLineNumberClassName('unchanged')}></span>
                  </div>
                );
              }
              return (
                <div key={chunk.key} className={getLineClassName(chunk.type)}>
                  <span className={getLineNumberClassName(chunk.type)}>
                    {chunk.leftLine}
                  </span>
                  <span>{chunk.leftContent}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧：新版本 */}
      <div className="flex-1 flex flex-col">
        <div className="bg-muted/50 px-4 py-2 border-b text-sm font-medium">
          {newVersionLabel}
        </div>
        <ScrollArea ref={rightScrollRef} className="flex-1">
          <div className="font-mono text-sm">
            {diffResult.chunks.map((chunk) => {
              if (chunk.rightContent === null) {
                return (
                  <div
                    key={chunk.key}
                    className={getLineClassName('unchanged')}
                    style={{ minHeight: '1.5rem' }}
                  >
                    <span className={getLineNumberClassName('unchanged')}></span>
                  </div>
                );
              }
              return (
                <div key={chunk.key} className={getLineClassName(chunk.type)}>
                  <span className={getLineNumberClassName(chunk.type)}>
                    {chunk.rightLine}
                  </span>
                  <span>{chunk.rightContent}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

