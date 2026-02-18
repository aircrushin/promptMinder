"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Copy, Check, FolderInput } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useState } from "react";

export function OptimizePromptDialog({
  open,
  onOpenChange,
  copy,
  isOptimizing,
  optimizedContent,
  onChangeContent,
  onApply,
  onCancel,
  onImport,
  isImporting,
}) {
  const [copied, setCopied] = useState(false);

  if (!copy) return null;

  const handleCopy = async () => {
    if (!optimizedContent.trim()) return;
    try {
      await navigator.clipboard.writeText(optimizedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <VisuallyHidden.Root>
          <DialogTitle>Dialog</DialogTitle>
        </VisuallyHidden.Root>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {copy.optimizePreviewTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="relative min-h-[200px] max-h-[50vh] overflow-y-auto mt-4 border rounded-lg p-1">
          {isOptimizing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {copy.optimizePlaceholder}
                </p>
              </div>
            </div>
          )}
          <Textarea
            value={optimizedContent}
            onChange={(event) => onChangeContent(event.target.value)}
            className="min-h-[200px] w-full border-0 focus-visible:ring-0 resize-none"
            placeholder={isOptimizing ? "" : copy.optimizePlaceholder}
          />
        </div>
        <DialogFooter className="gap-2 mt-4 sm:flex-row flex-col">
          <Button variant="outline" onClick={onCancel}>
            {copy.cancel}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!optimizedContent.trim() || isOptimizing}
            className="gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied
              ? copy.copied || "已复制"
              : copy.copyOptimization || "复制"}
          </Button>
          {onImport && (
            <Button
              variant="outline"
              onClick={onImport}
              disabled={!optimizedContent.trim() || isOptimizing || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderInput className="h-4 w-4" />
              )}
              {copy.importToLibrary || "导入到提示词库"}
            </Button>
          )}
          <Button
            onClick={onApply}
            disabled={!optimizedContent.trim()}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {copy.applyOptimization}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
