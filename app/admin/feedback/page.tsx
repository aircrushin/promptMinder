'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Bug, Lightbulb, RefreshCw, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'reviewed', label: '已查看' },
  { value: 'resolved', label: '已解决' },
  { value: 'rejected', label: '已拒绝' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS = {
  pending: '待处理',
  reviewed: '已查看',
  resolved: '已解决',
  rejected: '已拒绝',
};

export default function AdminFeedbackPage() {
  const { toast } = useToast();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/feedback?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedbackList(data.feedback || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (error) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, toast]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setFeedbackList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item
        )
      );

      if (selectedFeedback?.id === id) {
        setSelectedFeedback((prev) => ({ ...prev, status: newStatus }));
      }

      toast({
        title: '状态已更新',
      });
    } catch (error) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openDetail = (feedback) => {
    setSelectedFeedback(feedback);
    setDetailOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户反馈</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理和处理用户提交的反馈
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchFeedback}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">类型</TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[120px]">状态</TableHead>
              <TableHead className="w-[180px]">提交时间</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : feedbackList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无反馈数据
                </TableCell>
              </TableRow>
            ) : (
              feedbackList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === 'feature_request' ? (
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Bug className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {item.type === 'feature_request' ? '功能' : 'Bug'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md truncate text-sm">
                      {item.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(value) => handleStatusChange(item.id, value)}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <Badge className={STATUS_COLORS[item.status]} variant="secondary">
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">待处理</SelectItem>
                        <SelectItem value="reviewed">已查看</SelectItem>
                        <SelectItem value="resolved">已解决</SelectItem>
                        <SelectItem value="rejected">已拒绝</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDetail(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {pagination.total} 条反馈
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFeedback?.type === 'feature_request' ? (
                <Lightbulb className="h-5 w-5 text-amber-500" />
              ) : (
                <Bug className="h-5 w-5 text-red-500" />
              )}
              {selectedFeedback?.type === 'feature_request'
                ? '功能建议'
                : '问题反馈'}
            </DialogTitle>
            <DialogDescription>
              提交于 {selectedFeedback && formatDate(selectedFeedback.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">反馈内容</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                {selectedFeedback?.description}
              </div>
            </div>
            {selectedFeedback?.email && (
              <div>
                <h4 className="text-sm font-medium mb-1">联系邮箱</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.email}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-2">状态</h4>
              <Select
                value={selectedFeedback?.status}
                onValueChange={(value) =>
                  handleStatusChange(selectedFeedback.id, value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <Badge
                    className={STATUS_COLORS[selectedFeedback?.status]}
                    variant="secondary"
                  >
                    {STATUS_LABELS[selectedFeedback?.status]}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待处理</SelectItem>
                  <SelectItem value="reviewed">已查看</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
