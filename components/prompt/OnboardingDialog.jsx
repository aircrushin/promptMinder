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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Rocket, Sparkles, Upload } from 'lucide-react';

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

  const tabRoleLabel = uiCopy.startRole;
  const tabImportLabel = uiCopy.importFromChat;
  const roleCountLabel = `${roles.length} ${uiCopy.roleCountSuffix}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <div className="relative isolate overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_20%_25%,rgba(16,185,129,0.12),transparent_30%)]" />
          <div className="absolute -left-10 top-20 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative z-10 p-4 sm:p-6 md:p-7">
            <DialogHeader className="space-y-3 text-left">
              <DialogTitle className="text-2xl leading-tight tracking-tight sm:text-[1.75rem]">
                {uiCopy.title}
              </DialogTitle>
              <DialogDescription className="text-[15px] leading-6 text-muted-foreground max-w-3xl">
                {uiCopy.description}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 space-y-4">
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-muted/70 p-1">
                <TabsTrigger
                  value="role"
                  className="h-10 gap-2 rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Rocket className="h-4 w-4" />
                  <span>{tabRoleLabel}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="import"
                  className="h-10 gap-2 rounded-lg text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  <span>{tabImportLabel}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="role" className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p>{uiCopy.roleHint}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {roles.map((role) => (
                    <Card
                      key={role.id}
                      className="group relative overflow-hidden border-border/70 bg-card/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-emerald-500/[0.05] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <div className="relative space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold leading-5">{role.title}</h3>
                          <Badge variant="secondary" className="rounded-full">
                            {uiCopy.recommended}
                          </Badge>
                        </div>
                        <p className="min-h-8 text-sm text-muted-foreground">{role.description}</p>
                        <div className="rounded-lg border border-border/70 bg-background/70 p-2.5">
                          <p className="line-clamp-2 text-xs leading-5 text-foreground/85">{role.promptTitle}</p>
                        </div>
                        <Button
                          className="h-11 w-full gap-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
                          onClick={() => handleApplyRole(role)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {uiCopy.applyRole}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <div className="grid gap-3 rounded-xl border border-border/70 bg-card/70 p-4 md:grid-cols-[1.2fr_2fr]">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{uiCopy.sourceLabel}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={source === 'chatgpt' ? 'default' : 'outline'}
                        onClick={() => setSource('chatgpt')}
                        className="h-11 min-w-[96px]"
                      >
                        {uiCopy.sourceChatgpt}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={source === 'claude' ? 'default' : 'outline'}
                        onClick={() => setSource('claude')}
                        className="h-11 min-w-[96px]"
                      >
                        {uiCopy.sourceClaude}
                      </Button>
                    </div>
                    <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                      <ol className="space-y-1 text-xs leading-5 text-muted-foreground">
                        {uiCopy.importSteps.map((step, index) => (
                          <li key={`${step}-${index}`}>{index + 1}. {step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{uiCopy.conversationLabel}</p>
                      <span className="text-xs text-muted-foreground">
                        {trimmedConversation.length} / 50000
                      </span>
                    </div>
                    <Textarea
                      value={conversation}
                      onChange={(event) => setConversation(event.target.value)}
                      placeholder={uiCopy.conversationPlaceholder}
                      className="min-h-[210px] bg-background/90 text-sm leading-6 focus-visible:ring-2 focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">{uiCopy.importTip}</p>

                <Button
                  onClick={handleConvert}
                  disabled={isImporting}
                  className="h-12 w-full gap-2 text-sm focus-visible:ring-2 focus-visible:ring-primary/40"
                  variant={isConversationValid ? 'default' : 'secondary'}
                >
                  {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{isImporting ? uiCopy.converting : uiCopy.convert}</span>
                </Button>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:space-x-0">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-5">
                {uiCopy.skip}
              </Button>
              <p className="text-xs text-muted-foreground">
                {uiCopy.footerHint}
              </p>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OnboardingDialog;
