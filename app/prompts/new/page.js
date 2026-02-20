'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useTeam } from '@/contexts/team-context';
import { PromptForm } from '@/components/prompt/PromptForm';

// Dynamic imports for heavy components
const MotionDiv = dynamic(() => import('framer-motion').then((mod) => mod.motion.div), {
  loading: () => <div className="animate-pulse" />,
  ssr: false,
});

export default function NewPrompt() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const { activeTeamId } = useTeam();

  const [prompt, setPrompt] = useState({
    title: '',
    content: '',
    description: '',
    tags: 'Chatbot',
    version: '1.0.0',
    is_public: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagOptions, setTagOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState('');
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiClient.getTags(activeTeamId ? { teamId: activeTeamId } : {});
        const teamTags = Array.isArray(data?.team) ? data.team : [];
        const personalTags = Array.isArray(data?.personal) ? data.personal : [];
        const fallback = Array.isArray(data) ? data : [];
        const combined = teamTags.length || personalTags.length
          ? [...teamTags, ...personalTags]
          : fallback;

        const uniqueTags = Array.from(new Map(combined.map((tag) => [tag.name, tag])).values());
        const mappedTags = uniqueTags.map((tag) => ({ value: tag.name, label: tag.name }));
        setTagOptions(mappedTags);
        if (mappedTags.length > 0) {
          setPrompt((prev) => (prev.tags ? prev : { ...prev, tags: mappedTags[0].value }));
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast({
          variant: 'destructive',
          description: error.message || '获取标签失败',
        });
      }
    };

    fetchTags();
  }, [activeTeamId, toast]);

  if (!t) return null;
  const tp = t.newPromptPage;

  const validateForm = () => {
    const validationErrors = {};
    if (!prompt.title.trim()) validationErrors.title = tp.errorTitleRequired;
    if (!prompt.content.trim()) validationErrors.content = tp.errorContentRequired;
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setPrompt((prev) => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await apiClient.createPrompt(
        {
          ...prompt,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        activeTeamId ? { teamId: activeTeamId } : {}
      );

      toast({ description: '提示词创建成功', duration: 2000 });
      router.push('/prompts');
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        variant: 'destructive',
        description: error.message || '创建提示词失败',
        duration: 2000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTag = async (inputValue) => {
    try {
      await apiClient.createTag(
        { name: inputValue, scope: activeTeamId ? 'team' : 'personal' },
        activeTeamId ? { teamId: activeTeamId } : {}
      );
      const newOption = { value: inputValue, label: inputValue };
      setTagOptions((prev) => [...prev, newOption]);
      return newOption;
    } catch (error) {
      console.error('Error creating new tag:', error);
      toast({
        variant: 'destructive',
        description: error.message || '创建标签失败',
        duration: 2000,
      });
      return null;
    }
  };

  const handleOptimize = async () => {
    if (!prompt.content.trim()) return;
    setIsOptimizing(true);
    setOptimizedContent('');
    setShowOptimizeModal(true);

    try {
      const response = await apiClient.generate(prompt.content);
      if (!response.ok) throw new Error(tp.optimizeError);

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
      console.error(tp.optimizationErrorLog, error);
      toast({
        variant: 'destructive',
        description: tp.optimizeError,
        duration: 3000,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimized = () => {
    setPrompt((prev) => ({ ...prev, content: optimizedContent }));
    setShowOptimizeModal(false);
  };

  const handleCancel = () => {
    router.back();
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
              <PromptForm
                mode="full"
                prompt={prompt}
                onFieldChange={handleFieldChange}
                tagOptions={tagOptions}
                onCreateTag={handleCreateTag}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onOptimize={handleOptimize}
                isSubmitting={isSubmitting}
                isOptimizing={isOptimizing}
                errors={errors}
                copy={tp}
              />
            </CardContent>
          </Card>
        </MotionDiv>
      </Suspense>

      <Modal open={showOptimizeModal} onOpenChange={setShowOptimizeModal}>
        <ModalContent className="sm:max-w-2xl">
          <ModalHeader>
            <ModalTitle>{tp.optimizePreviewTitle}</ModalTitle>
          </ModalHeader>
          <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-relaxed">
            {optimizedContent || tp.optimizePlaceholder}
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowOptimizeModal(false)}>
              {tp.cancel}
            </Button>
            <Button onClick={handleApplyOptimized} disabled={!optimizedContent.trim()}>
              {tp.applyOptimization}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
