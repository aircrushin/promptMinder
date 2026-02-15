import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { DEFAULTS, UI_CONFIG } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export function usePrompts(filters = {}) {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getPrompts(filters);
      
      const processedPrompts = data.map(prompt => ({
        ...prompt,
        version: prompt.version || DEFAULTS.PROMPT_VERSION,
        cover_img: prompt.cover_img || DEFAULTS.COVER_IMAGE,
        tags: prompt.tags?.split(',') || []
      }));
      
      setPrompts(processedPrompts);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setError(error);
      toast({
        title: '获取失败',
        description: error.message || '无法获取提示词列表',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const createPrompt = useCallback(async (promptData) => {
    try {
      const newPrompt = await apiClient.createPrompt({
        id: crypto.randomUUID(),
        ...promptData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: true
      });

      setPrompts(prev => [newPrompt, ...prev]);
      
      toast({
        title: '创建成功',
        description: '提示词已成功创建',
      });
      
      return newPrompt;
    } catch (error) {
      toast({
        title: '创建失败',
        description: error.message || '创建提示词失败',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const updatePrompt = useCallback(async (id, promptData) => {
    try {
      const updatedPrompt = await apiClient.updatePrompt(id, {
        ...promptData,
        updated_at: new Date().toISOString(),
      });

      setPrompts(prev => 
        prev.map(p => p.id === id ? { ...p, ...updatedPrompt } : p)
      );
      
      toast({
        title: '更新成功',
        description: '提示词已成功更新',
      });
      
      return updatedPrompt;
    } catch (error) {
      toast({
        title: '更新失败',
        description: error.message || '更新提示词失败',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const deletePrompt = useCallback(async (id) => {
    try {
      await apiClient.deletePrompt(id);
      setPrompts(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: '删除成功',
        description: '提示词已成功删除',
      });
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message || '删除提示词失败',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  const sharePrompt = useCallback(async (id) => {
    try {
      await apiClient.sharePrompt(id);
      const shareUrl = `${window.location.origin}/share/${id}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: '分享成功',
        description: '分享链接已复制到剪贴板',
      });
    } catch (error) {
      toast({
        title: '分享失败',
        description: error.message || '无法生成分享链接',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const copyPrompt = useCallback(async (promptData) => {
    try {
      const newPrompt = await apiClient.copyPrompt(promptData);
      setPrompts(prev => [newPrompt, ...prev]);
      
      toast({
        title: '导入成功',
        description: '提示词已导入到你的库中',
      });
      
      return newPrompt;
    } catch (error) {
      toast({
        title: '导入失败',
        description: error.message || '无法导入提示词',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // 按标题分组提示词
  const groupedPrompts = useMemo(() => {
    return prompts.reduce((acc, prompt) => {
      if (!acc[prompt.title]) {
        acc[prompt.title] = [];
      }
      acc[prompt.title].push(prompt);
      return acc;
    }, {});
  }, [prompts]);

  return {
    prompts,
    groupedPrompts,
    isLoading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    sharePrompt,
    copyPrompt,
  };
}

// Hook for searching and filtering prompts
export function usePromptSearch(prompts, searchQuery, selectedTags) {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, UI_CONFIG.DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPrompts = useMemo(() => {
    let filtered = prompts || [];

    // 按搜索查询过滤
    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(prompt => 
        prompt.title?.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.content?.toLowerCase().includes(query) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按选中的标签过滤
    if (selectedTags && selectedTags.length > 0) {
      filtered = filtered.filter(prompt =>
        selectedTags.some(tag => prompt.tags?.includes(tag))
      );
    }

    return filtered;
  }, [prompts, debouncedQuery, selectedTags]);

  return {
    filteredPrompts,
    debouncedQuery,
  };
} 