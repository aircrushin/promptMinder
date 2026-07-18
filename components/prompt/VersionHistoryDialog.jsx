'use client';

import Link from 'next/link';
import { ChevronRight, History, Loader2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

function VersionHistoryDialog({
  open,
  onOpenChange,
  versions = [],
  title = '版本历史',
  description,
  createNewVersionLabel = '创建新版本',
  restoreLabel = '恢复此版本',
  restoringLabel = '恢复中...',
  latestLabel = '最新版本',
  viewDetailsLabel = '查看详情',
  onCreateNewVersion,
  onRestoreVersion,
  restoringVersionId = null,
  canRestore = true,
}) {
  const latestVersion = versions[0] || null;
  const promptTitle = latestVersion?.title || '当前提示词';
  const resolvedDescription = description
    || (versions.length
      ? `共 ${versions.length} 个版本，可查看详情、创建新版本，或一键恢复到历史版本。`
      : '暂无版本记录。');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="gap-4 border-b px-5 py-5 pr-14 text-left sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
              <p className="text-sm font-medium text-foreground/90">{promptTitle}</p>
              <DialogDescription>{resolvedDescription}</DialogDescription>
            </div>
            {onCreateNewVersion && (
              <Button
                onClick={onCreateNewVersion}
                className="h-10 w-full shrink-0 sm:h-9 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                {createNewVersionLabel}
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[min(60vh,28rem)]">
          <div className="space-y-3 p-4 sm:p-6">
            {versions.map((version, index) => {
              const isLatest = index === 0;
              const isRestoring = restoringVersionId === version.id;

              return (
                <div
                  key={version.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-4 py-3 transition-colors duration-200 hover:border-primary/30 hover:bg-accent/40"
                >
                  <Link
                    href={`/prompts/${version.id}`}
                    aria-label={`查看 v${version.version} 详情`}
                    className="group min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-foreground">
                            v{version.version}
                          </span>
                          {isLatest && (
                            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                              {latestLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                        <span>{viewDetailsLabel}</span>
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>

                  {!isLatest && canRestore && onRestoreVersion && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={Boolean(restoringVersionId)}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRestoreVersion(version);
                      }}
                    >
                      {isRestoring ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <History className="h-3.5 w-3.5" />
                      )}
                      {isRestoring ? restoringLabel : restoreLabel}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { VersionHistoryDialog };
