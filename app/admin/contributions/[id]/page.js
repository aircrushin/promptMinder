"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export default function ContributionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [contribution, setContribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [publishToPrompts, setPublishToPrompts] = useState(true);

  useEffect(() => {
    fetchContribution();
  }, [params.id]);

  const fetchContribution = async () => {
    try {
      const response = await fetch(`/api/contributions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContribution(data);
        setAdminNotes(data.admin_notes || "");
      } else {
        toast({
          title: "错误",
          description: "加载贡献详情失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch contribution:", error);
      toast({
        title: "错误",
        description: "加载贡献详情失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    setProcessing(true);
    const adminEmail = localStorage.getItem("admin_email");
    
    try {
      const response = await fetch(`/api/contributions/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail || "",
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim(),
          publishToPrompts: status === "approved" && publishToPrompts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "审核成功",
          description:
            status === "approved"
              ? "贡献已通过审核" + (publishToPrompts ? "并发布到公开库" : "")
              : "贡献已被拒绝",
        });
        fetchContribution(); // 重新加载数据
        // 审核成功后返回列表页
        router.push("/admin/contributions");
      } else {
        const error = await response.json();
        toast({
          title: "错误",
          description: error.error || "审核操作失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to review contribution:", error);
      toast({
        title: "错误",
        description: "审核操作失败",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "待审核",
        variant: "default",
        icon: <Clock className="w-4 h-4 mr-1" />,
        color: "text-yellow-600",
      },
      approved: {
        label: "已通过",
        variant: "success",
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        color: "text-green-600",
      },
      rejected: {
        label: "已拒绝",
        variant: "destructive",
        icon: <XCircle className="w-4 h-4 mr-1" />,
        color: "text-red-600",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit text-sm">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Card className="p-12">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">未找到贡献</h3>
            <p className="text-muted-foreground mb-6">
              该贡献可能已被删除或不存在
            </p>
            <Link href="/admin/contributions">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回列表
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link href="/admin/contributions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </Link>
      </div>

      {/* 主内容区 */}
      <div className="space-y-6">
        {/* 标题和状态 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {contribution.title}
                </CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {contribution.role_category}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(contribution.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>
              {getStatusBadge(contribution.status)}
            </div>
          </CardHeader>
        </Card>

        {/* 提示词内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              提示词内容
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {contribution.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 贡献者信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              贡献者信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">姓名</Label>
                <p className="font-medium">
                  {contribution.contributor_name || "未提供"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">邮箱</Label>
                <p className="font-medium flex items-center gap-2">
                  {contribution.contributor_email ? (
                    <>
                      <Mail className="w-4 h-4" />
                      {contribution.contributor_email}
                    </>
                  ) : (
                    "未提供"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 审核信息 */}
        {contribution.reviewed_at && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">审核信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">审核时间</Label>
                  <p className="font-medium">
                    {new Date(contribution.reviewed_at).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">审核人</Label>
                  <p className="font-medium">
                    {contribution.reviewed_by || "系统"}
                  </p>
                </div>
              </div>
              {contribution.admin_notes && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">审核备注</Label>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{contribution.admin_notes}</p>
                  </div>
                </div>
              )}
              {contribution.published_prompt_id && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">已发布为公开提示词</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <Link
                      href={`/prompts/${contribution.published_prompt_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      查看已发布的提示词
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 审核操作 */}
        {contribution.status === "pending" && (
          <Card className="border-primary/50 shadow-md">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                快速审核
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                {/* 发布选项 */}
                <div className="flex items-center space-x-2 p-4 bg-muted/50 border border-dashed rounded-lg">
                  <Switch
                    id="publish-to-prompts"
                    checked={publishToPrompts}
                    onCheckedChange={setPublishToPrompts}
                  />
                  <Label htmlFor="publish-to-prompts" className="cursor-pointer flex-1">
                    <span className="font-medium">自动发布到公开提示词库</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      通过审核后立即将此提示词发布到公开库
                    </span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">审核备注（可选）</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="输入审核意见或备注（如拒绝原因等）..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
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
                    onClick={() => handleReview("rejected")}
                    disabled={processing}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing ? (
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
}
