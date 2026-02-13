// @ts-nocheck
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Loader2,
  RefreshCw,
  Globe,
  Sparkles,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// 预设分类
const CATEGORIES = [
  "通用",
  "编程开发",
  "写作助手",
  "学习教育",
  "商业办公",
  "创意设计",
  "社区贡献",
  "其他",
];

const LANGUAGES = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export default function AdminPublicPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { toast } = useToast();

  // 弹窗状态
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    role_category: "",
    content: "",
    category: "通用",
    language: "zh",
  });

  // 获取管理员凭证
  const getAdminHeaders = useCallback(() => {
    const adminEmail = localStorage.getItem("admin_email");
    const adminToken = localStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      "x-admin-email": adminEmail || "",
      "x-admin-token": adminToken || "",
    };
  }, []);

  // 获取提示词列表
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const response = await fetch(`/api/admin/public-prompts?${params}`, {
        headers: getAdminHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
        setPagination(data.pagination);
      } else {
        const error = await response.json();
        toast({
          title: "加载失败",
          description: error.error || "无法加载提示词列表",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      toast({
        title: "加载失败",
        description: "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, getAdminHeaders, toast]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // 创建提示词
  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "验证失败",
        description: "标题和内容不能为空",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/public-prompts", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "创建成功",
          description: "提示词已成功创建",
        });
        setIsCreateOpen(false);
        resetForm();
        fetchPrompts();
      } else {
        const error = await response.json();
        toast({
          title: "创建失败",
          description: error.error || "无法创建提示词",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create prompt:", error);
      toast({
        title: "创建失败",
        description: "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 更新提示词
  const handleUpdate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "验证失败",
        description: "标题和内容不能为空",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/public-prompts/${selectedPrompt.id}`,
        {
          method: "PATCH",
          headers: getAdminHeaders(),
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast({
          title: "更新成功",
          description: "提示词已成功更新",
        });
        setIsEditOpen(false);
        resetForm();
        fetchPrompts();
      } else {
        const error = await response.json();
        toast({
          title: "更新失败",
          description: error.error || "无法更新提示词",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update prompt:", error);
      toast({
        title: "更新失败",
        description: "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除提示词
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/public-prompts/${selectedPrompt.id}`,
        {
          method: "DELETE",
          headers: getAdminHeaders(),
        }
      );

      if (response.ok) {
        toast({
          title: "删除成功",
          description: "提示词已成功删除",
        });
        setIsDeleteOpen(false);
        setSelectedPrompt(null);
        fetchPrompts();
      } else {
        const error = await response.json();
        toast({
          title: "删除失败",
          description: error.error || "无法删除提示词",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      toast({
        title: "删除失败",
        description: "网络错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: "",
      role_category: "",
      content: "",
      category: "通用",
      language: "zh",
    });
    setSelectedPrompt(null);
  };

  // 打开编辑弹窗
  const openEditDialog = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      title: prompt.title || "",
      role_category: prompt.role_category || "",
      content: prompt.content || "",
      category: prompt.category || "通用",
      language: prompt.language || "zh",
    });
    setIsEditOpen(true);
  };

  // 打开删除确认弹窗
  const openDeleteDialog = (prompt) => {
    setSelectedPrompt(prompt);
    setIsDeleteOpen(true);
  };

  // 打开查看弹窗
  const openViewDialog = (prompt) => {
    setSelectedPrompt(prompt);
    setIsViewOpen(true);
  };

  // 复制内容
  const handleCopy = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: pagination?.total || 0,
      zh: prompts.filter((p) => p.language === "zh").length,
      en: prompts.filter((p) => p.language === "en").length,
    };
  }, [pagination, prompts]);

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-10 rounded-3xl border bg-gradient-to-br from-blue-900/5 via-background to-background p-8 shadow-sm dark:from-blue-900/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-foreground/5 px-4 py-1 text-xs tracking-wide text-muted-foreground backdrop-blur">
                <Globe className="h-3.5 w-3.5" /> 公开提示词管理
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  公开提示词库
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  管理在 Public 页面展示的提示词，支持增删改查操作
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-2 shadow-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  共 {stats.total} 条提示词
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={fetchPrompts}
                    className="gap-2"
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    刷新
                  </Button>
                </TooltipTrigger>
                <TooltipContent>刷新数据</TooltipContent>
              </Tooltip>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                新建提示词
              </Button>
            </div>
          </div>
        </div>

        {/* 搜索栏 */}
        <Card className="mb-8 border-dashed">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、角色或内容..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 rounded-xl border-muted/60 bg-background/70 pl-11 shadow-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提示词列表 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无提示词</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? "没有找到匹配的提示词" : "点击上方按钮创建第一个提示词"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsCreateOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  创建提示词
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="overflow-hidden border transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold leading-snug">
                          {prompt.title || "未命名提示词"}
                        </h3>
                        <Badge variant="outline" className="rounded-full">
                          {prompt.category || "通用"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-full text-xs"
                        >
                          {prompt.language === "zh" ? "中文" : "English"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {prompt.role_category && (
                          <>
                            <span>角色: {prompt.role_category}</span>
                            <span className="hidden sm:inline">·</span>
                          </>
                        )}
                        <span>创建于 {formatDate(prompt.created_at)}</span>
                        {prompt.created_by && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <span>by {prompt.created_by}</span>
                          </>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {prompt.content || "（暂无内容）"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(prompt)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>查看详情</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(prompt.content, prompt.id)}
                          >
                            {copiedId === prompt.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>复制内容</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(prompt)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(prompt)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 分页 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* 创建弹窗 */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                新建公开提示词
              </DialogTitle>
              <DialogDescription>
                创建一个新的公开提示词，将显示在 Public 页面
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-title">标题 *</Label>
                  <Input
                    id="create-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="输入提示词标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">角色/类别</Label>
                  <Input
                    id="create-role"
                    value={formData.role_category}
                    onChange={(e) =>
                      setFormData({ ...formData, role_category: e.target.value })
                    }
                    placeholder="例如：编程助手"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-category">分类</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="create-category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-language">语言</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger id="create-language">
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-content">提示词内容 *</Label>
                <Textarea
                  id="create-content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="输入提示词内容..."
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "创建"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑弹窗 */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                编辑提示词
              </DialogTitle>
              <DialogDescription>修改提示词信息</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">标题 *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="输入提示词标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">角色/类别</Label>
                  <Input
                    id="edit-role"
                    value={formData.role_category}
                    onChange={(e) =>
                      setFormData({ ...formData, role_category: e.target.value })
                    }
                    placeholder="例如：编程助手"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">分类</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-language">语言</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger id="edit-language">
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">提示词内容 *</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="输入提示词内容..."
                  rows={8}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认弹窗 */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                确认删除
              </DialogTitle>
              <DialogDescription>
                确定要删除提示词「{selectedPrompt?.title}」吗？此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    删除中...
                  </>
                ) : (
                  "确认删除"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 查看详情弹窗 */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                查看提示词
              </DialogTitle>
            </DialogHeader>
            {selectedPrompt && (
              <div className="space-y-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{selectedPrompt.category || "通用"}</Badge>
                  <Badge variant="secondary">
                    {selectedPrompt.language === "zh" ? "中文" : "English"}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedPrompt.title}
                  </h3>
                  {selectedPrompt.role_category && (
                    <p className="text-sm text-muted-foreground mb-4">
                      角色: {selectedPrompt.role_category}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">提示词内容</Label>
                  <ScrollArea className="mt-2 max-h-[300px] rounded-xl border bg-muted/20 p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-6">
                      {selectedPrompt.content}
                    </pre>
                  </ScrollArea>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                  <span>创建于 {formatDate(selectedPrompt.created_at)}</span>
                  {selectedPrompt.created_by && (
                    <span>创建者: {selectedPrompt.created_by}</span>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleCopy(selectedPrompt?.content, selectedPrompt?.id)}
              >
                {copiedId === selectedPrompt?.id ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    复制内容
                  </>
                )}
              </Button>
              <Button onClick={() => setIsViewOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
