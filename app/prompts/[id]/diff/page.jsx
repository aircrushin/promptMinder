'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromptDetail } from '@/hooks/use-prompt-detail';
import PromptDiffViewer from '@/components/prompt/PromptDiffViewer';
import { PromptSkeleton } from '@/components/prompt/PromptSkeleton';
import { apiClient } from '@/lib/api-client';

export default function PromptDiffPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { prompt, versions, isLoading } = usePromptDetail(id);
  const [leftVersion, setLeftVersion] = useState(null);
  const [rightVersion, setRightVersion] = useState(null);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // 初始化版本选择：默认选择最新版本作为右侧，上一个版本作为左侧
  useEffect(() => {
    if (versions && versions.length > 0 && !leftVersion && !rightVersion) {
      const sortedVersions = [...versions].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      if (sortedVersions.length >= 2) {
        setRightVersion(sortedVersions[0].version);
        setLeftVersion(sortedVersions[1].version);
      } else if (sortedVersions.length === 1) {
        setRightVersion(sortedVersions[0].version);
        setLeftVersion(sortedVersions[0].version);
      }
    }
  }, [versions, leftVersion, rightVersion]);

  // 加载选中版本的内容
  useEffect(() => {
    const loadVersionContent = async () => {
      if (!leftVersion || !rightVersion || !versions || versions.length === 0) return;

      setLoadingContent(true);
      try {
        const leftPrompt = versions.find(v => v.version === leftVersion);
        const rightPrompt = versions.find(v => v.version === rightVersion);

        if (!leftPrompt || !rightPrompt) {
          setLeftContent('');
          setRightContent('');
          return;
        }

        // 优先使用版本对象中已有的 content
        let leftContentValue = leftPrompt.content;
        let rightContentValue = rightPrompt.content;

        // 如果缺少 content，通过 API 获取
        const promises = [];
        if (!leftContentValue && leftPrompt.id) {
          promises.push(
            apiClient.getPrompt(leftPrompt.id).then(data => {
              leftContentValue = data.content || '';
            }).catch(err => {
              console.error('Error loading left version content:', err);
              leftContentValue = '';
            })
          );
        }
        if (!rightContentValue && rightPrompt.id) {
          promises.push(
            apiClient.getPrompt(rightPrompt.id).then(data => {
              rightContentValue = data.content || '';
            }).catch(err => {
              console.error('Error loading right version content:', err);
              rightContentValue = '';
            })
          );
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }

        setLeftContent(leftContentValue || '');
        setRightContent(rightContentValue || '');
      } catch (error) {
        console.error('Error loading version content:', error);
        setLeftContent('');
        setRightContent('');
      } finally {
        setLoadingContent(false);
      }
    };

    loadVersionContent();
  }, [leftVersion, rightVersion, versions]);

  if (!t || isLoading) {
    return <PromptSkeleton />;
  }

  if (!prompt || !versions || versions.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <div className="flex items-center space-x-2 mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:bg-secondary"
            onClick={() => router.push(`/prompts/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.promptDetailPage?.backToList || '返回'}
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              {t.promptDiffPage?.noVersions || '未找到版本信息'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tp = t.promptDiffPage || {};

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-secondary"
          onClick={() => router.push(`/prompts/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tp.backToDetail || t.promptDetailPage?.backToList || '返回详情'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{tp.title || '版本差异对比'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左侧版本选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {tp.leftVersionLabel || '左侧版本（旧版本）'}
              </label>
              <Select
                value={leftVersion || ''}
                onValueChange={setLeftVersion}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tp.selectVersionPlaceholder || '选择版本'}>
                    {leftVersion ? `v${leftVersion}` : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.version}>
                      v{version.version} ({new Date(version.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 右侧版本选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {tp.rightVersionLabel || '右侧版本（新版本）'}
              </label>
              <Select
                value={rightVersion || ''}
                onValueChange={setRightVersion}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tp.selectVersionPlaceholder || '选择版本'}>
                    {rightVersion ? `v${rightVersion}` : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.version}>
                      v{version.version} ({new Date(version.created_at).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 差异对比视图 */}
      <Card className="h-[calc(100vh-20rem)]">
        <CardContent className="p-0 h-full">
          {loadingContent ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">{tp.loading || '加载中...'}</p>
            </div>
          ) : (
            <PromptDiffViewer
              oldContent={leftContent}
              newContent={rightContent}
              t={t}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

