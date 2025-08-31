"use client";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  PlusCircle,
  ChevronDown,
  Copy,
  Share2,
  Trash2,
  Clock,
  Tags,
  Wand2,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { extractVariables } from "@/lib/promptVariables";
import { apiClient } from "@/lib/api-client";
import { useClipboard } from "@/lib/clipboard";
import { Pagination } from "@/components/ui/pagination";

// Dynamic imports for heavy components with lazy loading
const PromptList = dynamic(() => import("@/components/prompt/PromptList"), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="p-5 animate-pulse">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-[180px]" />
                <Skeleton className="h-4 w-[240px]" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
  ssr: false,
});

const TagFilter = dynamic(() => import("@/components/prompt/TagFilter"), {
  loading: () => <Skeleton className="h-10 w-32" />,
  ssr: false,
});

const CreatableSelect = dynamic(() => import("react-select/creatable"), {
  loading: () => <Skeleton className="h-10 w-full" />,
  ssr: false,
});

// Custom debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const PromptCardSkeleton = () => {
  return (
    <Card className="group relative p-5 hover:shadow-md transition-all bg-card border border-border/40">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-[180px]" />
            <Skeleton className="h-4 w-[240px]" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </Card>
  );
};

const PromptListSkeleton = () => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card className="group relative border p-5 hover:shadow-md transition-all bg-card cursor-pointer border-dashed h-[180px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
      </Card>
      {[...Array(5)].map((_, index) => (
        <PromptCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Modified NewPromptCard with enhanced styling
const NewPromptCard = ({ onClick }) => {
  const { t } = useLanguage();
  if (!t) return null;
  return (
    <Card
      onClick={onClick}
      className="group relative border p-5 hover:shadow-xl transition-all duration-300 ease-in-out bg-card cursor-pointer border-dashed h-[180px] flex items-center justify-center overflow-hidden"
    >
      <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:scale-110 transition-transform duration-300">
        <div className="bg-primary/10 p-3 rounded-full">
          <PlusCircle className="h-8 w-8 text-primary" />
        </div>
        <span className="text-sm font-medium">
          {t.promptsPage.newPromptCard}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
};

export default function PromptsPage() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { copy } = useClipboard();
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
    () => debounce((value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  // 获取prompts数据的函数
  const fetchPrompts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      
      if (selectedTags.length > 0) {
        params.tag = selectedTags[0];
      }
      
      const data = await apiClient.getPrompts(params);
      
      if (data.prompts) {
        setPrompts(
          data.prompts.map((prompt) => ({
            ...prompt,
            version: prompt.version || "1.0",
            cover_img: prompt.cover_img || "/default-cover.jpg",
            tags: prompt.tags?.split(",") || [],
          }))
        );
        setPagination(data.pagination);
      } else {
        setPrompts(
          data.map((prompt) => ({
            ...prompt,
            version: prompt.version || "1.0",
            cover_img: prompt.cover_img || "/default-cover.jpg",
            tags: prompt.tags?.split(",") || [],
          }))
        );
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
  }, [currentPage, pageSize, selectedTags, toast]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCopy = useCallback(async (content) => {
    await copy(content);
  }, [copy]);

  const handleDelete = useCallback(async (id) => {
    setPromptToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!t?.promptsPage) return;
    
    try {
      await apiClient.deletePrompt(promptToDelete);
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
  }, [promptToDelete, toast, t?.promptsPage, fetchPrompts]);

  // 分页处理函数
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Memoize expensive filtering operations for local filtering (if needed)
  const filteredPrompts = useMemo(() => {
    if (!searchQuery) return prompts;
    
    return prompts.filter((prompt) => {
      const matchesSearch =
        prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [prompts, searchQuery]);

  // Memoize tag extraction to avoid recalculating on every render
  const allTags = useMemo(() => {
    return [...new Set(prompts.flatMap((prompt) => prompt.tags))];
  }, [prompts]);

  const handleShare = useCallback(async (id) => {
    if (!t?.promptsPage) return;
    
    try {
      await apiClient.sharePrompt(id);
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
  }, [copy, toast, t?.promptsPage]);

  // Memoize prompt grouping to avoid recalculating on every render
  const groupedPrompts = useMemo(() => {
    return filteredPrompts.reduce((acc, prompt) => {
      if (!acc[prompt.title]) {
        acc[prompt.title] = [];
      }
      acc[prompt.title].push(prompt);
      return acc;
    }, {});
  }, [filteredPrompts]);

  const showVersions = useCallback((e, versions) => {
    e.preventDefault();
    setSelectedVersions(versions);
  }, []);

  const handleCreateNewVersion = useCallback(() => {
    if (selectedVersions?.length) {
      const latest = selectedVersions[0];
      window.location.href = `/prompts/${latest.id}/edit`;
    }
  }, [selectedVersions]);

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
      const newPromptData = await apiClient.createPrompt({
        ...newPrompt,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: true,
      });

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
  }, [newPrompt, toast, t?.promptsPage, fetchPrompts]);

  const handleCreateTag = useCallback(async (inputValue) => {
    try {
      await apiClient.createTag({ name: inputValue });
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
  }, [toast]);

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

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    setCurrentPage(1);
    fetchPrompts();
  }, [selectedTags]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags();
        const mappedTags = data.map((tag) => ({
          value: tag.name,
          label: tag.name,
        }));
        setTagOptions(mappedTags);
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
  }, [toast]);

  if (!t) return null;
  const tp = t.promptsPage;

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 py-8 sm:py-16 mx-auto max-w-7xl">
        <div className="space-y-8">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">{tp.title}</h1>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                <span className="text-sm font-medium text-secondary-foreground">
                  {tp.totalPrompts.replace(
                    "{count}",
                    pagination.total.toString()
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
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
                <>
                  <TagFilter
                    allTags={allTags}
                    selectedTags={selectedTags}
                    onTagSelect={setSelectedTags}
                    className="touch-manipulation w-full md:w-auto"
                    t={t}
                  />
                  <Link href="/tags" className="w-full md:w-auto">
                    <Button variant="outline" className="w-full group">
                      <Tags className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                      <span className="group-hover:text-primary transition-colors">
                        {tp.manageTags}
                      </span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8">
              <PromptListSkeleton />
            </div>
          ) : (
            <>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <NewPromptCard onClick={() => setShowNewPromptDialog(true)} />
                {Object.entries(groupedPrompts).map(([title, versions]) => {
                  const latestPrompt = versions[0];
                  return (
                    <Card
                      key={title}
                      className="group relative rounded-lg border p-5 hover:shadow-lg transition-all duration-300 ease-in-out bg-card cursor-pointer overflow-hidden"
                      onClick={(e) => {
                        e.preventDefault();
                        if (versions.length > 1) {
                          showVersions(e, versions);
                        } else {
                          window.location.href = `/prompts/${latestPrompt.id}`;
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                              {title}
                            </h3>
                            {latestPrompt.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {latestPrompt.description}
                              </p>
                            )}
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(latestPrompt.content);
                                }}
                                className="h-8 w-8 hover:bg-accent hover:text-primary"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(latestPrompt.id);
                                }}
                                className="h-8 w-8 hover:bg-accent hover:text-primary"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(latestPrompt.id);
                                }}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {(latestPrompt.tags
                            ? Array.isArray(latestPrompt.tags)
                              ? latestPrompt.tags
                              : latestPrompt.tags
                                  .split(",")
                                  .filter((tag) => tag.trim())
                            : []
                          ).map((tag) => (
                            <span
                              key={tag}
                              className="bg-secondary/50 text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(latestPrompt.updated_at).toLocaleString()}
                          </div>
                          {(() => {
                            const variables = extractVariables(
                              latestPrompt.content
                            );
                            return (
                              variables.length > 0 && (
                                <div className="flex items-center gap-1 ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h4"
                                    />
                                  </svg>
                                  <span>
                                    {t?.variableInputs?.variableCount?.replace(
                                      "{count}",
                                      variables.length.toString()
                                    ) || `${variables.length} 变量`}
                                  </span>
                                </div>
                              )
                            );
                          })()}
                          {versions.length > 1 && (
                            <div className="flex items-center gap-1 ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              <span>
                                {tp.versionsCount.replace(
                                  "{count}",
                                  versions.length.toString()
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              {/* 分页组件 */}
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

      <Dialog open={showNewPromptDialog} onOpenChange={setShowNewPromptDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thumb-muted/50 scrollbar-track-background">
          <VisuallyHidden.Root>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle className="text-xl">{tp.newPromptTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                {tp.formTitleLabel}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                value={newPrompt.title}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, title: e.target.value })
                }
                placeholder={tp.formTitlePlaceholder}
                className="focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium">
                {tp.formContentLabel}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="content"
                  value={newPrompt.content}
                  onChange={(e) =>
                    setNewPrompt({ ...newPrompt, content: e.target.value })
                  }
                  placeholder={tp.formContentPlaceholder}
                  className="min-h-[200px] pr-10 focus-visible:ring-primary/30"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 hover:bg-accent hover:text-primary"
                  onClick={handleOptimize}
                  disabled={!newPrompt.content.trim() || isOptimizing}
                >
                  {isOptimizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{tp.variableTip}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {tp.formDescriptionLabel}
              </Label>
              <Textarea
                id="description"
                value={newPrompt.description}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, description: e.target.value })
                }
                placeholder={tp.formDescriptionPlaceholder}
                className="focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-medium">
                {tp.formTagsLabel}
              </Label>
              <CreatableSelect
                isMulti
                value={
                  newPrompt.tags
                    ? newPrompt.tags
                        .split(",")
                        .map((tag) => ({ value: tag, label: tag }))
                    : []
                }
                onChange={(selected) => {
                  const tags = selected
                    ? selected.map((option) => option.value).join(",")
                    : "";
                  setNewPrompt({ ...newPrompt, tags });
                }}
                options={tagOptions}
                onCreateOption={async (inputValue) => {
                  const newOption = await handleCreateTag(inputValue);
                  if (newOption) {
                    const newTags = newPrompt.tags
                      ? `${newPrompt.tags},${inputValue}`
                      : inputValue;
                    setNewPrompt({ ...newPrompt, tags: newTags });
                  }
                }}
                placeholder={tp.formTagsPlaceholder}
                classNamePrefix="select"
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: "hsl(var(--background))",
                    borderColor: state.isFocused
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                    borderRadius: "calc(var(--radius) - 2px)",
                    boxShadow: state.isFocused
                      ? "0 0 0 2px hsl(var(--primary)/30%)"
                      : "none",
                    "&:hover": {
                      borderColor: "hsl(var(--primary))",
                    },
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "calc(var(--radius) - 2px)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    zIndex: 100,
                  }),
                  option: (baseStyles, { isFocused, isSelected }) => ({
                    ...baseStyles,
                    backgroundColor: isSelected
                      ? "hsl(var(--primary))"
                      : isFocused
                      ? "hsl(var(--accent))"
                      : "transparent",
                    color: isSelected
                      ? "hsl(var(--primary-foreground))"
                      : "inherit",
                    cursor: "pointer",
                    "&:active": {
                      backgroundColor: "hsl(var(--accent))",
                    },
                  }),
                  multiValue: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: "hsl(var(--secondary)/50%)",
                    borderRadius: "calc(var(--radius) - 2px)",
                  }),
                  multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: "hsl(var(--secondary-foreground))",
                  }),
                  multiValueRemove: (baseStyles) => ({
                    ...baseStyles,
                    color: "hsl(var(--secondary-foreground))",
                    "&:hover": {
                      backgroundColor: "hsl(var(--destructive))",
                      color: "hsl(var(--destructive-foreground))",
                    },
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: "hsl(var(--foreground))",
                  }),
                }}
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary: "hsl(var(--primary))",
                    primary75: "hsl(var(--primary)/.75)",
                    primary50: "hsl(var(--primary)/.5)",
                    primary25: "hsl(var(--primary)/.25)",
                    danger: "hsl(var(--destructive))",
                    dangerLight: "hsl(var(--destructive)/.25)",
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version" className="text-sm font-medium">
                {tp.formVersionLabel}
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">v</span>
                <Input
                  id="version"
                  value={newPrompt.version}
                  onChange={(e) =>
                    setNewPrompt({ ...newPrompt, version: e.target.value })
                  }
                  placeholder={tp.formVersionPlaceholder}
                  className="w-32 focus-visible:ring-primary/30"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {tp.versionSuggestion}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewPromptDialog(false)}
            >
              {tp.cancel}
            </Button>
            <Button
              onClick={handleCreatePrompt}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tp.creating}
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  {tp.create}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOptimizeModal} onOpenChange={setShowOptimizeModal}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <VisuallyHidden.Root>
            <DialogTitle>Dialog</DialogTitle>
          </VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              {tp.optimizePreviewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="relative min-h-[200px] max-h-[50vh] overflow-y-auto mt-4 border rounded-lg p-1">
            {isOptimizing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {tp.optimizePlaceholder}
                  </p>
                </div>
              </div>
            )}
            <Textarea
              value={optimizedContent}
              onChange={(e) => setOptimizedContent(e.target.value)}
              className="min-h-[200px] w-full border-0 focus-visible:ring-0 resize-none"
              placeholder={isOptimizing ? "" : tp.optimizePlaceholder}
            />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowOptimizeModal(false)}
            >
              {tp.cancel}
            </Button>
            <Button
              onClick={() => {
                setNewPrompt({ ...newPrompt, content: optimizedContent });
                setShowOptimizeModal(false);
              }}
              disabled={!optimizedContent.trim()}
              className="gap-2"
            >
              <Wand2 className="h-4 w-4" />
              {tp.applyOptimization}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 