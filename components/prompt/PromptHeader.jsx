import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from '@/lib/api-client';
import { Pencil, Check, X, FlaskConical, Plus } from 'lucide-react';

export default function PromptHeader({ 
  prompt, 
  versions, 
  selectedVersion, 
  onVersionChange, 
  onDelete,
  onPromptUpdate,
  onAddTag,
  t,
  canManage = true,
  canAddTag = true
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(prompt.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const inputRef = useRef(null);
  const tagInputRef = useRef(null);
  const tp = t.promptDetailPage;

  useEffect(() => {
    if (isEditingDescription && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isAddingTag]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags({ includePublic: true });
        setAvailableTags(data || []);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    if (showTagDropdown && availableTags.length === 0) {
      fetchTags();
    }
  }, [showTagDropdown]);

  const handleAddTagClick = useCallback(() => {
    if (!canAddTag || !canManage) return;
    setIsAddingTag(true);
    setNewTag('');
  }, [canAddTag, canManage]);

  const handleTagSubmit = useCallback(async () => {
    const tagValue = newTag.trim();
    if (!tagValue) {
      setIsAddingTag(false);
      return;
    }

    const currentTags = Array.isArray(prompt.tags) ? prompt.tags : (prompt.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    
    if (currentTags.includes(tagValue)) {
      toast({
        title: tp.tagExists || '标签已存在',
        description: tp.tagExistsDesc || '该标签已添加到提示词',
      });
      setIsAddingTag(false);
      return;
    }

    const updatedTags = [...currentTags, tagValue].join(',');
    
    try {
      const result = await apiClient.updatePrompt(prompt.id, {
        tags: updatedTags,
      });

      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        toast({
          title: tp.tagSaveSuccess || '已提交审批',
          description: tp.tagPendingApproval || '标签变更已提交审批',
        });
        router.push(`/prompts/reviews/${result.change_request.id}`);
        setIsAddingTag(false);
        return;
      }

      const freshPrompt = await apiClient.getPrompt(prompt.id);
      const normalizedPrompt = {
        ...freshPrompt,
        tags: Array.isArray(freshPrompt.tags)
          ? freshPrompt.tags
          : (freshPrompt.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
      };
      
      if (onAddTag) {
        onAddTag(normalizedPrompt);
      }
      
      toast({
        title: tp.tagSaveSuccess || '标签已添加',
        description: tp.tagSaveSuccessDesc || '标签已成功添加到提示词',
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast({
        title: tp.saveError || '保存失败',
        description: tp.tagSaveErrorDesc || '无法添加标签，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTag(false);
    }
  }, [newTag, prompt, onAddTag, toast, tp, router]);

  const handleTagCancel = useCallback(() => {
    setIsAddingTag(false);
    setNewTag('');
  }, []);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagSubmit();
    } else if (e.key === 'Escape') {
      handleTagCancel();
    }
  }, [handleTagSubmit, handleTagCancel]);

  const handleSelectExistingTag = useCallback(async (tagName) => {
    const currentTags = Array.isArray(prompt.tags) ? prompt.tags : (prompt.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    
    if (currentTags.includes(tagName)) {
      toast({
        title: tp.tagExists || '标签已存在',
        description: tp.tagExistsDesc || '该标签已添加到提示词',
      });
      setShowTagDropdown(false);
      return;
    }

    const updatedTags = [...currentTags, tagName].join(',');
    
    try {
      const result = await apiClient.updatePrompt(prompt.id, {
        tags: updatedTags,
      });

      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        toast({
          title: tp.tagSaveSuccess || '已提交审批',
          description: tp.tagPendingApproval || '标签变更已提交审批',
        });
        router.push(`/prompts/reviews/${result.change_request.id}`);
        setShowTagDropdown(false);
        return;
      }

      const freshPrompt = await apiClient.getPrompt(prompt.id);
      const normalizedPrompt = {
        ...freshPrompt,
        tags: Array.isArray(freshPrompt.tags)
          ? freshPrompt.tags
          : (freshPrompt.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
      };
      
      if (onAddTag) {
        onAddTag(normalizedPrompt);
      }
      
      toast({
        title: tp.tagSaveSuccess || '标签已添加',
        description: tp.tagSaveSuccessDesc || '标签已成功添加到提示词',
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast({
        title: tp.saveError || '保存失败',
        description: tp.tagSaveErrorDesc || '无法添加标签，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setShowTagDropdown(false);
    }
  }, [prompt, onAddTag, toast, tp, router]);

  const handleDescriptionEdit = () => {
    if (!canManage) return;
    setEditedDescription(prompt.description || '');
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = async () => {
    if (editedDescription === prompt.description) {
      setIsEditingDescription(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await apiClient.updatePrompt(prompt.id, {
        description: editedDescription,
      });

      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        setIsEditingDescription(false);
        toast({
          title: tp.descriptionSaveSuccess || '已提交审批',
          description: tp.descriptionPendingApproval || '描述变更已提交审批',
        });
        router.push(`/prompts/reviews/${result.change_request.id}`);
        return;
      }
      
      const freshPrompt = await apiClient.getPrompt(prompt.id);
      const normalizedPrompt = {
        ...freshPrompt,
        tags: Array.isArray(freshPrompt.tags)
          ? freshPrompt.tags
          : (freshPrompt.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
      };
      
      if (onPromptUpdate) {
        onPromptUpdate(normalizedPrompt);
      }
      
      toast({
        title: tp.descriptionSaveSuccess || '描述已更新',
        description: tp.descriptionSaveSuccessDesc || '提示词描述已成功保存',
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error('Failed to update description:', error);
      toast({
        title: tp.saveError || '保存失败',
        description: tp.descriptionSaveErrorDesc || '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDescriptionCancel = () => {
    setEditedDescription(prompt.description || '');
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  const handleOpenInPlayground = () => {
    router.push(`/playground?promptId=${prompt.id}`);
  };

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

  const handleViewDiff = () => {
    router.push(`/prompts/${prompt.id}/diff`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {prompt.title}
        </h1>
        {isEditingDescription ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              placeholder={tp.descriptionPlaceholder || '输入描述...'}
              className="h-7 text-xs flex-1"
              disabled={isSaving}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDescriptionSave}
              disabled={isSaving}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDescriptionCancel}
              disabled={isSaving}
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <div 
            className={`group flex items-center gap-1 ${canManage ? 'cursor-pointer hover:bg-secondary/50 rounded px-1 -mx-1 transition-colors' : ''}`}
            onClick={handleDescriptionEdit}
          >
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {prompt.description || (canManage ? (tp.noDescription || '点击添加描述') : '')}
            </p>
            {canManage && (
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </div>
        )}
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
          {canManage && canAddTag && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tp.addTagTooltip || '添加标签'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {(isAddingTag || showTagDropdown) && (
            <div className="relative">
              {isAddingTag ? (
                <div className="flex items-center gap-1">
                  <Input
                    ref={tagInputRef}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tp.newTagPlaceholder || '新标签...'}
                    className="h-6 text-xs w-24"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleTagSubmit}
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleTagCancel}
                  >
                    <X className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="absolute top-0 left-0 z-50 mt-1 w-48 rounded-md border bg-popover shadow-md">
                  <div className="p-1">
                    <Input
                      ref={tagInputRef}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tp.searchTagPlaceholder || '搜索或创建标签...'}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto p-1">
                    {availableTags
                      .filter(tag => {
                        const currentTags = Array.isArray(prompt.tags) ? prompt.tags : (prompt.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                        return !currentTags.includes(tag.name);
                      })
                      .slice(0, 10)
                      .map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleSelectExistingTag(tag.name)}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent"
                        >
                          {tag.name}
                        </button>
                      ))}
                    {newTag && !availableTags.some(t => t.name === newTag.trim()) && (
                      <button
                        onClick={handleTagSubmit}
                        className="w-full text-left text-xs px-2 py-1 rounded text-primary hover:bg-accent"
                      >
                        <Plus className="h-3 w-3 inline mr-1" />
                        {tp.createNewTag || '创建'} "{newTag.trim()}"
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <TooltipProvider>
        <div className="flex gap-2 shrink-0">
          {versions.length > 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleViewDiff}
                  variant="secondary"
                  className="relative overflow-hidden group w-8 h-8 p-0"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tp.viewDiffTooltip || "查看差异"}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleOpenInPlayground}
                variant="secondary"
                className="relative overflow-hidden group w-8 h-8 p-0"
              >
                <FlaskConical className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tp.openInPlaygroundTooltip || "在工作台打开"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleShare}
                variant={shareSuccess ? "success" : "secondary"}
                className="relative overflow-hidden group w-8 h-8 p-0"
              >
                <svg className={`w-3 h-3 transition-transform duration-300 ${shareSuccess ? "rotate-0" : "rotate-0"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tp.shareTooltip}</p>
            </TooltipContent>
          </Tooltip>

          {canManage && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleEdit}
                    variant="default"
                    className="relative overflow-hidden group w-8 h-8 p-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tp.editTooltip}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onDelete}
                    variant="destructive"
                    className="relative overflow-hidden group w-8 h-8 p-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tp.deleteTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
