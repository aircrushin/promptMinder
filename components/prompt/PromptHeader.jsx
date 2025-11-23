import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function PromptHeader({ 
  prompt, 
  versions, 
  selectedVersion, 
  onVersionChange, 
  onDelete,
  t,
  canManage = true
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [shareSuccess, setShareSuccess] = useState(false);
  const tp = t.promptDetailPage;

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/prompts/share/${prompt.id}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Share failed');
      }

      const shareUrl = `${window.location.origin}/share/${prompt.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      toast({
        title: tp.shareSuccessTitle,
        description: tp.shareSuccessDescription,
      });
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to share prompt:', err);
      toast({
        title: tp.shareErrorTitle,
        description: tp.shareErrorDescription,
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    router.push(`/prompts/${prompt.id}/edit`, {
      state: {
        prompt: {
          ...prompt,
          tags: Array.isArray(prompt.tags) 
            ? prompt.tags.join(',') 
            : (prompt.tags || '')
        }
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {prompt.title}
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {prompt.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(prompt.created_at).toLocaleDateString()}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {versions.length > 1 ? (
                <Select
                  value={selectedVersion}
                  onValueChange={onVersionChange}
                >
                  <SelectTrigger className="h-5 text-xs border-none bg-transparent hover:bg-secondary/50 transition-colors">
                    <SelectValue placeholder={tp.selectVersionPlaceholder}>
                      v{selectedVersion}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem 
                        key={version.id} 
                        value={version.version}
                        className="text-xs"
                      >
                        v{version.version} ({new Date(version.created_at).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span>v{prompt.version}</span>
              )}
            </div>
          </div>
          {prompt.tags?.length > 0 && prompt.tags.slice(0, 3).map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="bg-primary/5 hover:bg-primary/10 transition-colors duration-200 text-xs px-2 py-0"
            >
              {tag}
            </Badge>
          ))}
          {prompt.tags?.length > 3 && (
            <Badge 
              variant="secondary"
              className="bg-primary/5 hover:bg-primary/10 transition-colors duration-200 text-xs px-2 py-0"
            >
              +{prompt.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button
          onClick={() => router.push(`/ab-tests/new?baseline=${prompt.id}`)}
          variant="outline"
          size="sm"
          className="text-xs"
          title="创建A/B测试"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          A/B测试
        </Button>

        <Button
          onClick={handleShare}
          variant={shareSuccess ? "success" : "secondary"}
          className="relative overflow-hidden group w-8 h-8 p-0"
          title={tp.shareTooltip}
        >
          <svg className={`w-3 h-3 transition-transform duration-300 ${shareSuccess ? "rotate-0" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </Button>

        {canManage && (
          <>
            <Button
              onClick={handleEdit}
              variant="default"
              className="relative overflow-hidden group w-8 h-8 p-0"
              title={tp.editTooltip}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>

            <Button
              onClick={onDelete}
              variant="destructive"
              className="relative overflow-hidden group w-8 h-8 p-0"
              title={tp.deleteTooltip}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}