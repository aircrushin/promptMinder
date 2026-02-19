'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal';
import { Trash2, Pencil, ArrowLeft, CheckSquare, Square } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
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

export default function TagsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [tags, setTags] = useState([]);
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
      const data = await apiClient.getTags();

      // Normalize API response to a flat array for rendering safety
      const teamTags = Array.isArray(data?.team) ? data.team : [];
      const personalTags = Array.isArray(data?.personal) ? data.personal : [];
      const globalTags = Array.isArray(data?.global) ? data.global : [];
      const fallback = Array.isArray(data) ? data : [];

      // Prefer structured response if present; otherwise fallback to legacy array
      const normalized = (teamTags.length || personalTags.length || globalTags.length)
        ? [...teamTags, ...personalTags, ...globalTags]
        : fallback;

      setTags(normalized);
    } catch (err) {
      setError(err.message || t?.tagsPage?.fetchError || 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, [t]); // Add t to dependencies

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (!t) return <TagsSkeleton />;
  const tp = t.tagsPage;
  if (!tp) return <TagsSkeleton />;

  const privateTags = tags.filter(tag => tag.user_id);

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
    if (selectedTags.size === privateTags.length) {
      setSelectedTags(new Set());
    } else {
      setSelectedTags(new Set(privateTags.map(tag => tag.id)));
    }
  };

  const exitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedTags(new Set());
  };

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
              {privateTags.length > 0 && (
                <button
                  onClick={() => setIsBatchMode(true)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {tp.selectAll}
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
      {tags.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          {tp.noTagsMessage}
        </div>
      ) : (
        <div className="space-y-8">
          {/* 公共标签部分 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">{tp.publicTagsTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tags.filter(tag => !tag.user_id).map((tag) => (
                <div
                  key={tag.id}
                  className="group relative bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="inline-flex items-center">
                    <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                  </div>
                </div>
              ))}
              {tags.filter(tag => !tag.user_id).length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-4">
                  {tp.noPublicTags}
                </div>
              )}
            </div>
          </div>

          {/* 私有标签部分 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{tp.privateTagsTitle}</h2>
              {isBatchMode && privateTags.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {selectedTags.size === privateTags.length ? tp.deselectAll : tp.selectAll}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {privateTags.map((tag) => (
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
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded-full">{tp.privateTagBadge}</span>
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
              {privateTags.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-4">
                  {tp.noPrivateTags}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
