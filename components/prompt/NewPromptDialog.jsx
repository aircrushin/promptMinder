"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, PlusCircle, Wand2 } from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const CreatableSelect = dynamic(() => import("react-select/creatable"), {
  loading: () => <Skeleton className="h-10 w-full" />,
  ssr: false,
});

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

  const handleTagsChange = (selected) => {
    const tags = selected
      ? selected.map((option) => option.value).join(",")
      : "";
    onFieldChange("tags", tags);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thumb-muted/50 scrollbar-track-background">
        <VisuallyHidden.Root>
          <DialogTitle>Dialog</DialogTitle>
        </VisuallyHidden.Root>
        <DialogHeader>
          <DialogTitle className="text-xl">{copy.newPromptTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              {copy.formTitleLabel}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="title"
              value={prompt.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder={copy.formTitlePlaceholder}
              className="focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              {copy.formContentLabel}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="content"
                value={prompt.content}
                onChange={(event) => onFieldChange("content", event.target.value)}
                placeholder={copy.formContentPlaceholder}
                className="min-h-[200px] pr-10 focus-visible:ring-primary/30"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 hover:bg-accent hover:text-primary"
                onClick={onOptimize}
                disabled={!prompt.content.trim() || isOptimizing}
              >
                {isOptimizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{copy.variableTip}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              {copy.formDescriptionLabel}
            </Label>
            <Textarea
              id="description"
              value={prompt.description}
              onChange={(event) => onFieldChange("description", event.target.value)}
              placeholder={copy.formDescriptionPlaceholder}
              className="focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium">
              {copy.formTagsLabel}
            </Label>
            <CreatableSelect
              isMulti
              value={prompt.tags
                ? prompt.tags.split(",").map((tag) => ({ value: tag, label: tag }))
                : []}
              onChange={handleTagsChange}
              options={tagOptions}
              onCreateOption={async (inputValue) => {
                const newOption = await onCreateTag(inputValue);
                if (newOption) {
                  onFieldChange(
                    "tags",
                    prompt.tags ? `${prompt.tags},${inputValue}` : inputValue
                  );
                }
              }}
              placeholder={copy.formTagsPlaceholder}
              classNamePrefix="select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  backgroundColor: "hsl(var(--background))",
                  borderColor: state.isFocused
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border))",
                  borderRadius: "calc(var(--radius) - 2px)",
                  boxShadow: state.isFocused
                    ? "0 0 0 2px hsl(var(--primary)/30%)"
                    : "none",
                  "&:hover": {
                    borderColor: "hsl(var(--primary))",
                  },
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "calc(var(--radius) - 2px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  zIndex: 100,
                }),
                option: (baseStyles, { isFocused, isSelected }) => ({
                  ...baseStyles,
                  backgroundColor: isSelected
                    ? "hsl(var(--primary))"
                    : isFocused
                    ? "hsl(var(--accent))"
                    : "transparent",
                  color: isSelected
                    ? "hsl(var(--primary-foreground))"
                    : "inherit",
                  cursor: "pointer",
                  "&:active": {
                    backgroundColor: "hsl(var(--accent))",
                  },
                }),
                multiValue: (baseStyles) => ({
                  ...baseStyles,
                  backgroundColor: "hsl(var(--secondary)/50%)",
                  borderRadius: "calc(var(--radius) - 2px)",
                }),
                multiValueLabel: (baseStyles) => ({
                  ...baseStyles,
                  color: "hsl(var(--secondary-foreground))",
                }),
                multiValueRemove: (baseStyles) => ({
                  ...baseStyles,
                  color: "hsl(var(--secondary-foreground))",
                  "&:hover": {
                    backgroundColor: "hsl(var(--destructive))",
                    color: "hsl(var(--destructive-foreground))",
                  },
                }),
                input: (baseStyles) => ({
                  ...baseStyles,
                  color: "hsl(var(--foreground))",
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "hsl(var(--primary))",
                  primary75: "hsl(var(--primary)/.75)",
                  primary50: "hsl(var(--primary)/.5)",
                  primary25: "hsl(var(--primary)/.25)",
                  danger: "hsl(var(--destructive))",
                  dangerLight: "hsl(var(--destructive)/.25)",
                },
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version" className="text-sm font-medium">
              {copy.formVersionLabel}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">v</span>
              <Input
                id="version"
                value={prompt.version}
                onChange={(event) => onFieldChange("version", event.target.value)}
                placeholder={copy.formVersionPlaceholder}
                className="w-32 focus-visible:ring-primary/30"
              />
            </div>
            <p className="text-sm text-muted-foreground">{copy.versionSuggestion}</p>
          </div>
        </div>
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
