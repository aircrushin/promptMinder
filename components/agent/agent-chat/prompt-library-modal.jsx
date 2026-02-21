'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import { Library, Search, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PromptLibraryModal({ open, onOpenChange, onSelect }) {
  const { t, language } = useLanguage();
  const { activeTeamId } = useTeam();
  const [prompts, setPrompts] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelectedTag(null);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [promptsData, tagsData] = await Promise.all([
          apiClient.getPrompts({}, activeTeamId ? { teamId: activeTeamId } : {}),
          apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {}),
        ]);
        setPrompts(Array.isArray(promptsData?.prompts) ? promptsData.prompts : []);

        const teamTags = Array.isArray(tagsData?.team) ? tagsData.team : [];
        const personalTags = Array.isArray(tagsData?.personal) ? tagsData.personal : [];
        const fallback = Array.isArray(tagsData) ? tagsData : [];
        const combined = teamTags.length || personalTags.length
          ? [...teamTags, ...personalTags]
          : fallback;
        setTags(Array.from(new Map(combined.map(t => [t.name, t])).values()));
      } catch (err) {
        console.error('Failed to fetch prompt library:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, activeTeamId]);

  const filtered = useMemo(() => {
    return prompts.filter(p => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchesTag = !selectedTag ||
        (Array.isArray(p.tags) && p.tags.some(tag =>
          (typeof tag === 'string' ? tag : tag?.name) === selectedTag
        ));
      return matchesSearch && matchesTag;
    });
  }, [prompts, search, selectedTag]);

  const handleSelect = (prompt) => {
    onSelect(prompt);
    onOpenChange(false);
  };

  const pl = t.agent?.promptLibrary || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
            <Library className="h-5 w-5 text-amber-500" />
            {pl.title || (language === 'zh' ? '从提示词库导入' : 'Import from Prompt Library')}
          </DialogTitle>
          <p className="text-sm text-zinc-500 mt-0.5">
            {pl.subtitle || (language === 'zh' ? '选择一个提示词作为对话起点' : 'Select a prompt to start your conversation')}
          </p>
        </DialogHeader>

        {/* Search + tag filters */}
        <div className="px-6 py-3 border-b border-zinc-100 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={pl.searchPlaceholder || (language === 'zh' ? '搜索提示词...' : 'Search prompts...')}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100 transition-all"
            />
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  !selectedTag
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                )}
              >
                {pl.allTags || (language === 'zh' ? '全部' : 'All')}
              </button>
              {tags.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all',
                    selectedTag === tag.name
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  )}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prompt list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 gap-2 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{pl.loading || (language === 'zh' ? '加载中...' : 'Loading...')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-400">
              <FileText className="h-8 w-8 text-zinc-200" />
              <span className="text-sm">
                {search
                  ? (pl.noResults || (language === 'zh' ? '未找到匹配的提示词' : 'No prompts found'))
                  : (pl.empty || (language === 'zh' ? '暂无提示词，去创建一个吧' : 'No prompts yet. Create one first!'))}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {filtered.map(prompt => {
                const promptTags = Array.isArray(prompt.tags)
                  ? prompt.tags.map(t => typeof t === 'string' ? t : t?.name).filter(Boolean)
                  : [];
                return (
                  <button
                    key={prompt.id}
                    onClick={() => handleSelect(prompt)}
                    className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate group-hover:text-zinc-700">
                        {prompt.title || (language === 'zh' ? '无标题' : 'Untitled')}
                      </p>
                      {prompt.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{prompt.description}</p>
                      )}
                      {prompt.content && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-mono leading-relaxed">
                          {prompt.content.slice(0, 120)}{prompt.content.length > 120 ? '…' : ''}
                        </p>
                      )}
                      {promptTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {promptTags.slice(0, 4).map(tagName => (
                            <span
                              key={tagName}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-medium"
                            >
                              {tagName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                        {pl.usePrompt || (language === 'zh' ? '使用' : 'Use')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
