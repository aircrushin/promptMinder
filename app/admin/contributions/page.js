"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  FileText,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const STATUS_THEMES = {
  pending: {
    border: "border-amber-300/60",
    glow: "ring-2 ring-amber-200/60",
    headerBg: "bg-amber-50/70 dark:bg-amber-950/30",
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  approved: {
    border: "border-emerald-300/70",
    glow: "ring-2 ring-emerald-200/50",
    headerBg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  rejected: {
    border: "border-rose-300/60",
    glow: "ring-2 ring-rose-200/50",
    headerBg: "bg-rose-50/70 dark:bg-rose-950/30",
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  },
  default: {
    border: "border-slate-200",
    glow: "",
    headerBg: "bg-muted/40",
    pill: "bg-muted text-foreground",
  },
};

const STAT_CARD_META = [
  {
    key: "total",
    title: "总贡献数",
    icon: FileText,
    gradient: "from-slate-900/80 via-slate-900/20 to-slate-900/5",
  },
  {
    key: "pending",
    title: "待审核",
    icon: Clock,
    gradient: "from-amber-500/80 via-amber-500/20 to-amber-500/5",
  },
  {
    key: "approved",
    title: "已通过",
    icon: CheckCircle,
    gradient: "from-emerald-500/80 via-emerald-500/20 to-emerald-500/5",
  },
  {
    key: "rejected",
    title: "已拒绝",
    icon: XCircle,
    gradient: "from-rose-500/80 via-rose-500/20 to-rose-500/5",
  },
];

const STATUS_LABELS = {
  all: "全部状态",
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [publishToPrompts, setPublishToPrompts] = useState({});
  const { toast } = useToast();

  const handleResetFilters = useCallback(() => {
    setStatusFilter("pending");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/contributions/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.statusStats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/contributions?status=${statusFilter}&page=${currentPage}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setContributions(data.contributions);
        setPagination(data.pagination);
      } else {
        toast({
          title: "错误",
          description: "加载贡献列表失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch contributions:", error);
      toast({
        title: "错误",
        description: "加载贡献列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, toast]);

  // 加载统计数据
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 加载贡献列表
  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  const handleRefresh = useCallback(() => {
    fetchStats();
    fetchContributions();
  }, [fetchContributions, fetchStats]);

  const filteredContributions = useMemo(
    () =>
      contributions.filter((contribution) =>
        [contribution.title, contribution.role_category]
          .filter(Boolean)
          .some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
      ),
    [contributions, searchTerm]
  );

  const hasActiveFilters = useMemo(
    () => statusFilter !== "pending" || searchTerm.trim().length > 0,
    [searchTerm, statusFilter]
  );

  const totalPending = stats?.pending ?? 0;
  const queueBadge = stats
    ? totalPending > 0
      ? `${totalPending}条待审核`
      : "队列已清空"
    : "统计加载中...";

  const statusOptions = useMemo(
    () => ["all", "pending", "approved", "rejected"],
    []
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "待审核",
        icon: <Clock className="h-3 w-3" />,
      },
      approved: {
        label: "已通过",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      rejected: {
        label: "已拒绝",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const theme = STATUS_THEMES[status] || STATUS_THEMES.default;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shadow-sm",
          theme.pill
        )}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "今天";
    if (diffDays === 1) return "昨天";
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleQuickReview = async (contributionId, status) => {
    setReviewingId(contributionId);
    const adminEmail = localStorage.getItem("admin_email");
    
    try {
      const response = await fetch(`/api/contributions/${contributionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail || "",
        },
        body: JSON.stringify({
          status,
          adminNotes: reviewNotes[contributionId]?.trim() || "",
          publishToPrompts: status === "approved" && (publishToPrompts[contributionId] !== false),
        }),
      });

      if (response.ok) {
        toast({
          title: "审核成功",
          description: status === "approved" ? "贡献已通过审核" : "贡献已被拒绝",
        });
        // 刷新列表
        fetchContributions();
        fetchStats();
        // 清理状态
        setExpandedId(null);
        setReviewNotes((prev) => {
          const newNotes = { ...prev };
          delete newNotes[contributionId];
          return newNotes;
        });
        setPublishToPrompts((prev) => {
          const newPublish = { ...prev };
          delete newPublish[contributionId];
          return newPublish;
        });
      } else {
        const error = await response.json();
        toast({
          title: "审核失败",
          description: error.error || "操作失败，请重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to review:", error);
      toast({
        title: "审核失败",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* 页面标题 */}
        <div className="mb-10 rounded-3xl border bg-gradient-to-br from-slate-900/5 via-background to-background p-8 shadow-sm dark:from-slate-900/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-foreground/5 px-4 py-1 text-xs tracking-wide text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> 审核工作台
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">提示词审核管理</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  快速筛选、审核并发布来自社区的提示词贡献。保持流程顺畅，高效处理待办。
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-2 shadow-sm">
                <div className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  totalPending > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                )} />
                <div className="text-sm font-medium">{queueBadge}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="gap-2"
                    disabled={loading}
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    刷新数据
                  </Button>
                </TooltipTrigger>
                <TooltipContent>重新获取最新统计与列表</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-10">
            {STAT_CARD_META.map(({ key, title, icon: Icon, gradient }) => (
              <Card
                key={key}
                className={cn(
                  "relative overflow-hidden border-none text-slate-900 shadow-sm transition-transform hover:scale-[1.01] hover:shadow-md dark:text-slate-100",
                  "bg-gradient-to-br",
                  gradient,
                  "dark:via-slate-900/40 dark:to-slate-900/30"
                )}
              >
                <div className="absolute -right-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
                <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-white/80 dark:text-white/70">
                      {title}
                    </CardTitle>
                    <span className="text-xs font-medium uppercase tracking-wide text-white/60 dark:text-white/50">
                      Status
                    </span>
                  </div>
                  <div className="rounded-xl bg-black/10 p-2 text-white/80 backdrop-blur dark:bg-white/10">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="relative pt-2">
                  <div className="text-3xl font-semibold text-white drop-shadow-sm">
                    {stats?.[key] ?? 0}
                  </div>
                  {key !== "total" && stats?.total ? (
                    <p className="mt-1 text-xs text-white/70">
                      占总数 {(stats[key] ? Math.round((stats[key] / stats.total) * 100) : 0)}%
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 筛选和搜索栏 */}
        <Card className="mb-8 border-dashed">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" /> 快速筛选
              </div>
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  清除筛选
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索标题或类别..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 rounded-xl border-muted/60 bg-background/70 pl-11 shadow-sm"
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-muted/60 bg-background/70 shadow-sm lg:w-[220px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>当前筛选:</span>
                {searchTerm ? (
                  <Badge variant="secondary" className="rounded-full bg-muted px-3 py-1 text-xs">
                    关键字: {searchTerm}
                  </Badge>
                ) : null}
                {statusFilter !== "pending" ? (
                  <Badge variant="secondary" className="rounded-full bg-muted px-3 py-1 text-xs">
                    状态: {STATUS_LABELS[statusFilter]}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

      {/* 贡献列表 */}
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
      ) : filteredContributions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无贡献</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "没有找到匹配的贡献" : "当前没有任何贡献记录"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filteredContributions.map((contribution) => {
              const isExpanded = expandedId === contribution.id;
              const isReviewing = reviewingId === contribution.id;
              const isPending = contribution.status === "pending";
              const theme = STATUS_THEMES[contribution.status] || STATUS_THEMES.default;
              const contributorDisplay =
                contribution.contributor_name ||
                contribution.contributor_email ||
                "匿名";

              return (
                <Card
                  key={contribution.id}
                  className={cn(
                    "overflow-hidden border transition-all duration-200",
                    theme.border,
                    isExpanded
                      ? cn(theme.glow, "shadow-lg md:shadow-xl")
                      : "hover:shadow-lg"
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-4 border-b px-6 py-5 transition-colors md:flex-row md:items-start md:justify-between",
                      theme.headerBg,
                      isPending ? "cursor-pointer hover:bg-white/70 dark:hover:bg-white/10" : "cursor-default"
                    )}
                    onClick={() => {
                      if (isPending) {
                        toggleExpand(contribution.id);
                      }
                    }}
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold leading-snug">
                          {contribution.title || "未命名提示词"}
                        </h3>
                        {getStatusBadge(contribution.status)}
                        {isPending && (
                          <Badge variant="outline" className="rounded-full border-dashed px-3 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                            点击展开审核
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full border-dashed px-3 py-0.5 text-xs">
                          {contribution.role_category || "未分类"}
                        </Badge>
                        <Separator orientation="vertical" className="hidden h-3 sm:block" />
                        <span>{formatDate(contribution.created_at)}</span>
                        {(contribution.contributor_name || contribution.contributor_email) && (
                          <>
                            <Separator orientation="vertical" className="hidden h-3 sm:block" />
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {contributorDisplay}
                            </span>
                          </>
                        )}
                      </div>
                      {!isExpanded && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {contribution.content || "（暂无内容）"}
                        </p>
                      )}
                      {!isPending && contribution.reviewed_at && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-background/70 p-3 text-xs text-muted-foreground">
                          <span>审核时间</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>
                            {new Date(contribution.reviewed_at).toLocaleString("zh-CN")}
                          </span>
                          {contribution.admin_notes ? (
                            <Badge variant="secondary" className="rounded-full bg-muted px-2.5 py-0.5 text-[11px]">
                              备注: {contribution.admin_notes}
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isPending ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-full border-dashed"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleExpand(contribution.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isExpanded ? "收起审核面板" : "展开审核面板"}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/admin/contributions/${contribution.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" /> 查看详情
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-background/60">
                      <div className="grid gap-6 border-t px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-5">
                          <div>
                            <Label className="text-sm font-medium text-foreground">
                              提示词内容
                            </Label>
                            <ScrollArea className="mt-3 max-h-[320px] rounded-2xl border border-dashed bg-muted/20 p-4">
                              <pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                {contribution.content || "（暂无内容）"}
                              </pre>
                            </ScrollArea>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border bg-background/80 p-4">
                              <p className="text-xs text-muted-foreground">提交者</p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {contributorDisplay}
                              </p>
                            </div>
                            <div className="rounded-xl border bg-background/80 p-4">
                              <p className="text-xs text-muted-foreground">提交时间</p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {new Date(contribution.created_at).toLocaleString("zh-CN")}
                              </p>
                            </div>
                          </div>
                        </div>

                        {isPending ? (
                          <div className="space-y-4 rounded-2xl border border-dashed bg-background p-5 shadow-sm">
                            <div>
                              <Label
                                htmlFor={`notes-${contribution.id}`}
                                className="text-sm font-medium"
                              >
                                审核备注（可选）
                              </Label>
                              <Textarea
                                id={`notes-${contribution.id}`}
                                placeholder="添加审核备注或意见..."
                                value={reviewNotes[contribution.id] || ""}
                                onChange={(e) =>
                                  setReviewNotes((prev) => ({
                                    ...prev,
                                    [contribution.id]: e.target.value,
                                  }))
                                }
                                rows={3}
                                className="mt-3 resize-none rounded-xl border-muted/60 bg-background"
                              />
                            </div>

                            <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-3">
                              <Switch
                                id={`publish-${contribution.id}`}
                                checked={publishToPrompts[contribution.id] !== false}
                                onCheckedChange={(checked) =>
                                  setPublishToPrompts((prev) => ({
                                    ...prev,
                                    [contribution.id]: checked,
                                  }))
                                }
                              />
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`publish-${contribution.id}`}
                                  className="text-sm font-medium"
                                >
                                  通过后自动发布到公开提示词库
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  可在详情页再次调整是否公开。
                                </p>
                              </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <Button
                                onClick={() =>
                                  handleQuickReview(contribution.id, "approved")
                                }
                                disabled={isReviewing}
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                              >
                                {isReviewing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    处理中...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    通过审核
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={() =>
                                  handleQuickReview(contribution.id, "rejected")
                                }
                                disabled={isReviewing}
                                variant="destructive"
                                className="w-full"
                              >
                                {isReviewing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    处理中...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    拒绝贡献
                                  </>
                                )}
                              </Button>
                            </div>

                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={isReviewing}
                              onClick={() => setExpandedId(null)}
                            >
                              取消
                            </Button>

                            <Button variant="ghost" className="w-full" asChild>
                              <Link
                                href={`/admin/contributions/${contribution.id}`}
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1 text-sm"
                              >
                                <Eye className="h-4 w-4" /> 查看完整详情页
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
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
      </div>
    </TooltipProvider>
  );
}
