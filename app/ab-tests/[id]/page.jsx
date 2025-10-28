'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Pause, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PromptCompare from '@/components/ab-test/PromptCompare';
import ResultsAnalysis from '@/components/ab-test/ResultsAnalysis';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ABTestDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [experiment, setExperiment] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  useEffect(() => {
    loadExperiment();
    loadResults();
  }, [id]);

  const loadExperiment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ab-tests/${id}`);
      const data = await response.json();

      if (response.ok) {
        setExperiment(data);
      } else {
        throw new Error(data.error || 'Failed to load experiment');
      }
    } catch (error) {
      console.error('Error loading experiment:', error);
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const response = await fetch(`/api/ab-tests/${id}/results`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/ab-tests/${id}/start`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: "测试已启动"
        });
        setExperiment(data);
      } else {
        throw new Error(data.error || 'Failed to start test');
      }
    } catch (error) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/ab-tests/${id}/stop`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: "测试已停止"
        });
        setExperiment(data);
      } else {
        throw new Error(data.error || 'Failed to stop test');
      }
    } catch (error) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/ab-tests/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "测试已删除"
        });
        router.push('/ab-tests');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete test');
      }
    } catch (error) {
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">测试不存在</p>
            <Button className="mt-4" onClick={() => router.push('/ab-tests')}>
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Button
              variant="ghost"
              onClick={() => router.push('/ab-tests')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">{experiment.name}</h1>
          {experiment.description && (
            <p className="text-muted-foreground">{experiment.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          {experiment.status === 'draft' && (
            <Button onClick={handleStart} disabled={actionLoading}>
              <Play className="w-4 h-4 mr-2" />
              启动测试
            </Button>
          )}
          {experiment.status === 'running' && (
            <Button variant="outline" onClick={handleStop} disabled={actionLoading}>
              <Pause className="w-4 h-4 mr-2" />
              停止测试
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={actionLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="compare">版本对比</TabsTrigger>
          <TabsTrigger value="results">结果分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">基本信息</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">状态:</dt>
                      <dd className="font-medium">{experiment.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">目标指标:</dt>
                      <dd className="font-medium">{experiment.goal_metric}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">最小样本量:</dt>
                      <dd className="font-medium">{experiment.min_sample_size}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">当前样本量:</dt>
                      <dd className="font-medium">{experiment.current_sample_size}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">测试配置</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">基准提示词:</dt>
                      <dd className="font-medium truncate max-w-[200px]">
                        {experiment.baseline_prompt?.title || 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">变体数量:</dt>
                      <dd className="font-medium">{experiment.variant_prompt_ids?.length || 0}</dd>
                    </div>
                    {experiment.started_at && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">开始时间:</dt>
                        <dd className="font-medium">
                          {new Date(experiment.started_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                    {experiment.ended_at && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">结束时间:</dt>
                        <dd className="font-medium">
                          {new Date(experiment.ended_at).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快速结果预览 */}
          {results && (
            <ResultsAnalysis results={results} />
          )}
        </TabsContent>

        <TabsContent value="compare">
          {experiment.variant_prompts && experiment.variant_prompts.length > 0 && (
            <>
              {/* 变体选择器 */}
              <div className="flex gap-2 mb-4">
                {experiment.variant_prompts.map((_, index) => (
                  <Button
                    key={index}
                    variant={selectedVariantIndex === index ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVariantIndex(index)}
                  >
                    变体 {String.fromCharCode(65 + index)}
                  </Button>
                ))}
              </div>

              <PromptCompare
                baseline={experiment.baseline_prompt}
                variant={experiment.variant_prompts[selectedVariantIndex]}
                variantName={`variant_${String.fromCharCode(97 + selectedVariantIndex)}`}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="results">
          {results ? (
            <ResultsAnalysis results={results} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">暂无测试结果</p>
                <p className="text-sm text-muted-foreground mt-2">
                  启动测试并收集数据后，结果将在这里显示
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个A/B测试吗？此操作无法撤销，所有相关数据都将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
