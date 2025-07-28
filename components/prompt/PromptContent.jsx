import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/api-client';

export default function PromptContent({ 
  prompt, 
  onPromptUpdate,
  hasVariables,
  renderedContent,
  t 
}) {
  const { toast } = useToast();
  const [copySuccess, setCopySuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const tp = t.promptDetailPage;

  const handleCopy = async () => {
    try {
      // If there are variables, copy rendered content; otherwise copy original content
      const contentToCopy = hasVariables ? renderedContent : prompt.content;
      await navigator.clipboard.writeText(contentToCopy);
      setCopySuccess(true);
      toast({
        title: tp.copySuccessTitle,
        description: hasVariables ? "已复制渲染后的提示词内容" : tp.copySuccessDescription,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      toast({
        title: tp.copyErrorTitle,
        description: tp.copyErrorDescription,
        variant: "destructive",
      });
    }
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    const previousContent = prompt.content;
    onPromptUpdate({ ...prompt, content: editedContent });
    setIsEditing(false);

    try {
      await apiClient.updatePrompt(prompt.id, { content: editedContent });
      
      toast({
        title: "Success",
        description: "Content saved successfully.",
      });
    } catch (error) {
      console.error('Error saving content:', error);
      onPromptUpdate({ ...prompt, content: previousContent });
      setIsEditing(true);
      toast({ 
        title: "Error",
        description: tp.saveError,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(prompt.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(prompt.content);
  };

  return (
    <Card className="flex-1 border border-primary/10 bg-secondary/5 backdrop-blur-sm overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between shrink-0 py-3">
        <CardTitle className="text-base font-semibold flex items-center">
          <span className="bg-primary/10 p-1.5 rounded-lg mr-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          {tp.contentCardTitle}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="transition-all duration-200"
          >
            {copySuccess ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                {tp.cancel}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveContent}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {tp.saving}
                  </span>
                ) : tp.save}
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStartEdit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="rounded-lg bg-secondary/30 p-4 min-h-full">
            {isEditing ? (
              <div className="min-h-[600px]">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full min-h-[500px] text-base leading-relaxed whitespace-pre-wrap text-primary"
                  placeholder={tp.editPlaceholder}
                  style={{ resize: 'vertical', overflowY: 'auto' }}
                />
              </div>
            ) : (
              <div className="text-base leading-relaxed whitespace-pre-wrap text-primary min-h-[600px]">
                {hasVariables ? renderedContent : prompt.content}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}