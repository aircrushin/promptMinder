// @ts-nocheck
'use client';

import { memo, useCallback } from 'react';
import { VirtualGrid } from '@/components/ui/virtual-list';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Trash2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import Link from 'next/link';
import { extractVariables } from "@/lib/promptVariables";
import { useClipboard } from '@/lib/clipboard';

/**
 * VirtualPromptList component for efficiently rendering large collections of prompts
 * Uses virtualization to only render visible items for better performance
 */
function VirtualPromptList({ 
  prompts = [], 
  onDelete, 
  onShare, 
  containerHeight = 600,
  itemHeight = 200,
  itemsPerRow = 3,
  gap = 20,
  t
}) {
  const { toast } = useToast();
  const { copy } = useClipboard();

  // Group prompts by title for version management
  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.title]) {
      acc[prompt.title] = [];
    }
    acc[prompt.title].push(prompt);
    return acc;
  }, {});

  // Convert grouped prompts to flat array for virtualization
  const promptGroups = Object.entries(groupedPrompts).map(([title, versions]) => ({
    title,
    versions,
    latestPrompt: versions[0]
  }));

  const handleCopy = useCallback(async (content) => {
    await copy(content);
  }, [copy]);

  const handleShare = useCallback(async (id) => {
    try {
      await onShare(id);
    } catch (error) {
      console.error('Error sharing prompt:', error);
      toast({
        variant: "destructive",
        description: error.message || "分享失败",
        duration: 2000,
      });
    }
  }, [onShare, toast]);

  const handleDelete = useCallback((id) => {
    onDelete(id);
  }, [onDelete]);

  const showVersions = useCallback((e, versions) => {
    e.preventDefault();
    // This would typically open a modal or navigate to version history
    console.log('Show versions:', versions);
  }, []);

  // Render individual prompt card
  const renderPromptCard = useCallback((promptGroup, index) => {
    const { title, versions, latestPrompt } = promptGroup;

    return (
      <Card
        key={`${title}-${index}`}
        className="group relative rounded-lg border p-5 hover:shadow-lg transition-all duration-300 ease-in-out bg-card cursor-pointer overflow-hidden h-full"
        onClick={(e) => {
          e.preventDefault();
          if (versions.length > 1) {
            showVersions(e, versions);
          } else {
            window.location.href = `/prompts/${latestPrompt.id}`;
          }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="space-y-4 relative z-10 h-full flex flex-col">
          <div className="flex justify-between items-start flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              {latestPrompt.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {latestPrompt.description}
                </p>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-sm flex-shrink-0 ml-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(latestPrompt.content);
                  }}
                  className="h-8 w-8 hover:bg-accent hover:text-primary"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(latestPrompt.id);
                  }}
                  className="h-8 w-8 hover:bg-accent hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(latestPrompt.id);
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {(latestPrompt.tags
              ? Array.isArray(latestPrompt.tags)
                ? latestPrompt.tags
                : latestPrompt.tags
                    .split(",")
                    .filter((tag) => tag.trim())
              : []
            ).map((tag) => (
              <span
                key={tag}
                className="bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 mt-auto">
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(latestPrompt.updated_at).toLocaleString()}
            </div>
            {(() => {
              const variables = extractVariables(latestPrompt.content);
              return (
                variables.length > 0 && (
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
                    <span>
                      {t?.variableInputs?.variableCount?.replace(
                        "{count}",
                        variables.length.toString()
                      ) || `${variables.length} 变量`}
                    </span>
                  </div>
                )
              );
            })()}
            {versions.length > 1 && (
              <div className="flex items-center gap-1 ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                <span>
                  {t?.promptsPage?.versionsCount?.replace(
                    "{count}",
                    versions.length.toString()
                  ) || `${versions.length} 版本`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }, [handleCopy, handleShare, handleDelete, showVersions, t]);

  if (promptGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">暂无提示词</p>
          <p className="text-sm">创建您的第一个提示词开始使用</p>
        </div>
      </div>
    );
  }

  return (
    <VirtualGrid
      items={promptGroups}
      itemHeight={itemHeight}
      itemsPerRow={itemsPerRow}
      containerHeight={containerHeight}
      gap={gap}
      renderItem={renderPromptCard}
      className="w-full"
      overscan={2}
    />
  );
}

// Custom comparison function for memoization
const arePropsEqual = (prevProps, nextProps) => {
  // Compare prompts array length first for quick check
  if (prevProps.prompts?.length !== nextProps.prompts?.length) {
    return false;
  }
  
  // Deep compare prompts array for relevant properties
  if (prevProps.prompts && nextProps.prompts) {
    for (let i = 0; i < prevProps.prompts.length; i++) {
      const prevPrompt = prevProps.prompts[i];
      const nextPrompt = nextProps.prompts[i];
      
      if (
        prevPrompt.id !== nextPrompt.id ||
        prevPrompt.title !== nextPrompt.title ||
        prevPrompt.content !== nextPrompt.content ||
        prevPrompt.version !== nextPrompt.version ||
        prevPrompt.updated_at !== nextPrompt.updated_at ||
        JSON.stringify(prevPrompt.tags) !== JSON.stringify(nextPrompt.tags)
      ) {
        return false;
      }
    }
  }
  
  // Compare other props
  return (
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.containerHeight === nextProps.containerHeight &&
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.itemsPerRow === nextProps.itemsPerRow &&
    prevProps.gap === nextProps.gap
  );
};

export default memo(VirtualPromptList, arePropsEqual);