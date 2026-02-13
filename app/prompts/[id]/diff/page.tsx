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
import { ArrowLeft, GitCompare, Clock, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromptDetail } from '@/hooks/use-prompt-detail';
import PromptDiffViewer from '@/components/prompt/PromptDiffViewer';
import { PromptSkeleton } from '@/components/prompt/PromptSkeleton';
import { apiClient } from '@/lib/api-client';

export default function PromptDiffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { prompt, versions, isLoading } = usePromptDetail(id);
  const [leftVersion, setLeftVersion] = useState<string | null>(null);
  const [rightVersion, setRightVersion] = useState<string | null>(null);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(false);

  // 初始化版本选择：默认选择最新版本作为右侧，上一个版本作为左侧
  useEffect(() => {
    if (versions && versions.length > 0 && !leftVersion && !rightVersion) {
      const sortedVersions = [...versions].sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

  const tp: Record<string, any> = (t as any).promptDiffPage || {};

  const sortedVersions = [...versions].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/prompts/${id}`)}
            className="text-muted-foreground hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tp.backToDetail || t.promptDetailPage?.backToList || '返回详情'}
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-indigo-600" />
            <h1 className="text-lg font-semibold">{tp.title || '版本差异对比'}</h1>
          </div>
        </div>

        {prompt && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
            <span className="text-sm text-gray-700 font-medium">{prompt.title}</span>
          </div>
        )}
      </div>

      {/* Version Selector Card */}
      <Card className="mb-6 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{tp.selectVersionsToCompare || '选择版本进行对比'}</h2>
              <p className="text-sm text-gray-500">{tp.compareDifferences || '对比两个版本之间的差异'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-end">
            {/* Left Version */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {tp.leftVersionLabel || '旧版本'}
              </label>
              <Select value={leftVersion || ''} onValueChange={setLeftVersion}>
                <SelectTrigger className="hover:border-orange-300 transition-colors">
                  <SelectValue placeholder={tp.selectVersionPlaceholder || '选择版本'}>
                    {leftVersion ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-orange-600">v{leftVersion}</span>
                        {versions.find(v => v.version === leftVersion) && (
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(versions.find(v => v.version === leftVersion).created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortedVersions.map((version, index) => (
                    <SelectItem key={version.id} value={version.version}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">v{version.version}</span>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-200">
                              {tp.latestBadge || '最新'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="hidden md:flex items-center justify-center pb-2">
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>

            {/* Right Version */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {tp.rightVersionLabel || '新版本'}
              </label>
              <Select value={rightVersion || ''} onValueChange={setRightVersion}>
                <SelectTrigger className="hover:border-green-300 transition-colors">
                  <SelectValue placeholder={tp.selectVersionPlaceholder || '选择版本'}>
                    {rightVersion ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-green-600">v{rightVersion}</span>
                        {versions.find(v => v.version === rightVersion) && (
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(versions.find(v => v.version === rightVersion).created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortedVersions.map((version, index) => (
                    <SelectItem key={version.id} value={version.version}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">v{version.version}</span>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-200">
                              {tp.latestBadge || '最新'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile Divider */}
          <div className="md:hidden flex items-center justify-center py-4">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-16 h-px bg-gray-300" />
              <span className="text-sm font-medium">VS</span>
              <div className="w-16 h-px bg-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      <Card className="shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{tp.versionComparison || '对比'}</span>
              <span className="font-mono text-orange-600">v{leftVersion || '-'}</span>
              <span className="text-gray-400">→</span>
              <span className="font-mono text-green-600">v{rightVersion || '-'}</span>
            </div>
          </div>

          {loadingContent && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
              {tp.loading || '加载中...'}
            </div>
          )}
        </div>

        <div className="h-[calc(100vh-28rem)] min-h-[500px]">
          {loadingContent ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <p className="text-gray-500 text-sm">{tp.loadingVersionContent || tp.loading || '正在加载版本内容...'}</p>
            </div>
          ) : (
            <div className="h-full">
              <PromptDiffViewer
                oldContent={leftContent}
                newContent={rightContent}
                t={t}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

