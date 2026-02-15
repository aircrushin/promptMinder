'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@clerk/nextjs';
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/api-client';
import { useClipboard } from '@/lib/clipboard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SharePromptDetailClient({ initialPrompt, id }) {
  const { t } = useLanguage();
  const { isSignedIn, userId } = useAuth();
  const { toast } = useToast();
  const { copy, copied } = useClipboard();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [copyToWorkspaceLoading, setCopyToWorkspaceLoading] = useState(false);
  const router = useRouter();

  // If initialPrompt is not provided or we need to refetch when ID changes (though page reload handles that usually)
  // We can keep this effect but optimize it. 
  // Since we are passing initialPrompt from server, we might not need to fetch immediately.
  // But for version switching, we might need it if we don't do full page navigation.
  // However, the original code did router.push for version change, so it will be a full navigation (or next.js soft nav).
  // So the server component will re-run and pass new initialPrompt.
  
  useEffect(() => {
    if (initialPrompt) {
        setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  // Fallback fetch if no initialPrompt (shouldn't happen with server component)
  useEffect(() => {
    const fetchPrompt = async () => {
      if (id && !initialPrompt) {
        try {
          const data = await apiClient.request(`/api/share/${id}`);
          setPrompt({...data, tags: data.tags ? data.tags.split(',') : []});
        } catch (error) {
          console.error('Error fetching prompt:', error);
        }
      }
    };
    
    fetchPrompt();
  }, [id, initialPrompt]);

  const handleVersionChange = (newId) => {
    if (newId !== id) {
      router.push(`/share/${newId}`);
    }
  };

  if (!t) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  const tp = t.sharePage;
  if (!tp) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

  const handleCopy = async () => {
    await copy(prompt.content);
  };

  const handleCopyToWorkspace = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    setCopyToWorkspaceLoading(true);
    try {
      await apiClient.request('/api/prompts/copy', {
        method: 'POST',
        body: { sourceId: id },
      });

      toast({
        title: tp.copyToWorkspaceSuccess,
        description: '您可以在工作台中查看和编辑复制的提示词',
      });

    } catch (error) {
      console.error('Failed to copy to workspace:', error);
      
      // Handle special case for copying own prompt
      if (error.status === 400 && error.data?.error === 'Cannot copy your own prompt') {
        router.push('/prompts');
        return;
      }

      toast({
        title: tp.copyToWorkspaceError,
        description: error.message || tp.copyToWorkspaceError,
        variant: "destructive",
      });
    } finally {
      setCopyToWorkspaceLoading(false);
    }
  };

  if (!prompt) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background to-secondary/5 py-12">
      <div className="mx-auto p-4 sm:p-6 max-w-4xl">
        <Card className="border-none shadow-2xl backdrop-blur-sm bg-background/80">
          <CardContent className="p-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-foreground [-webkit-background-clip:text] [background-clip:text] text-transparent drop-shadow-sm">
              {prompt.title}
            </h1>
            
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b border-border/50 pb-6">
                <div className="flex items-center px-4 py-2 rounded-xl bg-primary/5 shadow-sm">
                  <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(prompt.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  {prompt.versions && prompt.versions.length > 1 ? (
                      <Select onValueChange={handleVersionChange} value={id}>
                        <SelectTrigger className="w-full bg-primary/5 shadow-sm border-none rounded-xl px-4 py-2">
                          <SelectValue placeholder="Select a version" />
                        </SelectTrigger>
                        <SelectContent>
                          {prompt.versions.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className='pr-2'>Version {v.version}</span>
                                {/* <span className="text-xs text-muted-foreground">({new Date(v.created_at).toLocaleDateString()})</span> */}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  ) : (
                    <div className="flex items-center px-4 py-2 rounded-xl bg-primary/5 shadow-sm">
                      <svg className="w-4 h-4 mr-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Version {prompt.version}
                    </div>
                  )}
                </div>
                {prompt.tags?.length > 0 && prompt.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="px-4 py-2 rounded-xl bg-primary/5 shadow-sm"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {prompt.description}
                </p>

                <div className="relative">
                  <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <div className="rounded-2xl border border-border/50 bg-secondary/5 backdrop-blur-sm overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/10">
                      <div className="text-sm font-medium text-muted-foreground">
                        {tp.contentTitle}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleCopy}
                          variant={copied ? "default" : "secondary"}
                          className="relative px-4 py-2 text-sm font-medium"
                          size="sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-12a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {copied ? tp.copyButtonSuccess : tp.copyButton}
                        </Button>
                        {/* 只有在用户已登录且不是自己的提示词时才显示复制到工作台按钮 */}
                        {isSignedIn && prompt && prompt.user_id !== userId && (
                          <Button
                            onClick={handleCopyToWorkspace}
                            disabled={copyToWorkspaceLoading}
                            variant="default"
                            className="relative px-4 py-2 text-sm font-medium"
                            size="sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {copyToWorkspaceLoading ? tp.copyToWorkspaceButtonLoading : tp.copyToWorkspaceButton}
                          </Button>
                        )}
                        {/* 如果用户未登录，显示登录按钮 */}
                        {!isSignedIn && (
                          <Button
                            onClick={() => router.push('/sign-in')}
                            variant="default"
                            className="relative px-4 py-2 text-sm font-medium"
                            size="sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            {tp.copyToWorkspaceButton}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-6 max-h-[600px] overflow-y-auto bg-gradient-to-b from-transparent to-secondary/5">
                      <p className="text-base leading-relaxed whitespace-pre-wrap font-mono selection:bg-primary/20">
                        {prompt.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
