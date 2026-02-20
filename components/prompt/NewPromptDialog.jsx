"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { PromptForm } from "./PromptForm";

/**
 * 新建提示词对话框组件
 * 使用 PromptForm 作为表单内容
 */
export function NewPromptDialog({
  open,
  onOpenChange,
  prompt,
  onFieldChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isOptimizing,
  onOptimize,
  tagOptions,
  onCreateTag,
  copy,
}) {
  if (!copy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thumb-muted/50 scrollbar-track-background">
        <VisuallyHidden.Root>
          <DialogTitle>Dialog</DialogTitle>
        </VisuallyHidden.Root>
        <DialogHeader>
          <DialogTitle className="text-xl">{copy.newPromptTitle}</DialogTitle>
        </DialogHeader>
        
        <PromptForm
          mode="compact"
          prompt={prompt}
          onFieldChange={onFieldChange}
          tagOptions={tagOptions}
          onCreateTag={onCreateTag}
          onOptimize={onOptimize}
          isOptimizing={isOptimizing}
          copy={copy}
        />
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {copy.cancel}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.creating}
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                {copy.create}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewPromptDialog;
