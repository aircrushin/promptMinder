'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NewABTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseline_prompt_id: '',
    variant_prompt_ids: [''],
    goal_metric: 'user_rating',
    target_improvement: 10,
    min_sample_size: 100
  });

  useEffect(() => {
    loadPrompts();
    
    // 从URL参数获取baseline提示词ID
    const params = new URLSearchParams(window.location.search);
    const baselineId = params.get('baseline');
    if (baselineId) {
      setFormData(prev => ({ ...prev, baseline_prompt_id: baselineId }));
    }
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/prompts?limit=100');
      const data = await response.json();
      if (response.ok) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variant_prompt_ids: [...formData.variant_prompt_ids, '']
    });
  };

  const handleRemoveVariant = (index) => {
    const newVariants = formData.variant_prompt_ids.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      variant_prompt_ids: newVariants
    });
  };

  const handleVariantChange = (index, value) => {
    const newVariants = [...formData.variant_prompt_ids];
    newVariants[index] = value;
    setFormData({
      ...formData,
      variant_prompt_ids: newVariants
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证
    if (!formData.name.trim()) {
      toast({
        title: "错误",
        description: "请输入测试名称",
        variant: "destructive"
      });
      return;
    }

    if (!formData.baseline_prompt_id) {
      toast({
        title: "错误",
        description: "请选择基准版本",
        variant: "destructive"
      });
      return;
    }

    const validVariants = formData.variant_prompt_ids.filter(id => id);
    if (validVariants.length === 0) {
      toast({
        title: "错误",
        description: "请至少添加一个变体版本",
        variant: "destructive"
      });
      return;
    }

    // 检查是否有重复
    const allIds = [formData.baseline_prompt_id, ...validVariants];
    if (new Set(allIds).size !== allIds.length) {
      toast({
        title: "错误",
        description: "不能选择重复的提示词",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variant_prompt_ids: validVariants
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "成功",
          description: "A/B测试创建成功"
        });
        router.push(`/ab-tests/${data.id}`);
      } else {
        throw new Error(data.error || 'Failed to create test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        title: "错误",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/ab-tests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>创建A/B测试</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">测试名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：提示词优化测试 v1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这次测试的目的和预期效果..."
                  rows={3}
                />
              </div>
            </div>

            {/* 提示词选择 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">提示词配置</h3>
              
              <div>
                <Label htmlFor="baseline">基准版本 (Baseline) *</Label>
                <Select
                  value={formData.baseline_prompt_id}
                  onValueChange={(value) => setFormData({ ...formData, baseline_prompt_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择基准提示词" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  选择作为对比基准的提示词版本
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>变体版本 (Variants) *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariant}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加变体
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {formData.variant_prompt_ids.map((variantId, index) => (
                    <div key={index} className="flex gap-2">
                      <Select
                        value={variantId}
                        onValueChange={(value) => handleVariantChange(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`选择变体 ${String.fromCharCode(65 + index)}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {prompts.map((prompt) => (
                            <SelectItem key={prompt.id} value={prompt.id}>
                              {prompt.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.variant_prompt_ids.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveVariant(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 测试配置 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">测试配置</h3>

              <div>
                <Label htmlFor="goal_metric">目标指标 *</Label>
                <Select
                  value={formData.goal_metric}
                  onValueChange={(value) => setFormData({ ...formData, goal_metric: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_rating">用户评分</SelectItem>
                    <SelectItem value="cost">成本</SelectItem>
                    <SelectItem value="success_rate">成功率</SelectItem>
                    <SelectItem value="response_time">响应时间</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  选择用于判断获胜版本的指标
                </p>
              </div>

              <div>
                <Label htmlFor="target_improvement">目标提升 (%)</Label>
                <Input
                  id="target_improvement"
                  type="number"
                  value={formData.target_improvement}
                  onChange={(e) => setFormData({ ...formData, target_improvement: parseFloat(e.target.value) })}
                  placeholder="10"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  期望达到的改进百分比
                </p>
              </div>

              <div>
                <Label htmlFor="min_sample_size">最小样本量 *</Label>
                <Input
                  id="min_sample_size"
                  type="number"
                  value={formData.min_sample_size}
                  onChange={(e) => setFormData({ ...formData, min_sample_size: parseInt(e.target.value) })}
                  placeholder="100"
                  min="10"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  达到这个样本量后才能得出有效结论
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/ab-tests')}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '创建中...' : '创建测试'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
