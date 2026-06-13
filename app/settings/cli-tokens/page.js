'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignInButton, useUser } from '@clerk/nextjs'
import { Terminal, Copy, Plus, KeyRound, Trash2, ExternalLink, Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { apiClient, ApiError } from '@/lib/api-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const FALLBACK_TRANSLATIONS = {
  pageBadge: '设置',
  pageTitle: 'CLI Tokens',
  pageStatus: 'secure',
  pageDescription: '每个 token 代表你的账户权限。新 token 只会显示一次，适合给本地 CLI、自动化脚本和 AI agent 使用。',
  createTitle: '创建新 Token',
  createDescription: '建议一个 agent 配一个 token，用名称区分环境或用途',
  createAction: '创建 Token',
  creatingAction: '创建中...',
  namePlaceholder: 'agent-prod',
  revealTitle: '请立即保存明文 Token',
  revealDescription: '此值不会再次显示，请放进环境变量或密钥管理系统',
  copyToken: '复制 Token',
  docsAction: '查看完整文档',
  quickSetupTitle: '快速配置命令',
  quickSetupDescription: 'CLI 默认连接 https://www.prompt-minder.com',
  copyCommand: '复制命令',
  listTitle: '现有 Tokens',
  listDescription: '已删除 token 立即失效，列表保留历史记录',
  listCount: '{count} 个',
  listLoading: 'loading...',
  emptyTitle: '还没有 CLI token',
  emptyDescriptionPrefix: '先创建一个，然后执行',
  statusActive: '生效中',
  statusRevoked: '已删除',
  createdAt: '创建 {value}',
  lastUsedAt: '最近使用 {value}',
  revokeAction: '删除',
  revokingAction: '删除中...',
  howToUseTitle: '如何使用',
  steps: [
    {
      step: '01',
      text: '安装 CLI',
      code: 'npm i -g @aircrushin/promptminder-cli',
    },
    {
      step: '02',
      text: '创建 Token',
      desc: '在上方表单输入名称，点击「创建 Token」',
    },
    {
      step: '03',
      text: '配置认证',
      code: 'promptminder auth login --token <YOUR_TOKEN>',
    },
    {
      step: '04',
      text: '验证连接',
      code: 'promptminder team list',
    },
  ],
  dialogTitle: '确认删除 Token？',
  dialogDescription: '删除后，此 token 将无法继续调用 CLI 和 agent 封装能力。此操作不可恢复。',
  dialogCancel: '取消',
  dialogConfirm: '确认删除',
  authTitle: 'Access Required',
  authDescription: '登录后即可自助创建、查看和删除 PromptMinder CLI token。',
  authAction: '登录后继续',
  officialSite: '官网',
  loadingState: 'initializing...',
  toasts: {
    loadFailedTitle: '加载失败',
    loadFailedDescription: '无法加载 CLI tokens',
    nameRequiredTitle: '名称必填',
    nameRequiredDescription: '请先输入 token 名称，例如 agent-prod。',
    createSuccessTitle: '创建成功',
    createSuccessDescription: '明文 token 只会显示这一次，请立即复制保存。',
    createFailedTitle: '创建失败',
    createFailedDescription: '无法创建 CLI token',
    revokeSuccessTitle: '已删除',
    revokeSuccessDescription: 'Token "{name}" 已失效。',
    revokeFailedTitle: '删除失败',
    revokeFailedDescription: '无法删除 CLI token',
  },
}

const FALLBACK_COMMON = {
  copy: '复制',
  copied: '已复制',
}

function interpolate(template, values = {}) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  )
}

function formatDateTime(value, language) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function buildInstallSnippet(token) {
  return [
    `export PROMPTMINDER_TOKEN=${token}`,
    `promptminder auth login --token ${token}`,
    'promptminder team list',
  ].join('\n')
}

function CopyButton({ text, label, copiedLabel, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border transition-all duration-150',
        copied
          ? 'bg-black text-white border-black'
          : 'bg-white text-black border-black hover:bg-black hover:text-white',
        className
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

export default function CliTokensPage() {
  const { isLoaded, isSignedIn } = useUser()
  const { language, t } = useLanguage()
  const { toast } = useToast()
  const [tokens, setTokens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [revokingId, setRevokingId] = useState(null)
  const [name, setName] = useState('agent-prod')
  const [newSecret, setNewSecret] = useState(null)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const translations = {
    ...FALLBACK_TRANSLATIONS,
    ...(t?.cliTokens || {}),
    steps: t?.cliTokens?.steps || FALLBACK_TRANSLATIONS.steps,
    toasts: {
      ...FALLBACK_TRANSLATIONS.toasts,
      ...(t?.cliTokens?.toasts || {}),
    },
  }
  const commonTranslations = {
    ...FALLBACK_COMMON,
    ...(t?.common || {}),
  }

  const installSnippet = useMemo(() => {
    if (!newSecret) return ''
    return buildInstallSnippet(newSecret)
  }, [newSecret])

  const loadTokens = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await apiClient.getCliTokens()
      setTokens(Array.isArray(result?.tokens) ? result.tokens : [])
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : translations.toasts.loadFailedDescription
      toast({ title: translations.toasts.loadFailedTitle, description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast, translations.toasts.loadFailedDescription, translations.toasts.loadFailedTitle])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false)
      return
    }
    loadTokens()
  }, [isLoaded, isSignedIn, loadTokens])

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast({
        title: translations.toasts.nameRequiredTitle,
        description: translations.toasts.nameRequiredDescription,
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await apiClient.createCliToken(trimmedName)
      setNewSecret(result?.plain_text_token || null)
      setTokens((prev) => {
        const nextToken = result?.token
        if (!nextToken) return prev
        return [nextToken, ...prev]
      })
      setName('agent-prod')
      toast({
        title: translations.toasts.createSuccessTitle,
        description: translations.toasts.createSuccessDescription
      })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : translations.toasts.createFailedDescription
      toast({ title: translations.toasts.createFailedTitle, description: message, variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }, [name, toast, translations.toasts])

  const handleRevoke = useCallback(async () => {
    if (!revokeTarget) return

    setRevokingId(revokeTarget.id)
    try {
      await apiClient.revokeCliToken(revokeTarget.id)
      setTokens((prev) => prev.map((token) => (
        token.id === revokeTarget.id
          ? { ...token, revoked_at: new Date().toISOString(), is_revoked: true }
          : token
      )))
      toast({
        title: translations.toasts.revokeSuccessTitle,
        description: interpolate(translations.toasts.revokeSuccessDescription, { name: revokeTarget.name })
      })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : translations.toasts.revokeFailedDescription
      toast({ title: translations.toasts.revokeFailedTitle, description: message, variant: 'destructive' })
    } finally {
      setRevokingId(null)
      setRevokeTarget(null)
    }
  }, [revokeTarget, toast, translations.toasts])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-black/40">
          <span className="inline-block w-2 h-2 bg-black animate-pulse" />
          {translations.loadingState}
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center gap-3">
            <Terminal className="h-4 w-4 text-black" />
            <span className="font-mono text-sm font-medium tracking-widest uppercase">{translations.pageTitle}</span>
          </div>
          <div className="px-6 py-8 space-y-6">
            <div className="space-y-2">
              <p className="font-mono text-xs text-black/50 uppercase tracking-widest">{translations.authTitle}</p>
              <p className="text-sm text-black/70 leading-relaxed">
                {translations.authDescription}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal" redirectUrl="/settings/cli-tokens">
                <button className="px-4 py-2 bg-black text-white text-sm font-mono font-medium hover:bg-black/80 transition-colors">
                  {translations.authAction}
                </button>
              </SignInButton>
              <Link
                href="https://www.prompt-minder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-black text-sm font-mono font-medium hover:bg-black hover:text-white transition-colors"
              >
                {translations.officialSite}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Page Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5 text-black/40" />
              <span className="font-mono text-xs text-black/40 uppercase tracking-widest">{translations.pageBadge}</span>
            </div>
            <Link
              href="/settings/cli-tokens/docs"
              className="inline-flex items-center gap-1.5 border border-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              {translations.docsAction}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex items-end gap-4">
            <h1 className="text-4xl font-bold tracking-tight text-black leading-none">{translations.pageTitle}</h1>
            <div className="mb-1 flex items-center gap-1.5 pb-0.5">
              <span className="block w-1.5 h-1.5 bg-black animate-pulse" />
              <span className="font-mono text-xs text-black/40">{translations.pageStatus}</span>
            </div>
          </div>
          <p className="text-sm text-black/55 max-w-xl leading-relaxed">
            {translations.pageDescription}
          </p>
        </div>

        {/* Create Token */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">{translations.createTitle}</h2>
              <p className="mt-0.5 font-mono text-xs text-black/45">
                {translations.createDescription}
              </p>
            </div>
            <Plus className="h-4 w-4 text-black/30" />
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translations.namePlaceholder}
                maxLength={80}
                className="flex-1 px-3 py-2 border border-black font-mono text-sm bg-white text-black placeholder:text-black/30 outline-none focus:bg-black/[0.02] transition-colors"
              />
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-black text-white font-mono text-sm font-medium hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                {isCreating ? translations.creatingAction : translations.createAction}
              </button>
            </div>

            {newSecret && (
              <div className="border border-black">
                {/* Warning header */}
                <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest">⚠ {translations.revealTitle}</p>
                    <p className="font-mono text-xs text-white/60">{translations.revealDescription}</p>
                  </div>
                  <CopyButton
                    text={newSecret}
                    label={translations.copyToken}
                    copiedLabel={commonTranslations.copied}
                    className="border-white text-white bg-transparent hover:bg-white hover:text-black"
                  />
                </div>

                {/* Token value */}
                <div className="bg-[#0a0a0a] px-5 py-4">
                  <pre className="font-mono text-xs text-white/90 overflow-x-auto whitespace-pre-wrap break-all">
                    <code>{newSecret}</code>
                  </pre>
                </div>

                {/* Quick setup */}
                <div className="border-t border-black px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-black">{translations.quickSetupTitle}</p>
                      <p className="font-mono text-xs text-black/45 mt-0.5">{translations.quickSetupDescription}</p>
                    </div>
                    <CopyButton text={installSnippet} label={translations.copyCommand} copiedLabel={commonTranslations.copied} />
                  </div>
                  <div className="bg-[#0a0a0a] px-5 py-4">
                    <pre className="font-mono text-xs text-white/90 overflow-x-auto">
                      <code>{installSnippet}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Token List */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">{translations.listTitle}</h2>
              <p className="mt-0.5 font-mono text-xs text-black/45">{translations.listDescription}</p>
            </div>
            {!isLoading && tokens.length > 0 && (
              <span className="font-mono text-xs text-black/40">{interpolate(translations.listCount, { count: tokens.length })}</span>
            )}
          </div>

          {isLoading ? (
            <div className="px-6 py-12 flex items-center gap-3">
              <span className="block w-1.5 h-1.5 bg-black animate-pulse" />
              <span className="font-mono text-xs text-black/40">{translations.listLoading}</span>
            </div>
          ) : tokens.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Terminal className="h-8 w-8 text-black/15 mx-auto mb-4" />
              <p className="font-mono text-sm text-black/40">{translations.emptyTitle}</p>
              <p className="font-mono text-xs text-black/30 mt-1">
                {translations.emptyDescriptionPrefix} <code className="bg-black/5 px-1">promptminder auth login</code>
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {tokens.map((token, index) => (
                <div
                  key={token.id}
                  className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-black/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-xs text-black/20 mt-0.5 w-5 text-right shrink-0 select-none">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-black">{token.name}</span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest border',
                            token.is_revoked
                              ? 'border-black/20 text-black/35 bg-transparent'
                              : 'border-black bg-black text-white'
                          )}
                        >
                          {token.is_revoked ? translations.statusRevoked : translations.statusActive}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-black/40 flex flex-wrap gap-x-5 gap-y-1">
                        <span>{interpolate(translations.createdAt, { value: formatDateTime(token.created_at, language) })}</span>
                        <span>{interpolate(translations.lastUsedAt, { value: formatDateTime(token.last_used_at, language) })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pl-9 sm:pl-0 shrink-0">
                    {!token.is_revoked && (
                      <button
                        disabled={revokingId === token.id}
                        onClick={() => setRevokeTarget(token)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/30 font-mono text-xs text-black/60 hover:border-black hover:text-black hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        <Trash2 className="h-3 w-3" />
                        {revokingId === token.id ? translations.revokingAction : translations.revokeAction}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to use */}
        <section className="border border-black">
          <div className="border-b border-black px-6 py-4">
            <h2 className="font-mono text-sm font-semibold tracking-wide uppercase">{translations.howToUseTitle}</h2>
          </div>
          <div className="px-6 py-5">
            <ol className="space-y-0 divide-y divide-black/8">
              {translations.steps.map(({ step, text, code, desc }) => (
                <div key={step} className="flex items-start gap-5 py-4">
                  <span className="font-mono text-2xl font-bold text-black/10 leading-none shrink-0 w-8">{step}</span>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold uppercase tracking-wide text-black">{text}</p>
                    {code && (
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-xs text-black/70 bg-black/5 px-2 py-1 flex-1 min-w-0 overflow-x-auto">
                          {code}
                        </code>
                        <CopyButton text={code} label={commonTranslations.copy} copiedLabel={commonTranslations.copied} />
                      </div>
                    )}
                    {desc && <p className="font-mono text-xs text-black/45">{desc}</p>}
                  </div>
                </div>
              ))}
            </ol>
          </div>
        </section>

      </div>

      {/* Revoke Dialog */}
      <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent className="border border-black rounded-none shadow-none p-0 gap-0 max-w-md">
          <AlertDialogHeader className="border-b border-black px-6 py-5 space-y-1">
            <AlertDialogTitle className="font-mono text-sm font-semibold uppercase tracking-wide">
              {translations.dialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs text-black/55 leading-relaxed">
              {translations.dialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 flex flex-row items-center gap-3">
            <AlertDialogCancel className="flex-1 py-2 border border-black/30 font-mono text-xs text-black/60 hover:border-black hover:text-black hover:bg-transparent bg-transparent rounded-none shadow-none transition-colors">
              {translations.dialogCancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="flex-1 py-2 bg-black text-white font-mono text-xs hover:bg-black/80 rounded-none shadow-none transition-colors"
            >
              {translations.dialogConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
