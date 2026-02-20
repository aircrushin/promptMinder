'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 格式化相对时间
function formatRelativeTime(date) {
  if (!date) return '';
  const timestamp = new Date(date).getTime();
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (weeks < 4) return `${weeks}周前`;
  if (months < 12) return `${months}个月前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 按日期分组
function groupConversationsByDate(conversations) {
  const groups = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);

  conversations.forEach((conv) => {
    const date = new Date(conv.lastMessageAt);
    if (date >= today) {
      groups.today.push(conv);
    } else if (date >= yesterday) {
      groups.yesterday.push(conv);
    } else if (date >= last7Days) {
      groups.last7Days.push(conv);
    } else if (date >= last30Days) {
      groups.last30Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

// 单个对话项组件
function ConversationItem({
  conversation,
  isActive,
  onClick,
  onRename,
  onDelete,
  isEditing,
  editingTitle,
  setEditingTitle,
  onSaveEdit,
  onCancelEdit,
}) {
  const [showActions, setShowActions] = useState(false);

  if (isEditing) {
    return (
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <Input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            autoFocus
            className="h-7 text-xs px-2 py-1"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={onSaveEdit}
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={onCancelEdit}
          >
            <X className="h-3.5 w-3.5 text-zinc-400" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
        isActive
          ? 'bg-zinc-100 text-zinc-900'
          : 'hover:bg-zinc-50 text-zinc-600'
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{conversation.title}</p>
          <p className="text-[11px] text-zinc-400">
            {formatRelativeTime(conversation.lastMessageAt)}
          </p>
        </div>
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// 分组标题
function GroupTitle({ title }) {
  const titles = {
    today: '今天',
    yesterday: '昨天',
    last7Days: '过去7天',
    last30Days: '过去30天',
    older: '更早',
  };

  return (
    <div className="px-3 py-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
      {titles[title] || title}
    </div>
  );
}

// 主组件
export function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onConversationChange,
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { activeTeamId } = useTeam();

  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await apiClient.getAgentConversations({
        teamId: activeTeamId,
        limit: 100,
      });
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({
        variant: 'destructive',
        description: '加载对话列表失败',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTeamId, toast]);

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 过滤对话
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // 按日期分组
  const groupedConversations = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  // 创建新对话
  const handleCreateConversation = useCallback(async () => {
    try {
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const data = await apiClient.createAgentConversation(
        { sessionId, title: '新对话' },
        { teamId: activeTeamId }
      );
      
      const newConversation = data.conversation;
      setConversations((prev) => [newConversation, ...prev]);
      onSelectConversation?.(newConversation);
      onCreateConversation?.(newConversation);
      
      toast({
        description: '新对话已创建',
      });
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        variant: 'destructive',
        description: '创建对话失败',
      });
    }
  }, [activeTeamId, onSelectConversation, onCreateConversation, toast]);

  // 选择对话
  const handleSelectConversation = useCallback((conversation) => {
    onSelectConversation?.(conversation);
  }, [onSelectConversation]);

  // 开始重命名
  const handleStartRename = useCallback((conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  }, []);

  // 保存重命名
  const handleSaveRename = useCallback(async () => {
    if (!editingId || !editingTitle.trim()) {
      setEditingId(null);
      return;
    }

    try {
      await apiClient.updateAgentConversation(
        editingId,
        { title: editingTitle.trim() },
        { teamId: activeTeamId }
      );
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === editingId
            ? { ...conv, title: editingTitle.trim() }
            : conv
        )
      );
      
      onConversationChange?.();
      toast({
        description: '对话已重命名',
      });
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast({
        variant: 'destructive',
        description: '重命名失败',
      });
    } finally {
      setEditingId(null);
      setEditingTitle('');
    }
  }, [editingId, editingTitle, activeTeamId, onConversationChange, toast]);

  // 取消重命名
  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditingTitle('');
  }, []);

  // 删除对话
  const handleDelete = useCallback((conversationId) => {
    setDeleteTargetId(conversationId);
    setDeleteDialogOpen(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      await apiClient.deleteAgentConversation(deleteTargetId, { teamId: activeTeamId });
      
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== deleteTargetId)
      );
      
      // 如果删除的是当前对话，通知父组件
      if (deleteTargetId === currentConversationId) {
        onSelectConversation?.(null);
      }
      
      onConversationChange?.();
      toast({
        description: '对话已删除',
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        variant: 'destructive',
        description: '删除失败',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  }, [deleteTargetId, activeTeamId, currentConversationId, onSelectConversation, onConversationChange, toast]);

  // 刷新对话列表
  const refreshConversations = useCallback(() => {
    loadConversations();
  }, [loadConversations]);

  // 暴露刷新方法给父组件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshConversationSidebar = refreshConversations;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshConversationSidebar;
      }
    };
  }, [refreshConversations]);

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-zinc-200 bg-zinc-50/50 flex flex-col items-center py-3">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 mb-3"
          onClick={() => setIsCollapsed(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCreateConversation}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-700">历史对话</h2>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleCreateConversation}
                title="新建对话"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setIsCollapsed(true)}
                title="收起"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="搜索对话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Clock className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">
                {searchQuery ? '没有找到匹配的对话' : '暂无历史对话'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={handleCreateConversation}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  开始新对话
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {Object.entries(groupedConversations).map(([groupName, groupConvs]) => {
                if (groupConvs.length === 0) return null;
                return (
                  <div key={groupName}>
                    <GroupTitle title={groupName} />
                    <div className="space-y-0.5">
                      {groupConvs.map((conv) => (
                        <ConversationItem
                          key={conv.id}
                          conversation={conv}
                          isActive={conv.id === currentConversationId}
                          onClick={() => handleSelectConversation(conv)}
                          onRename={() => handleStartRename(conv)}
                          onDelete={() => handleDelete(conv.id)}
                          isEditing={editingId === conv.id}
                          editingTitle={editingTitle}
                          setEditingTitle={setEditingTitle}
                          onSaveEdit={handleSaveRename}
                          onCancelEdit={handleCancelRename}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，确定要删除这个对话吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ConversationSidebar;
