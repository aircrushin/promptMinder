'use client';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, History, Loader2 } from "lucide-react"
import ChatTestWrapper from '@/components/chat/ChatTestWrapper';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeam } from '@/contexts/team-context';
import { useUser } from "@clerk/nextjs";
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import VariableInputs from '@/components/prompt/VariableInputs';
import { replaceVariables } from '@/lib/promptVariables';
import PromptHeader from '@/components/prompt/PromptHeader';
import PromptContent from '@/components/prompt/PromptContent';
import PromptWorkflowPanel from '@/components/prompt/PromptWorkflowPanel';
import DeleteConfirmDialog from '@/components/prompt/DeleteConfirmDialog';
import { PromptSkeleton } from '@/components/prompt/PromptSkeleton';
import { usePromptDetail } from '@/hooks/use-prompt-detail';
import { WorkspaceSkillPanel } from '@/components/skill/WorkspaceSkillPanel';
import { ExportSkillButton } from '@/components/skill/ExportSkillButton';

export default function PromptDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useUser();
  const { activeTeamId, activeMembership, isPersonal } = useTeam();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const {
    prompt,
    versions,
    selectedVersion,
    variableValues,
    hasVariables,
    isLoading,
    handleVersionChange,
    handleVariablesChange,
    updatePrompt
  } = usePromptDetail(id);

  // Calculate rendered content when variables are present
  const renderedContent = hasVariables && prompt ? 
    replaceVariables(prompt.content, variableValues) : 
    prompt?.content || '';

  if (!t || isLoading) {
    return <PromptSkeleton />;
  }

  if (!prompt) {
    return <PromptSkeleton />;
  }

  const isCreator = prompt.created_by === user?.id || prompt.user_id === user?.id;
  const role = activeMembership?.role;
  const isManager = role === 'admin' || role === 'owner';
  const canManage = isPersonal || isCreator || isManager;
  const latestVersion = versions[0] || null;
  const isHistoricalVersion = Boolean(latestVersion && latestVersion.id !== prompt.id);

  const tp = t.promptDetailPage;

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await apiClient.restorePromptVersion(
        prompt.id,
        activeTeamId ? { teamId: activeTeamId } : {}
      );

      if (result?.mode === 'approval_required' && result?.change_request?.id) {
        toast({
          description: tp.restorePendingApproval || '恢复请求已提交审批',
        });
        router.push(`/prompts/reviews/${result.change_request.id}`);
        return;
      }

      const newVersion = result?.prompt?.version || '';
      toast({
        description: (tp.restoreSuccess || '已恢复为新版本 v{version}').replace('{version}', newVersion),
      });

      if (result?.prompt?.id) {
        router.push(`/prompts/${result.prompt.id}`);
      }
    } catch (error) {
      console.error('Error restoring prompt version:', error);
      toast({
        variant: 'destructive',
        description: error.message || tp.restoreError || '恢复失败，请重试',
      });
    } finally {
      setIsRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Button
          variant="ghost"
          className="text-muted-foreground hover:bg-secondary"
          onClick={() => router.push('/prompts')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tp.backToList}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <ExportSkillButton prompt={prompt} />
          <Button variant="outline" onClick={() => router.push(`/prompts/evaluations?promptId=${prompt.id}`)}>{t.evaluations.title}</Button>
          {isHistoricalVersion && canManage && (
            <Button
              variant="default"
              className="text-sm"
              onClick={() => setShowRestoreConfirm(true)}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <History className="h-4 w-4 mr-2" />
              )}
              {isRestoring ? (tp.restoringVersion || '恢复中...') : (tp.restoreVersion || '恢复此版本')}
            </Button>
          )}
          {versions.length > 1 && (
            <Button
              variant="outline"
              className="text-sm"
              onClick={() => router.push(`/prompts/${id}/diff`)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              {tp.viewDiffButton || "查看差异"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[calc(100vh-12rem)] flex flex-col">
          <Card className="border-none shadow-lg bg-gradient-to-br from-background to-secondary/10 flex-1 overflow-hidden flex flex-col">
            <CardContent className="p-4 sm:p-6 flex flex-col h-full">
              <PromptHeader
                prompt={prompt}
                versions={versions}
                selectedVersion={selectedVersion}
                onVersionChange={handleVersionChange}
                onDelete={() => setShowDeleteConfirm(true)}
                onPromptUpdate={updatePrompt}
                onAddTag={updatePrompt}
                t={t}
                canManage={canManage}
              />

              {/* Variable inputs */}
              <div className="mb-3">
                <VariableInputs
                  content={prompt.content}
                  onVariablesChange={handleVariablesChange}
                  className=""
                />
              </div>

              {/* Prompt content */}
              <PromptContent
                prompt={prompt}
                onPromptUpdate={updatePrompt}
                hasVariables={hasVariables}
                renderedContent={renderedContent}
                t={t}
                canManage={canManage}
              />

              <PromptWorkflowPanel promptId={prompt.id} />
            </CardContent>
          </Card>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <ChatTestWrapper 
            prompt={prompt} 
            t={t} 
            variableValues={variableValues}
            hasVariables={hasVariables}
          />
        </div>
      </div>

      <WorkspaceSkillPanel key={`${prompt.id}:${activeTeamId || 'personal'}`} prompt={prompt} />

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        promptId={id}
        t={t}
      />

      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tp.restoreConfirmTitle || '确认恢复版本'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(tp.restoreConfirmDescription || '将基于 v{version} 创建一条新的最新版本，不会删除现有历史。')
                .replace('{version}', prompt.version || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              {tp.cancel || '取消'}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRestoring}
              onClick={(event) => {
                event.preventDefault();
                handleRestore();
              }}
            >
              {isRestoring
                ? (tp.restoringVersion || '恢复中...')
                : (tp.restoreConfirm || '确认恢复')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
