"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";

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

  // 加载统计数据
  useEffect(() => {
    fetchStats();
  }, []);

  // 加载贡献列表
  useEffect(() => {
    fetchContributions();
  }, [statusFilter, currentPage]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/contributions/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.statusStats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchContributions = async () => {
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
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "待审核",
        variant: "default",
        icon: <Clock className="w-3 h-3 mr-1" />,
      },
      approved: {
        label: "已通过",
        variant: "success",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      rejected: {
        label: "已拒绝",
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        {config.icon}
        {config.label}
      </Badge>
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

  const filteredContributions = contributions.filter((contribution) =>
    contribution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contribution.role_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">提示词审核管理</h1>
        <p className="text-muted-foreground">
          管理和审核用户贡献的公开提示词
        </p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总贡献数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已通过</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已拒绝</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选和搜索栏 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索标题或类别..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
          <div className="space-y-3">
            {filteredContributions.map((contribution) => {
              const isExpanded = expandedId === contribution.id;
              const isReviewing = reviewingId === contribution.id;
              const isPending = contribution.status === "pending";
              
              return (
                <Card
                  key={contribution.id}
                  className={`overflow-hidden transition-all ${
                    isExpanded ? "shadow-lg" : "hover:shadow-md"
                  }`}
                >
                  {/* 卡片头部 - 可点击展开 */}
                  <div
                    className={`p-5 cursor-pointer ${
                      isPending ? "hover:bg-muted/50" : ""
                    } transition-colors`}
                    onClick={() => isPending && toggleExpand(contribution.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        {/* 标题和状态 */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                              {contribution.title}
                              {isPending && (
                                <Badge variant="outline" className="text-xs">
                                  点击展开审核
                                </Badge>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">
                                {contribution.role_category}
                              </Badge>
                              <span>•</span>
                              <span>{formatDate(contribution.created_at)}</span>
                              {(contribution.contributor_name ||
                                contribution.contributor_email) && (
                                <>
                                  <span>•</span>
                                  <Users className="w-3 h-3 inline" />
                                  <span className="text-xs">
                                    {contribution.contributor_name || "匿名"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(contribution.status)}
                            {isPending && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* 内容预览 */}
                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {contribution.content}
                          </p>
                        )}

                        {/* 已审核的备注 */}
                        {!isPending && contribution.reviewed_at && (
                          <div className="text-xs text-muted-foreground">
                            审核时间:{" "}
                            {new Date(
                              contribution.reviewed_at
                            ).toLocaleString("zh-CN")}
                            {contribution.admin_notes && (
                              <div className="mt-1 p-2 bg-muted rounded text-xs">
                                备注: {contribution.admin_notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 非待审核状态的详情链接 */}
                      {!isPending && (
                        <Link href={`/admin/contributions/${contribution.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            查看详情
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* 展开的审核区域 */}
                  {isExpanded && isPending && (
                    <div className="border-t bg-muted/30">
                      <div className="p-5 space-y-4">
                        {/* 完整内容 */}
                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            提示词内容
                          </Label>
                          <div className="bg-background border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-sm">
                              {contribution.content}
                            </pre>
                          </div>
                        </div>

                        {/* 审核备注 */}
                        <div>
                          <Label
                            htmlFor={`notes-${contribution.id}`}
                            className="text-sm font-medium mb-2 block"
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
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        {/* 发布选项 */}
                        <div className="flex items-center space-x-2 p-3 bg-background border rounded-lg">
                          <Switch
                            id={`publish-${contribution.id}`}
                            checked={
                              publishToPrompts[contribution.id] !== false
                            }
                            onCheckedChange={(checked) =>
                              setPublishToPrompts((prev) => ({
                                ...prev,
                                [contribution.id]: checked,
                              }))
                            }
                          />
                          <Label
                            htmlFor={`publish-${contribution.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            通过后自动发布到公开提示词库
                          </Label>
                        </div>

                        {/* 快速审核按钮 */}
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={() =>
                              handleQuickReview(contribution.id, "approved")
                            }
                            disabled={isReviewing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isReviewing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                处理中...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
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
                            className="flex-1"
                          >
                            {isReviewing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                处理中...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                拒绝贡献
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setExpandedId(null)}
                            disabled={isReviewing}
                          >
                            取消
                          </Button>
                        </div>

                        {/* 详情链接 */}
                        <div className="text-center">
                          <Link
                            href={`/admin/contributions/${contribution.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            查看完整详情页
                          </Link>
                        </div>
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
  );
}
