'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_COPY = {
  headline: 'First Value in Minutes',
  title: 'Welcome to Prompt Minder',
  description: 'Choose a role template or paste a chat to quickly create your first prompt.',
  startRole: 'Start by Role',
  importFromChat: 'Import Chat',
  roleCountSuffix: 'role templates',
  roleHint: 'Choose a role template and we will prefill title, content, and tags.',
  recommended: 'Recommended',
  applyRole: 'Use This Template',
  sourceLabel: 'Conversation Source',
  sourceChatgpt: 'ChatGPT',
  sourceClaude: 'Claude',
  importSteps: [
    'Copy your ChatGPT/Claude conversation',
    'Paste it into the input area',
    'Generate a reusable prompt draft automatically',
  ],
  conversationLabel: 'Paste Conversation',
  conversationPlaceholder: 'Example:\nUser: Help me draft a launch campaign\nAssistant: Who is your primary audience?',
  importTip: 'After importing, refine once with your own business context.',
  convert: 'Convert to Prompt',
  converting: 'Converting...',
  skip: 'Maybe later',
  footerHint: 'You can reopen onboarding from the empty library state anytime.',
};

const FALLBACK_ROLES = [
  {
    id: 'developer',
    title: 'AI 开发工程师',
    description: '面向代码生成、重构、调试和架构讨论。',
    promptTitle: '开发任务执行助手',
    promptDescription: '用于拆解开发任务并输出可执行代码方案。',
    tags: '开发,Chatbot',
    promptContent:
      '你是一名资深全栈工程师。请根据输入任务输出可执行方案。\\n\\n输入信息：\\n- 目标：{{goal}}\\n- 技术栈：{{stack}}\\n- 约束：{{constraints}}\\n\\n输出要求：\\n1. 先给出方案概览（不超过 5 点）\\n2. 再给出分步骤实现\\n3. 提供关键代码片段\\n4. 列出风险与回滚建议',
  },
  {
    id: 'product',
    title: '产品经理',
    description: '适合需求分析、PRD 草稿和功能优先级规划。',
    promptTitle: '需求分析与 PRD 助手',
    promptDescription: '将想法转化为结构化需求文档和执行计划。',
    tags: '产品,需求分析',
    promptContent:
      '你是一名资深产品经理。请把输入内容整理成可执行需求文档。\\n\\n输入信息：\\n- 业务目标：{{business_goal}}\\n- 目标用户：{{target_user}}\\n- 场景与问题：{{scenario}}\\n\\n输出要求：\\n1. 问题定义与目标\\n2. 核心功能与非功能需求\\n3. 用户流程\\n4. 验收标准\\n5. 里程碑与风险',
  },
  {
    id: 'operations',
    title: '增长运营',
    description: '适合活动策划、投放文案和增长实验设计。',
    promptTitle: '增长活动策划助手',
    promptDescription: '快速生成增长活动方案、内容和复盘指标。',
    tags: '运营,增长',
    promptContent:
      '你是一名增长运营负责人。请针对目标设计增长方案。\\n\\n输入信息：\\n- 增长目标：{{goal}}\\n- 目标人群：{{audience}}\\n- 渠道资源：{{channels}}\\n\\n输出要求：\\n1. 目标拆解与策略\\n2. 执行节奏（按周）\\n3. 关键内容与素材建议\\n4. 指标监控与复盘模板',
  },
  {
    id: 'content',
    title: '内容创作者',
    description: '适合长文、短视频脚本和社媒文案创作。',
    promptTitle: '内容创作助手',
    promptDescription: '生成清晰、有传播力的内容草稿。',
    tags: '写作,内容',
    promptContent:
      '你是一名资深内容策划。请根据输入主题输出高质量内容草稿。\\n\\n输入信息：\\n- 主题：{{topic}}\\n- 受众：{{audience}}\\n- 发布渠道：{{channel}}\\n\\n输出要求：\\n1. 标题备选（至少 5 个）\\n2. 内容大纲\\n3. 完整正文\\n4. CTA 与互动问题\\n5. 可复用的改写版本',
  },
];

function normalizeRole(role, index) {
  return {
    id: role?.id || `role-${index + 1}`,
    title: role?.title || '通用助手',
    description: role?.description || '',
    promptTitle: role?.promptTitle || role?.title || '新提示词',
    promptDescription: role?.promptDescription || role?.description || '',
    promptContent: role?.promptContent || '',
    tags: role?.tags || 'Chatbot',
  };
}

export function OnboardingDialog({
  open,
  onOpenChange,
  copy,
  isImporting,
  onApplyRole,
  onImportConversation,
  onConversationInvalid,
}) {
  const [activeTab, setActiveTab] = useState('role');
  const [source, setSource] = useState('chatgpt');
  const [conversation, setConversation] = useState('');

  const roles = useMemo(() => {
    if (Array.isArray(copy?.roles) && copy.roles.length > 0) {
      return copy.roles.map(normalizeRole);
    }
    return FALLBACK_ROLES.map(normalizeRole);
  }, [copy?.roles]);
  const uiCopy = useMemo(() => {
    const importSteps =
      Array.isArray(copy?.importSteps) && copy.importSteps.length > 0
        ? copy.importSteps
        : DEFAULT_COPY.importSteps;

    return {
      ...DEFAULT_COPY,
      ...copy,
      importSteps,
    };
  }, [copy]);

  const trimmedConversation = conversation.trim();
  const isConversationValid = trimmedConversation.length >= 20;

  const handleApplyRole = (role) => {
    onApplyRole?.(role);
  };

  const handleConvert = () => {
    if (trimmedConversation.length < 20) {
      onConversationInvalid?.();
      return;
    }

    onImportConversation?.({
      source,
      conversation: trimmedConversation,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92vh] overflow-y-auto border-border bg-white p-0 shadow-2xl sm:rounded-xl">
        <div className="bg-white">
          <div className="border-b border-border px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
            <DialogHeader className="space-y-3 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {uiCopy.headline}
              </p>
              <DialogTitle className="text-[1.625rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.75rem]">
                {uiCopy.title}
              </DialogTitle>
              <DialogDescription className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {uiCopy.description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg border border-border bg-white p-1">
                <TabsTrigger
                  value="role"
                  className="h-9 rounded-md text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                >
                  {uiCopy.startRole}
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="h-9 rounded-md text-sm font-medium text-muted-foreground shadow-none data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none"
                >
                  {uiCopy.importFromChat}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="role" className="mt-0 space-y-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{uiCopy.roleHint}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground/80">
                    {roles.length} {uiCopy.roleCountSuffix}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((role, index) => (
                    <div
                      key={role.id}
                      className="group flex flex-col border border-border bg-white p-4 transition-colors duration-150 hover:border-foreground"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-border text-[11px] font-medium tabular-nums text-muted-foreground transition-colors duration-150 group-hover:border-foreground group-hover:text-foreground">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                            {role.title}
                          </h3>
                        </div>
                        {index === 0 ? (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            {uiCopy.recommended}
                          </span>
                        ) : null}
                      </div>
                      <p className="mb-3 min-h-[2.5rem] flex-1 text-sm leading-relaxed text-muted-foreground">
                        {role.description}
                      </p>
                      <p className="mb-4 border-t border-border pt-3 text-xs leading-5 text-foreground/70">
                        {role.promptTitle}
                      </p>
                      <Button
                        variant="outline"
                        className="h-10 w-full gap-2 border-border text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:ring-1 focus-visible:ring-foreground"
                        onClick={() => handleApplyRole(role)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {uiCopy.applyRole}
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="import" className="mt-0 space-y-5">
                <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <p className="text-sm font-medium text-foreground">{uiCopy.sourceLabel}</p>
                      <div className="flex gap-2">
                        {[
                          { id: 'chatgpt', label: uiCopy.sourceChatgpt },
                          { id: 'claude', label: uiCopy.sourceClaude },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSource(option.id)}
                            className={cn(
                              'h-10 min-w-[96px] border px-4 text-sm font-medium transition-colors duration-150',
                              source === option.id
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-white text-muted-foreground hover:border-foreground hover:text-foreground'
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ol className="space-y-0 border border-border">
                      {uiCopy.importSteps.map((step, index) => (
                        <li
                          key={`${step}-${index}`}
                          className={cn(
                            'flex gap-3 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground',
                            index < uiCopy.importSteps.length - 1 && 'border-b border-border'
                          )}
                        >
                          <span className="w-4 shrink-0 text-xs font-medium tabular-nums text-foreground">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{uiCopy.conversationLabel}</p>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {trimmedConversation.length} / 50000
                      </span>
                    </div>
                    <Textarea
                      value={conversation}
                      onChange={(event) => setConversation(event.target.value)}
                      placeholder={uiCopy.conversationPlaceholder}
                      className="min-h-[220px] resize-none rounded-none border-border bg-white text-sm leading-6 focus-visible:ring-1 focus-visible:ring-foreground"
                    />
                  </div>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">{uiCopy.importTip}</p>

                <Button
                  onClick={handleConvert}
                  disabled={isImporting}
                  className="h-11 w-full gap-2 text-sm font-medium focus-visible:ring-1 focus-visible:ring-foreground"
                  variant={isConversationValid ? 'default' : 'secondary'}
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{isImporting ? uiCopy.converting : uiCopy.convert}</span>
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-0 sm:px-8">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-10 px-3 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              {uiCopy.skip}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">{uiCopy.footerHint}</p>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingDialog;
