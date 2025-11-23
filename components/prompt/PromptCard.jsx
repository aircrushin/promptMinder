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
import { Import as ImportIcon } from "lucide-react";
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

  // Handle case where translations are not loaded yet
  if (!t || !t.publicPage) return null;

  const handleCopy = () => {
    copy(prompt.prompt);
  };

  const handleImport = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    
    setIsImporting(true);
    try {
      await apiClient.copyPrompt(prompt);
      toast({
        title: t.publicPage.importSuccessTitle,
        description: t.publicPage.importSuccessDescription,
      });
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
      <Card className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 hover:-translate-y-1 overflow-hidden rounded-xl">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/40 group-hover:to-purple-50/40 dark:group-hover:from-blue-950/30 dark:group-hover:to-purple-950/30 transition-all duration-300 pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-3">
          <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-300 flex-1">
              {prompt.role}
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleImport} 
                      variant="ghost" 
                      size="icon" 
                      disabled={isImporting}
                      className="flex-shrink-0 h-8 w-8 rounded-lg transition-all duration-300 text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105"
                    >
                      <ImportIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top"
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 shadow-lg"
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
                          : 'text-gray-400 dark:text-gray-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'
                      } hover:scale-105`}
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
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-0 shadow-lg"
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
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                {prompt.category}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="relative z-10 pt-0 pb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300 line-clamp-[10]">
            {prompt.prompt}
          </p>
        </CardContent>
        
        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-purple-500/0 group-hover:from-blue-500/70 group-hover:via-blue-500/90 group-hover:to-purple-500/70 transition-all duration-300" />
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
    prevPrompt.role === nextPrompt.role &&
    prevPrompt.prompt === nextPrompt.prompt &&
    prevPrompt.category === nextPrompt.category
  );
};

export const PromptCard = memo(PromptCardComponent, arePropsEqual);