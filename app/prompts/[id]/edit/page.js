'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Wand2 } from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
} from '@/components/ui/modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useTeam } from '@/contexts/team-context';

const CreatableSelect = dynamic(() => import('react-select/creatable'), {
  loading: () => <Skeleton className="h-10 w-full" />,
  ssr: false,
});

const MotionDiv = dynamic(() => import('framer-motion').then((mod) => mod.motion.div), {
  loading: () => <div className="animate-pulse" />,
  ssr: false,
});

const VariableInputs = dynamic(() => import('@/components/prompt/VariableInputs'), {
  loading: () => <Skeleton className="h-16 w-full" />,
  ssr: false,
});

export default function EditPrompt({ params }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { activeTeamId } = useTeam();
  const promptId = params?.id;

  const [prompt, setPrompt] = useState(null);
  const [originalVersion, setOriginalVersion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!promptId) {
        return;
      }

      try {
        const [promptData, tagsData] = await Promise.all([
          apiClient.request(`/api/prompts/${promptId}`, activeTeamId ? { teamId: activeTeamId } : {}),
          apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {}),
        ]);

        setPrompt(promptData);
        setOriginalVersion(promptData.version);

        let tagList = []
        if (Array.isArray(tagsData?.team)) {
          tagList = tagList.concat(tagsData.team)
        }
        if (Array.isArray(tagsData?.personal)) {
          tagList = tagList.concat(tagsData.personal)
        }
        if (!tagList.length && Array.isArray(tagsData)) {
          tagList = tagsData
        }
        const uniqueTags = Array.from(new Map(tagList.map((tag) => [tag.name, tag])).values());
        setTagOptions(uniqueTags.map((tag) => ({ value: tag.name, label: tag.name })));
      } catch (error) {
        console.error('Error fetching prompt:', error);
        toast({
          variant: 'destructive',
          description: error.message || '加载提示词失败',
        });
      }
    };

    fetchInitialData();
  }, [promptId, activeTeamId, toast]);

  if (!t) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const tp = t.promptEditPage;

  if (!prompt) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const isNewVersion = originalVersion !== prompt.version;
      let result;

      if (isNewVersion) {
        const newPromptPayload = {
          ...prompt,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        delete newPromptPayload.team_id;
        result = await apiClient.createPrompt(newPromptPayload, activeTeamId ? { teamId: activeTeamId } : {});
        toast({ title: '成功', description: tp.createVersionSuccess });
        router.push(`/prompts/${result.id}`);
      } else {
        const updatePayload = { ...prompt };
        result = await apiClient.updatePrompt(promptId, updatePayload, activeTeamId ? { teamId: activeTeamId } : {});
        toast({ title: '成功', description: tp.updateSuccess });
        router.push('/prompts');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: '错误',
        description: error.message || tp.updateError,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tagSelectProps = {
    isCreatable: true,
    onKeyDown: (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        const inputValue = event.target.value;
        if (inputValue) {
          tagSelectProps.onCreateOption(inputValue);
        }
      }
    },
    onCreateOption: async (inputValue) => {
      try {
        if (!activeTeamId) {
          throw new Error('请选择团队后再创建标签');
        }
        await apiClient.createTag({ name: inputValue }, { teamId: activeTeamId });
        const newOption = { value: inputValue, label: inputValue };
        setTagOptions((prev) => [...prev, newOption]);

        const tags = prompt.tags ? `${prompt.tags},${inputValue}` : inputValue;
        setPrompt((prev) => ({ ...prev, tags }));
      } catch (error) {
        console.error('Error creating tag:', error);
        toast({
          variant: 'destructive',
          description: error.message || '创建标签失败',
        });
      }
    },
  };

  const handleOptimize = async () => {
    if (!prompt.content.trim()) return;
    setIsOptimizing(true);
    setOptimizedContent('');
    setShowOptimizeModal(true);

    try {
      const response = await apiClient.generate(prompt.content);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let tempContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const jsonStr = line.replace(/^data: /, '').trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            const delta = JSON.parse(jsonStr);
            if (delta.choices?.[0]?.delta?.content) {
              tempContent += delta.choices[0].delta.content;
              setOptimizedContent(tempContent);
            }
          } catch (error) {
            console.error(tp.optimizeParsingError, error);
          }
        }
      }
    } catch (error) {
      console.error(tp.optimizeErrorLog, error);
      toast({
        title: '错误',
        description: error.message || tp.optimizeRetry,
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimized = () => {
    setPrompt((prev) => ({ ...prev, content: optimizedContent }));
    setShowOptimizeModal(false);
    toast({ title: '成功', description: tp.applyOptimizeSuccess });
  };

  return (
    <>
      <Suspense
        fallback={
          <div className="container mx-auto max-w-7xl p-6 animate-pulse">
            <Skeleton className="mb-6 h-8 w-48" />
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto max-w-7xl p-6"
        >
          <h1 className="mb-6 text-3xl font-bold">{tp.title}</h1>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <MotionDiv className="space-y-2" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <Label htmlFor="title" className="text-base">
                    {tp.formTitleLabel}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={prompt.title}
                    onChange={(event) => setPrompt({ ...prompt, title: event.target.value })}
                    placeholder={tp.formTitlePlaceholder}
                    required
                  />
                </MotionDiv>

                <MotionDiv className="space-y-2" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <Label htmlFor="content" className="text-base">
                    {tp.formContentLabel}
                    <span className="ml-1 text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="content"
                      value={prompt.content}
                      onChange={(event) => setPrompt({ ...prompt, content: event.target.value })}
                      placeholder={tp.formContentPlaceholder}
                      className="min-h-[250px] pr-12"
                      required
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 hover:bg-primary/10"
                      onClick={handleOptimize}
                      disabled={isOptimizing || !prompt.content.trim()}
                    >
                      {isOptimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{tp.variableTip}</p>
                </MotionDiv>

                <Suspense fallback={<Skeleton className="h-16 w-full" />}>
                  <VariableInputs content={prompt.content} className="my-4" />
                </Suspense>

                <MotionDiv className="space-y-2" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <Label htmlFor="description" className="text-base">
                    {tp.formDescriptionLabel}
                  </Label>
                  <Textarea
                    id="description"
                    value={prompt.description || ''}
                    onChange={(event) => setPrompt({ ...prompt, description: event.target.value })}
                    placeholder={tp.formDescriptionPlaceholder}
                    className="min-h-[80px]"
                  />
                </MotionDiv>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-base">
                    {tp.formTagsLabel}
                  </Label>
                  <CreatableSelect
                    key="tags-select"
                    id="tags"
                    isMulti
                    value={prompt.tags ? prompt.tags.split(',').map((tag) => ({ value: tag, label: tag })) : []}
                    onChange={(selected) => {
                      const tags = selected ? selected.map((option) => option.value).join(',') : '';
                      setPrompt({ ...prompt, tags });
                    }}
                    options={tagOptions}
                    placeholder={tp.formTagsPlaceholder}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    {...tagSelectProps}
                    instanceId="tags-select"
                  />
                </div>

                <MotionDiv className="space-y-2" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <Label htmlFor="version" className="text-base">
                    {tp.formVersionLabel}
                  </Label>
                  <Input
                    id="version"
                    value={prompt.version || ''}
                    onChange={(event) => setPrompt({ ...prompt, version: event.target.value })}
                    placeholder={tp.formVersionPlaceholder}
                  />
                  <p className="text-sm text-muted-foreground">{tp.versionSuggestion}</p>
                </MotionDiv>

                <MotionDiv className="flex gap-4" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                  <Button type="submit" disabled={isSubmitting} className="relative">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : tp.submitButton}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    {tp.cancelButton}
                  </Button>
                </MotionDiv>
              </form>
            </CardContent>
          </Card>
        </MotionDiv>
      </Suspense>

      <Modal open={showOptimizeModal} onOpenChange={setShowOptimizeModal}>
        <ModalContent className="sm:max-w-2xl">
          <ModalHeader>
            <ModalTitle>{tp.optimizeModalTitle}</ModalTitle>
          </ModalHeader>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed">
            {optimizedContent || tp.optimizeProcessing}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowOptimizeModal(false)}>
              {tp.optimizeCancel}
            </Button>
            <Button onClick={handleApplyOptimized} disabled={!optimizedContent.trim()}>
              {tp.optimizeApply}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
