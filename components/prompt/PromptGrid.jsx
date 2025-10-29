"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Share2, Trash2, Clock, PlusCircle } from "lucide-react";
import { extractVariables } from "@/lib/promptVariables";

const PromptCardSkeleton = () => (
  <Card className="group relative p-5 hover:shadow-md transition-all bg-card border border-border/40">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-4 w-[240px]" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </Card>
);

export const PromptGridSkeleton = () => (
  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    <Card className="group relative border p-5 hover:shadow-md transition-all bg-card cursor-pointer border-dashed h-[180px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
    </Card>
    {Array.from({ length: 5 }).map((_, index) => (
      <PromptCardSkeleton key={index} />
    ))}
  </div>
);

const NewPromptCard = ({ onClick, label }) => (
  <Card
    onClick={onClick}
    className="group relative border p-5 hover:shadow-xl transition-all duration-300 ease-in-out bg-card cursor-pointer border-dashed h-[180px] flex items-center justify-center overflow-hidden"
  >
    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:scale-110 transition-transform duration-300">
      <div className="bg-primary/10 p-3 rounded-full">
        <PlusCircle className="h-8 w-8 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </Card>
);

export function PromptGrid({
  groups,
  onCreatePrompt,
  onCopyPrompt,
  onSharePrompt,
  onDeletePrompt,
  onOpenVersions,
  onOpenPrompt,
  translations,
}) {
  const pageCopy = translations?.promptsPage;
  const variableTemplate = translations?.variableInputs?.variableCount;

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <NewPromptCard
        onClick={onCreatePrompt}
        label={pageCopy?.newPromptCard ?? "创建提示词"}
      />
      {groups.map(({ title, versions }) => {
        const latestPrompt = versions[0];
        const variables = extractVariables(latestPrompt.content);
        const hasVariables = variables.length > 0;
        const variableLabel = hasVariables
          ? (variableTemplate
              ? variableTemplate.replace("{count}", variables.length.toString())
              : `${variables.length} 变量`)
          : null;

        const handleCardClick = () => {
          if (versions.length > 1) {
            onOpenVersions?.(versions);
            return;
          }
          onOpenPrompt?.(latestPrompt.id);
        };

        return (
          <Card
            key={title}
            className="group relative rounded-lg border p-5 hover:shadow-lg transition-all duration-300 ease-in-out bg-card cursor-pointer overflow-hidden"
            onClick={handleCardClick}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {latestPrompt.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {latestPrompt.description}
                    </p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCopyPrompt?.(latestPrompt.content);
                      }}
                      className="h-8 w-8 hover:bg-accent hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSharePrompt?.(latestPrompt.id);
                      }}
                      className="h-8 w-8 hover:bg-accent hover:text-primary"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeletePrompt?.(latestPrompt.id);
                      }}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(latestPrompt.tags)
                  ? latestPrompt.tags
                  : (latestPrompt.tags || "")
                      .split(",")
                      .filter((tag) => tag.trim())
                ).map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(latestPrompt.updated_at).toLocaleString()}
                </div>
                {hasVariables && (
                  <div className="flex items-center gap-1 ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h4"
                      />
                    </svg>
                    <span>{variableLabel}</span>
                  </div>
                )}
                {versions.length > 1 && (
                  <div className="flex items-center gap-1 ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    <span>
                      {pageCopy?.versionsCount
                        ? pageCopy.versionsCount.replace("{count}", versions.length.toString())
                        : `${versions.length} versions`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
