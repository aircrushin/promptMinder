'use client';

import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
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
  createNewVersionLabel = '创建新版本',
  onCreateNewVersion,
}) {
  const latestVersion = versions[0] || null;
  const promptTitle = latestVersion?.title || '当前提示词';
  const description = versions.length
    ? `共 ${versions.length} 个版本，选择一个版本查看详情或基于最新版本继续编辑。`
    : '暂无版本记录。';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="gap-4 border-b px-5 py-5 pr-14 text-left sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
              <p className="text-sm font-medium text-foreground/90">{promptTitle}</p>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <Button
              onClick={onCreateNewVersion}
              className="h-10 w-full shrink-0 sm:h-9 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {createNewVersionLabel}
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[min(60vh,28rem)]">
          <div className="space-y-3 p-4 sm:p-6">
            {versions.map((version, index) => (
              <Link
                key={version.id}
                href={`/prompts/${version.id}`}
                aria-label={`查看 v${version.version} 详情`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background px-4 py-3 transition-colors duration-200 hover:border-primary/30 hover:bg-accent/40">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-foreground">
                        v{version.version}
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[11px]">
                          最新版本
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="hidden sm:inline">查看详情</span>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export { VersionHistoryDialog };
