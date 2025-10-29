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
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultAbTestsTranslations } from "@/lib/translations/ab-tests";

export default function NewABTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const abTests = t?.abTests ?? defaultAbTestsTranslations;
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
        title: abTests.common.errorTitle,
        description: abTests.common.toast.missingName,
        variant: "destructive"
      });
      return;
    }

    if (!formData.baseline_prompt_id) {
      toast({
        title: abTests.common.errorTitle,
        description: abTests.common.toast.missingBaseline,
        variant: "destructive"
      });
      return;
    }

    const validVariants = formData.variant_prompt_ids.filter(id => id);
    if (validVariants.length === 0) {
      toast({
        title: abTests.common.errorTitle,
        description: abTests.common.toast.missingVariant,
        variant: "destructive"
      });
      return;
    }

    // 检查是否有重复
    const allIds = [formData.baseline_prompt_id, ...validVariants];
    if (new Set(allIds).size !== allIds.length) {
      toast({
        title: abTests.common.errorTitle,
        description: abTests.common.toast.duplicatePrompt,
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
          title: abTests.common.successTitle,
          description: abTests.common.toast.createSuccess
        });
        router.push(`/ab-tests/${data.id}`);
      } else {
        throw new Error(data.error || 'Failed to create test');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        title: abTests.common.errorTitle,
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
          {abTests.common.actions.back}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{abTests.new.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{abTests.new.form.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={abTests.new.form.namePlaceholder}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{abTests.new.form.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={abTests.new.form.descriptionPlaceholder}
                  rows={3}
                />
              </div>
            </div>

            {/* 提示词选择 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">{abTests.new.form.promptConfig}</h3>

              <div>
                <Label htmlFor="baseline">{abTests.new.form.baseline}</Label>
                <Select
                  value={formData.baseline_prompt_id}
                  onValueChange={(value) => setFormData({ ...formData, baseline_prompt_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={abTests.new.form.baselinePlaceholder} />
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
                  {abTests.new.form.baselineHelp}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>{abTests.new.form.variants}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariant}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {abTests.new.form.addVariant}
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
                          <SelectValue
                            placeholder={abTests.new.form.variantPlaceholder.replace(
                              '{label}',
                              String.fromCharCode(65 + index)
                            )}
                          />
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
              <h3 className="font-semibold">{abTests.new.form.testConfig}</h3>

              <div>
                <Label htmlFor="goal_metric">{abTests.new.form.goalMetric}</Label>
                <Select
                  value={formData.goal_metric}
                  onValueChange={(value) => setFormData({ ...formData, goal_metric: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['user_rating', 'cost', 'success_rate', 'response_time'].map((metric) => (
                      <SelectItem key={metric} value={metric}>
                        {abTests.common.goalMetrics[metric] || metric}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {abTests.new.form.goalMetricHelp}
                </p>
              </div>

              <div>
                <Label htmlFor="target_improvement">{abTests.new.form.targetImprovement}</Label>
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
                  {abTests.new.form.targetImprovementHelp}
                </p>
              </div>

              <div>
                <Label htmlFor="min_sample_size">{abTests.new.form.minSampleSize}</Label>
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
                  {abTests.new.form.minSampleSizeHelp}
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
                {abTests.common.actions.cancel}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? abTests.common.actions.creating : abTests.common.actions.create}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
