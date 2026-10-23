'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Import as ImportIcon, Heart } from "lucide-react";
import { apiClient } from '@/lib/api-client';
import { useClipboard } from '@/lib/clipboard';

function CopyIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon(props) {
    return (
        <svg
         {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
}

function PromptCardComponent({ prompt }) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { copy, copied } = useClipboard(
    t?.publicPage?.copySuccess || '已复制',
    t?.publicPage?.copyError || '复制失败'
  );
  const [isImporting, setIsImporting] = useState(false);
  const [likes, setLikes] = useState(prompt.likes || 0);
  const [hasLiked, setHasLiked] = useState(prompt.userLiked || false);

  // Handle case where translations are not loaded yet
  if (!t || !t.publicPage) return null;

  const handleCopy = () => {
    copy(prompt.prompt);
  };

  const handleLike = async () => {
    if (!isSignedIn) {
      toast({
        title: '请先登录',
        description: '登录后才能点赞提示词',
        variant: 'default',
      });
      return;
    }

    const previousLikes = likes;
    const previousLiked = hasLiked;

    // 乐观更新：立即更新UI
    if (hasLiked) {
      // 取消点赞
      setLikes(prev => Math.max(0, prev - 1));
      setHasLiked(false);
    } else {
      // 点赞
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }

    try {
      const method = previousLiked ? 'DELETE' : 'POST';
      const url = previousLiked
        ? `/api/prompts/like?promptId=${encodeURIComponent(prompt.id)}`
        : '/api/prompts/like';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(method === 'POST' && { body: JSON.stringify({ promptId: prompt.id }) }),
      });

      if (!response.ok) {
        throw new Error(previousLiked ? 'Failed to unlike prompt' : 'Failed to like prompt');
      }

      const data = await response.json();
      // 使用服务器返回的值更新，确保数据一致性
      setLikes(data.likes);
      setHasLiked(data.liked);
    } catch (error) {
      // 回滚：如果请求失败，恢复之前的状态
      setLikes(previousLikes);
      setHasLiked(previousLiked);
      toast({
        title: previousLiked ? '取消点赞失败' : '点赞失败',
        description: error.message || '操作失败，请重试',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    setIsImporting(true);
    try {
      const result = await apiClient.copyPrompt(prompt);
      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        toast({
          title: t.publicPage.importSuccessTitle,
          description: t.publicPage.importPendingApprovalDescription || '已提交审批请求',
        });
        router.push(`/prompts/reviews/${result.change_request.id}`);
      } else {
        toast({
          title: t.publicPage.importSuccessTitle,
          description: t.publicPage.importSuccessDescription,
        });
      }
    } catch (error) {
      toast({
        title: t.publicPage.importErrorTitle,
        description: error.message || 'Failed to import prompt',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="group">
      <Card className="relative bg-card border border-border hover:border-foreground/40 transition-colors duration-200 hover:-translate-y-0.5 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/40 transition-colors duration-200 pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-lg font-semibold text-card-foreground leading-tight flex-1">
              {prompt.title || prompt.role}
            </CardTitle>
            <div className="flex items-center gap-1">
             
              <div className="flex items-center gap-0.15">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleLike}
                      variant="ghost"
                      size="icon"
                      className={`flex-shrink-0 h-8 w-8 rounded-lg transition-all duration-300 ${
                        hasLiked
                          ? 'text-destructive bg-destructive/10'
                          : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      }`}
                    >
                      <Heart className={`h-4 w-4 transition-transform duration-300 ${hasLiked ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-popover text-popover-foreground border border-border shadow-md"
                  >
                    <p className="font-medium">{hasLiked ? '已点赞' : '点赞'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
                {/* <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} /> */}
                <span className="text-xs text-muted-foreground">
                  {likes}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleImport}
                      variant="ghost"
                      size="icon"
                      disabled={isImporting}
                      className="flex-shrink-0 h-8 w-8 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <ImportIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-popover text-popover-foreground border border-border shadow-md"
                  >
                    <p className="font-medium">{t.publicPage.importTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="icon"
                      className={`flex-shrink-0 h-8 w-8 rounded-lg transition-all duration-300 ${
                        copied
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 transition-transform duration-300" />
                      ) : (
                        <CopyIcon className="h-4 w-4 transition-transform duration-300" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-popover text-popover-foreground border border-border shadow-md"
                  >
                    <p className="font-medium">{copied ? t.publicPage.copiedTooltip : t.publicPage.copyTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Category badge */}
          {prompt.category && (
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                {prompt.category}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0 pb-6">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-[10]">
            {prompt.prompt}
          </p>
        </CardContent>
        
        <div className="h-px bg-border group-hover:bg-foreground/60 transition-colors duration-200" />
      </Card>
    </div>
  );
}

// Custom comparison function for PromptCard memoization
const arePropsEqual = (prevProps, nextProps) => {
  // Compare prompt object properties that affect rendering
  const prevPrompt = prevProps.prompt;
  const nextPrompt = nextProps.prompt;

  if (!prevPrompt && !nextPrompt) return true;
  if (!prevPrompt || !nextPrompt) return false;

  return (
    prevPrompt.id === nextPrompt.id &&
    prevPrompt.title === nextPrompt.title &&
    prevPrompt.role === nextPrompt.role &&
    prevPrompt.prompt === nextPrompt.prompt &&
    prevPrompt.category === nextPrompt.category &&
    prevPrompt.likes === nextPrompt.likes &&
    prevPrompt.userLiked === nextPrompt.userLiked
  );
};

export const PromptCard = memo(PromptCardComponent, arePropsEqual);
