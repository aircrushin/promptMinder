import Link from 'next/link';
import Image from 'next/image';
import { useState, memo } from 'react';
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Share2, Trash2, ChevronDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiClient } from '@/lib/api-client';
import { useClipboard } from '@/lib/clipboard';

function PromptList({ prompts, onDelete, onShare }) {
  const { toast } = useToast();
  const { copy } = useClipboard();
  const [selectedVersions, setSelectedVersions] = useState(null);

  // 按标题对提示词进行分组
  const groupedPrompts = prompts?.reduce((acc, prompt) => {
    if (!acc[prompt.title]) {
      acc[prompt.title] = [];
    }
    acc[prompt.title].push(prompt);
    return acc;
  }, {});

  const handleCopy = async (content) => {
    await copy(content);
  };

  const handleShare = async (id) => {
    try {
      await apiClient.sharePrompt(id);
      const shareUrl = `${window.location.origin}/share/${id}`;
      await copy(shareUrl);
    } catch (err) {
      console.error('分享失败:', err);
      toast({
        variant: "destructive",
        description: err.message || "分享失败",
        duration: 2000,
      });
    }
  };

  const showVersions = (e, versions) => {
    e.preventDefault();
    setSelectedVersions(versions);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedPrompts || {}).map(([title, versions]) => {
          // 使用最新版本作为显示
          const latestPrompt = versions[0];
          return (
            <Card 
              key={title}
              className="group relative rounded-lg border p-6 hover:shadow-md transition-all bg-card cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                if (versions.length > 1) {
                  showVersions(e, versions);
                } else {
                  window.location.href = `/prompts/${latestPrompt.id}`;
                }
              }}
            >
              <div className="flex gap-4">
                {latestPrompt.cover_img && (
                  <div className="h-[100px] w-[100px] rounded-lg flex-shrink-0 overflow-hidden">
                    <Image 
                      src={latestPrompt.cover_img}
                      alt={title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      width={100}
                      height={100}
                    />
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold line-clamp-1 hover:text-primary transition-colors">
                        {title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(latestPrompt.created_at).toLocaleDateString()}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        最新 v{latestPrompt.version}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {latestPrompt.description || latestPrompt.content}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      {(latestPrompt.tags 
                        ? (Array.isArray(latestPrompt.tags) 
                            ? latestPrompt.tags 
                            : latestPrompt.tags.split(',').filter(tag => tag.trim()))
                        : []
                      ).map((tag) => (
                        <span 
                          key={tag}
                          className="bg-secondary/80 text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full hover:bg-secondary transition-colors"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                    {versions.length > 1 && (
                      <span className="text-sm text-muted-foreground">
                        {versions.length} 个版本
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(latestPrompt.content);
                    }}
                    className="h-8 w-8"
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
                    className="h-8 w-8"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(latestPrompt.id);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Dialog open={!!selectedVersions} onOpenChange={() => setSelectedVersions(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>版本历史</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedVersions?.map((version) => (
              <Link
                key={version.id}
                href={`/prompts/${version.id}`}
                className="block"
               >
                <Card className="p-4 hover:bg-accent cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">v{version.version}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Custom comparison function for PromptList memoization
const arePropsEqual = (prevProps, nextProps) => {
  // Compare prompts array
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
        prevPrompt.created_at !== nextPrompt.created_at ||
        JSON.stringify(prevPrompt.tags) !== JSON.stringify(nextPrompt.tags)
      ) {
        return false;
      }
    }
  }
  
  // Compare function references (they should be stable with useCallback)
  return (
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onShare === nextProps.onShare
  );
};

export default memo(PromptList, arePropsEqual);