'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import { Download, Loader2, Sparkles, Tag, X } from 'lucide-react';

export function ImportPromptDialog({ open, onOpenChange, codeContent, onConfirm }) {
  const { activeTeamId } = useTeam();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const codeString = String(codeContent || '').replace(/\n$/, '');

  useEffect(() => {
    if (!open) return;

    setSelectedTags([]);
    setTagInput('');
    setTitle('');
    setDescription('');

    // Fetch available tags
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {});
        const teamTags = Array.isArray(data?.team) ? data.team : [];
        const personalTags = Array.isArray(data?.personal) ? data.personal : [];
        const fallback = Array.isArray(data) ? data : [];
        const combined = teamTags.length || personalTags.length
          ? [...teamTags, ...personalTags]
          : fallback;
        setAvailableTags(Array.from(new Map(combined.map(t => [t.name, t])).values()));
      } catch {
        // ignore tag fetch errors
      }
    };

    // AI-generate title + description
    const generateMeta = async () => {
      setIsSummarizing(true);
      try {
        const res = await fetch('/api/generate/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: codeString }),
        });
        if (!res.ok) throw new Error('meta api failed');
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
      } catch {
        const firstLine = codeString.split('\n').find(l => l.trim()) || '';
        setTitle(firstLine.slice(0, 60) || '优化后的提示词');
      } finally {
        setIsSummarizing(false);
      }
    };

    fetchTags();
    generateMeta();
  }, [open, activeTeamId, codeString]);

  const addTag = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    setSelectedTags(prev => [...prev, trimmed]);
    setTagInput('');
  }, [selectedTags]);

  const removeTag = useCallback((name) => {
    setSelectedTags(prev => prev.filter(t => t !== name));
  }, []);

  const handleTagKeyDown = useCallback((e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  }, [tagInput, selectedTags, addTag, removeTag]);

  const handleConfirm = useCallback(async () => {
    if (!title.trim() || isImporting) return;
    setIsImporting(true);
    try {
      await onConfirm({
        title: title.trim(),
        content: codeString,
        description: description.trim(),
        tags: selectedTags.join(','),
      });
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  }, [title, description, selectedTags, codeString, onConfirm, onOpenChange, isImporting]);

  const suggestions = useMemo(() =>
    availableTags.filter(t =>
      !selectedTags.includes(t.name) &&
      (tagInput ? t.name.toLowerCase().includes(tagInput.toLowerCase()) : true)
    ).slice(0, 14),
    [availableTags, selectedTags, tagInput]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-emerald-600" />
            导入提示词
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-700">标题</label>
              {isSummarizing && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
                  AI 生成中...
                </span>
              )}
            </div>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isSummarizing ? 'AI 正在生成标题...' : '为这个提示词起个名字'}
              disabled={isSummarizing}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">描述</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isSummarizing ? 'AI 正在生成描述...' : '简短描述这个提示词的用途（选填）'}
              disabled={isSummarizing}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Tag className="h-3.5 w-3.5 text-zinc-400" />
              标签
            </label>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-emerald-900 transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="输入标签名，按 Enter 或 , 添加自定义标签"
              className="text-sm"
            />

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-400">点击添加已有标签</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(tag => (
                    <button
                      key={tag.id || tag.name}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-xs hover:bg-zinc-200 hover:text-zinc-700 transition-colors"
                    >
                      + {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content preview */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">内容预览</label>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {codeString.slice(0, 400)}{codeString.length > 400 ? '\n...' : ''}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!title.trim() || isImporting || isSummarizing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                导入中...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                确认导入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
