'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal';
import { Trash2, Pencil, ArrowLeft, CheckSquare, Square, Globe } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { apiClient } from '@/lib/api-client';

const TagsSkeleton = () => {
  const { t } = useLanguage();
  if (!t) return null;
  const tp = t.tagsPage;
  if (!tp) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="space-y-8">
        <div>
          <div className="h-6 bg-gray-200 rounded w-1/5 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-6 bg-gray-200 rounded w-1/5 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 按类别分组公共标签
const groupPublicTagsByCategory = (tags) => {
  const groups = {};
  tags.forEach(tag => {
    const category = tag.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tag);
  });
  return groups;
};

// 类别名称映射
const categoryNames = {
  general: '通用',
  role: '角色',
  content: '内容创作',
  tech: '技术开发',
  education: '教育学习',
  business: '商业分析',
  lifestyle: '生活方式',
  other: '其他',
};

export default function TagsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { activeTeamId } = useTeam();
  const [teamTags, setTeamTags] = useState([]);
  const [personalTags, setPersonalTags] = useState([]);
  const [publicTags, setPublicTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [editingTag, setEditingTag] = useState({ id: null, name: '' });
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {});

      // 使用新的结构化响应
      setTeamTags(Array.isArray(data?.team) ? data.team : []);
      setPersonalTags(Array.isArray(data?.personal) ? data.personal : []);
      setPublicTags(Array.isArray(data?.public) ? data.public : []);
    } catch (err) {
      setError(err.message || t?.tagsPage?.fetchError || 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, [t, activeTeamId]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (!t) return <TagsSkeleton />;
  const tp = t.tagsPage;
  if (!tp) return <TagsSkeleton />;

  // 根据上下文确定可编辑的标签列表
  const editableTags = activeTeamId ? teamTags : personalTags;

  const handleDelete = async (tagId) => {
    setSelectedTagId(tagId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deleteTag(selectedTagId);
      setDeleteModalOpen(false);
      fetchTags();
    } catch (err) {
      setError(err.message || tp.deleteError);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBatchDelete = () => {
    if (selectedTags.size === 0) return;
    setBatchDeleteModalOpen(true);
  };

  const confirmBatchDelete = async () => {
    try {
      await apiClient.deleteTags(Array.from(selectedTags));
      setBatchDeleteModalOpen(false);
      setSelectedTags(new Set());
      setIsBatchMode(false);
      fetchTags();
    } catch (err) {
      setError(err.message || tp.batchDeleteError);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag({ id: tag.id, name: tag.name });
    setEditModalOpen(true);
  };

  const confirmEdit = async () => {
    try {
      await apiClient.updateTag(editingTag.id, { name: editingTag.name });
      setEditModalOpen(false);
      fetchTags();
    } catch (err) {
      setError(err.message || tp.updateError);
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleTagSelection = (tagId) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tagId)) {
      newSelected.delete(tagId);
    } else {
      newSelected.add(tagId);
    }
    setSelectedTags(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTags.size === editableTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(editableTags.map(tag => tag.id)));
    }
  };

  const exitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedTags(new Set());
  };

  // 按类别分组公共标签
  const publicTagsByCategory = groupPublicTagsByCategory(publicTags);

  if (loading) {
    return <TagsSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.push('/prompts')}
          className="py-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm text-gray-500">{tp.backToList}</span>
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{tp.title}</h1>
        <div className="flex items-center gap-2">
          {isBatchMode ? (
            <>
              <span className="text-sm text-gray-600">
                {tp.selectedCount.replace('{count}', selectedTags.size)}
              </span>
              <button
                onClick={exitBatchMode}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {tp.cancel}
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedTags.size === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tp.batchDelete}
              </button>
            </>
          ) : (
            <>
              {editableTags.length > 0 && (
                <button
                  onClick={() => setIsBatchMode(true)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {tp.selectMode || '批量管理'}
                </button>
              )}
              <Link
                href="/tags/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {tp.newTagButton}
              </Link>
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-8">
        {/* 公共标签部分 - 所有上下文都显示 */}
        {publicTags.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">{tp.publicTagsTitle || '公共标签'}</h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                {tp.publicTagDescription || '所有用户都可以使用'}
              </span>
            </div>
            <div className="space-y-4">
              {Object.entries(publicTagsByCategory).map(([category, tags]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {categoryNames[category] || category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="group relative bg-white rounded-lg px-4 py-2 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                        title={tag.description || tag.name}
                      >
                        <div className="inline-flex items-center">
                          <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                            {tp.publicTagBadge || '公共'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 团队标签部分 */}
        {activeTeamId ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{tp.teamTagsTitle || '团队标签'}</h2>
              {isBatchMode && editableTags.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {selectedTags.size === editableTags.length ? tp.deselectAll : tp.selectAll}
                </button>
              )}
            </div>
            {editableTags.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                {tp.noTeamTags || '暂无团队标签，点击右上角创建新标签'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {editableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => isBatchMode && toggleTagSelection(tag.id)}
                    className={`group relative bg-gray-50 rounded-lg px-4 py-2 border transition-colors ${
                      isBatchMode
                        ? selectedTags.has(tag.id)
                          ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                          : 'border-gray-200 hover:border-indigo-300 cursor-pointer'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="inline-flex items-center">
                      {isBatchMode && (
                        <span className="mr-2">
                          {selectedTags.has(tag.id) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">{tp.teamTagBadge || '团队'}</span>
                    </div>
                    {!isBatchMode && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tag);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tag.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 个人标签部分 */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{tp.privateTagsTitle || '我的标签'}</h2>
              {isBatchMode && editableTags.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {selectedTags.size === editableTags.length ? tp.deselectAll : tp.selectAll}
                </button>
              )}
            </div>
            {editableTags.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                {tp.noPrivateTags || '暂无个人标签，点击右上角创建新标签'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {editableTags.map((tag) => (
                  <div
                    key={tag.id}
                    onClick={() => isBatchMode && toggleTagSelection(tag.id)}
                    className={`group relative bg-gray-50 rounded-lg px-4 py-2 border transition-colors ${
                      isBatchMode
                        ? selectedTags.has(tag.id)
                          ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                          : 'border-gray-200 hover:border-indigo-300 cursor-pointer'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="inline-flex items-center">
                      {isBatchMode && (
                        <span className="mr-2">
                          {selectedTags.has(tag.id) ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded-full">{tp.privateTagBadge || '个人'}</span>
                    </div>
                    {!isBatchMode && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tag);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tag.id);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-full"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 单个删除确认弹窗 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{tp.deleteConfirmTitle}</ModalTitle>
          </ModalHeader>
          <p className="py-4">{tp.deleteConfirmDescription}</p>
          <ModalFooter>
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              {tp.cancel}
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {tp.delete}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* 批量删除确认弹窗 */}
      <Modal isOpen={batchDeleteModalOpen} onClose={() => setBatchDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{tp.batchDeleteConfirmTitle}</ModalTitle>
          </ModalHeader>
          <p className="py-4">{tp.batchDeleteConfirmDescription.replace('{count}', selectedTags.size)}</p>
          <ModalFooter>
            <button
              onClick={() => setBatchDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              {tp.cancel}
            </button>
            <button
              onClick={confirmBatchDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {tp.delete}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{tp.editModalTitle}</ModalTitle>
          </ModalHeader>
          <div className="py-4">
            <Input
              value={editingTag.name}
              onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
              placeholder={tp.editPlaceholder}
              className="w-full"
            />
          </div>
          <ModalFooter>
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              {tp.cancel}
            </button>
            <button
              onClick={confirmEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {tp.save}
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
