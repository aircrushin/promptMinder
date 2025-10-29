"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTeam } from "@/contexts/team-context";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { apiClient } from "@/lib/api-client";
import { useClipboard } from "@/lib/clipboard";
import { debounce } from "@/lib/debounce-utils";
import { PromptGrid, PromptGridSkeleton } from "@/components/prompt/PromptGrid";
import { NewPromptDialog } from "@/components/prompt/NewPromptDialog";
import { OptimizePromptDialog } from "@/components/prompt/OptimizePromptDialog";
import { Search, Tags, ChevronDown } from "lucide-react";

const TagFilter = dynamic(() => import("@/components/prompt/TagFilter"), {
  loading: () => <Skeleton className="h-10 w-32" />,
  ssr: false,
});

export default function PromptsPage() {
  const { t } = useLanguage();
  const { activeTeamId, isPersonal } = useTeam();
  const { toast } = useToast();
  const { copy } = useClipboard();
  const router = useRouter();
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState(null);
  const [showNewPromptDialog, setShowNewPromptDialog] = useState(false);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    title: "",
    content: "",
    description: "",
    tags: "Chatbot",
    version: "1.0.0",
    cover_img: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Optimize debounced search with proper cleanup
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
        setCurrentPage(1);
      }, 300),
    []
  );

  useEffect(() => {
    return () => {
      if (typeof debouncedSearch.cancel === "function") {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // 获取prompts数据的函数
  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      const normalizePrompt = (prompt) => ({
        ...prompt,
        version: prompt.version || "1.0",
        cover_img: prompt.cover_img || "/default-cover.jpg",
        tags: Array.isArray(prompt.tags)
          ? prompt.tags
          : (prompt.tags || "").split(",").filter(Boolean),
      });
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      if (selectedTags.length > 0) {
        params.tag = selectedTags[0];
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const options = activeTeamId ? { teamId: activeTeamId } : {};
      const data = await apiClient.getPrompts(params, options);

      if (data.prompts) {
        setPrompts(data.prompts.map(normalizePrompt));
        setPagination(data.pagination);
      } else {
        setPrompts(data.map(normalizePrompt));
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast({
        title: "获取失败",
        description: error.message || "无法获取提示词列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTeamId, currentPage, pageSize, searchQuery, selectedTags, toast]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCopy = useCallback(async (content) => {
    await copy(content);
  }, [copy]);

  const handleDelete = useCallback((id) => {
    setPromptToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!t?.promptsPage) return;
    
    try {
      await apiClient.deletePrompt(promptToDelete, activeTeamId ? { teamId: activeTeamId } : {});
      fetchPrompts();
      setDeleteDialogOpen(false);
      toast({
        description: t.promptsPage.deleteSuccess,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error deleting prompt:", error);
      toast({
        variant: "destructive",
        description: error.message || t.promptsPage.deleteError,
        duration: 2000,
      });
    }
  }, [promptToDelete, toast, t?.promptsPage, fetchPrompts, activeTeamId]);

  // 分页处理函数
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Memoize tag extraction to avoid recalculating on every render
  const allTags = useMemo(() => {
    return [
      ...new Set(
        prompts.flatMap((prompt) =>
          Array.isArray(prompt.tags) ? prompt.tags : []
        )
      ),
    ];
  }, [prompts]);

  const handleShare = useCallback(async (id) => {
    if (!t?.promptsPage) return;
    
    try {
      await apiClient.sharePrompt(id, activeTeamId ? { teamId: activeTeamId } : {});
      const shareUrl = `${window.location.origin}/share/${id}`;
      await copy(shareUrl);
    } catch (error) {
      console.error("Error sharing prompt:", error);
      toast({
        variant: "destructive",
        description: error.message || t.promptsPage.shareError,
        duration: 2000,
      });
    }
  }, [copy, toast, t?.promptsPage, activeTeamId]);

  // Group prompts by title for easier rendering
  const groupedPrompts = useMemo(() => {
    const groups = prompts.reduce((acc, prompt) => {
      const title = prompt.title || "Untitled";
      if (!acc[title]) {
        acc[title] = [];
      }
      acc[title].push(prompt);
      return acc;
    }, {});

    return Object.entries(groups).map(([title, versions]) => ({
      title,
      versions: [...versions].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    }));
  }, [prompts]);

  const showVersions = useCallback((versions) => {
    setSelectedVersions(versions);
  }, []);

  const handleOpenPrompt = useCallback(
    (id) => {
      router.push(`/prompts/${id}`);
    },
    [router]
  );

  const handleCreateNewVersion = useCallback(() => {
    if (selectedVersions?.length) {
      const latest = selectedVersions[0];
      router.push(`/prompts/${latest.id}/edit`);
    }
  }, [router, selectedVersions]);

  const handleCreatePrompt = useCallback(async () => {
    if (!t?.promptsPage) return;
    if (!newPrompt.title.trim() || !newPrompt.content.trim()) {
      toast({
        variant: "destructive",
        description: t.promptsPage.createValidation,
        duration: 2000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.createPrompt(
        {
          ...newPrompt,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: true,
        },
        activeTeamId ? { teamId: activeTeamId } : {}
      );

      fetchPrompts();

      setShowNewPromptDialog(false);
      setNewPrompt({
        title: "",
        content: "",
        description: "",
        tags: "Chatbot",
        version: "1.0.0",
        cover_img: "",
      });

      toast({
        description: t.promptsPage.createSuccess,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error creating prompt:", error);
      toast({
        variant: "destructive",
        description: error.message || t.promptsPage.createError,
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newPrompt, toast, t?.promptsPage, fetchPrompts, activeTeamId]);

  const handleCreateTag = useCallback(async (inputValue) => {
    try {
      await apiClient.createTag(
        { name: inputValue, scope: activeTeamId ? 'team' : 'personal' },
        activeTeamId ? { teamId: activeTeamId } : {}
      );
      const newOption = { value: inputValue, label: inputValue };
      setTagOptions((prev) => [...prev, newOption]);
      return newOption;
    } catch (error) {
      console.error("Error creating new tag:", error);
      toast({
        variant: "destructive",
        description: error.message || "创建标签失败",
        duration: 2000,
      });
    }
    return null;
  }, [toast, activeTeamId]);

  const updateNewPromptField = useCallback((field, value) => {
    setNewPrompt((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleOptimize = useCallback(async () => {
    if (!newPrompt.content.trim() || !t?.promptsPage) return;
    setIsOptimizing(true);
    setOptimizedContent("");
    setShowOptimizeModal(true);

    try {
      const response = await apiClient.generate(newPrompt.content);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let tempContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const jsonStr = line.replace(/^data: /, "").trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            const data = JSON.parse(jsonStr);
            if (data.choices?.[0]?.delta?.content) {
              tempContent += data.choices[0].delta.content;
              setOptimizedContent(tempContent);
            }
          } catch (e) {
            console.error(t.promptsPage.optimizeParsingError, e);
          }
        }
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast({
        variant: "destructive",
        description: error.message || t.promptsPage.optimizeRetry,
        duration: 2000,
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [newPrompt.content, t?.promptsPage, toast]);

  const applyOptimizedContent = useCallback(() => {
    setNewPrompt((prev) => ({ ...prev, content: optimizedContent }));
    setOptimizedContent("");
    setShowOptimizeModal(false);
  }, [optimizedContent]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTags, activeTeamId]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {});

        if (data?.team || data?.personal || data?.global) {
          const combined = [
            ...(data.team || []),
            ...(data.personal || []),
          ];
          const mappedTags = combined.map((tag) => ({
            value: tag.name,
            label: tag.name,
          }));
          setTagOptions(mappedTags);
        } else if (Array.isArray(data)) {
          const mappedTags = data.map((tag) => ({
            value: tag.name,
            label: tag.name,
          }));
          setTagOptions(mappedTags);
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast({
          title: "获取标签失败",
          description: error.message || "无法获取标签列表",
          variant: "destructive",
        });
      }
    };

    fetchTags();
  }, [toast, activeTeamId]);

  if (!t) return null;
  const tp = t.promptsPage;

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 py-8 sm:py-16 mx-auto max-w-7xl">
        <div className="space-y-8">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">{tp.title}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                  <span className="text-sm font-medium text-secondary-foreground">
                    {tp.totalPrompts.replace(
                      "{count}",
                      pagination.total.toString()
                    )}
                  </span>
                </div>
                {!isPersonal && activeTeamId && (
                  <Button asChild variant="outline" className="whitespace-nowrap">
                    <Link href="/teams">{tp.manageTeam}</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 md:gap-4">
              <div className="relative w-full md:w-[320px]">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  type="search"
                  onChange={(e) => debouncedSearch(e.target.value)}
                  placeholder={tp.searchPlaceholder}
                  className="w-full h-10 pl-9 pr-4 transition-all duration-200 ease-in-out border rounded-lg focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                />
              </div>
              {!isLoading && (
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-4">
                  <TagFilter
                    allTags={allTags}
                    selectedTags={selectedTags}
                    onTagSelect={setSelectedTags}
                    className="touch-manipulation w-full md:w-auto"
                    t={t}
                  />
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="group px-3 self-start md:self-auto"
                  >
                    <Link href="/tags">
                      <Tags className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      <span className="group-hover:text-primary transition-colors">
                        {tp.manageTags}
                      </span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8">
              <PromptGridSkeleton />
            </div>
          ) : (
            <>
              <PromptGrid
                groups={groupedPrompts}
                onCreatePrompt={() => setShowNewPromptDialog(true)}
                onCopyPrompt={handleCopy}
                onSharePrompt={handleShare}
                onDeletePrompt={handleDelete}
                onOpenVersions={showVersions}
                onOpenPrompt={handleOpenPrompt}
                translations={t}
              />

              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    pageSize={pagination.limit}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    showSizeChanger={true}
                    pageSizeOptions={[10, 20, 50]}
                    className="w-full"
                    t={t}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Dialog
        open={!!selectedVersions}
        onOpenChange={() => setSelectedVersions(null)}
      >
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden.Root>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden.Root>
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {tp.versionHistoryTitle}
            </DialogTitle>
            <Button size="sm" onClick={handleCreateNewVersion}>
              {tp.createNewVersion}
            </Button>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedVersions?.map((version) => (
              <Link
                key={version.id}
                href={`/prompts/${version.id}`}
                className="block"
              >
                <Card className="p-4 hover:bg-accent/50 cursor-pointer transition-colors border border-border/50 hover:border-primary/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-primary">
                        v{version.version}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden.Root>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">
              {tp.deleteConfirmTitle}
            </DialogTitle>
            <DialogDescription>{tp.deleteConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {tp.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {tp.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewPromptDialog
        open={showNewPromptDialog}
        onOpenChange={setShowNewPromptDialog}
        prompt={newPrompt}
        onFieldChange={updateNewPromptField}
        onSubmit={handleCreatePrompt}
        onCancel={() => setShowNewPromptDialog(false)}
        isSubmitting={isSubmitting}
        isOptimizing={isOptimizing}
        onOptimize={handleOptimize}
        tagOptions={tagOptions}
        onCreateTag={handleCreateTag}
        copy={tp}
      />
      <OptimizePromptDialog
        open={showOptimizeModal}
        onOpenChange={(open) => {
          setShowOptimizeModal(open);
          if (!open) {
            setOptimizedContent("");
          }
        }}
        copy={tp}
        isOptimizing={isOptimizing}
        optimizedContent={optimizedContent}
        onChangeContent={setOptimizedContent}
        onApply={applyOptimizedContent}
        onCancel={() => {
          setShowOptimizeModal(false);
          setOptimizedContent("");
        }}
      />
    </div>
  );
} 
