'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import {
  ArrowLeft,
  Check,
  Copy,
  Plug,
  ShieldCheck,
  TerminalSquare,
  WandSparkles,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const CODE_SURFACE_CLASSNAME = 'border-t border-white/10 bg-[#101216] text-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
const DEFAULT_ORIGIN = 'https://www.prompt-minder.com'

const FALLBACK_ZH = {
  pageBadge: '设置',
  pageTitle: 'MCP',
  pageStatus: 'oauth',
  pageDescription: '把 PromptMinder 接到 Cursor、Claude、ChatGPT 或其他 AI agent。授权一次后，就能用模糊查询或斜杠快捷方式取出你的提示词。',
  backAction: '返回 CLI Tokens',
  signInTitle: '先登录再连接 MCP',
  signInDescription: 'MCP 使用 Clerk OAuth 授权。登录后即可把这个地址加到任意支持 MCP 的客户端。',
  signInAction: '登录',
  urlTitle: '公开地址',
  urlDescription: '所有 MCP 客户端都连接这个 HTTPS 地址。首次使用时会弹出 PromptMinder 授权页。',
  toolsTitle: '当前可用能力',
  tools: [
    {
      name: 'search_prompts',
      body: '用自然语言、斜杠快捷方式、标签或 id 搜索提示词摘要。',
    },
    {
      name: 'get_prompt',
      body: '用搜索结果里的 id 取出完整提示词内容。',
    },
    {
      name: 'list_teams',
      body: '查看可访问的个人空间和团队空间。不传 team_id 时默认搜全部。',
    },
  ],
  shortcutTitle: '查询快捷方式',
  shortcutDescription: 'search_prompts 的 query，或客户端里的 /prompt，都支持这些写法。',
  shortcuts: [
    { example: '/code-review', body: '按标题快捷方式查找，连字符和空格等价。' },
    { example: 'tag:writing 或 #sql', body: '按标签过滤。' },
    { example: '帮我找周报', body: '模糊匹配标题、描述和标签。' },
    { example: 'id:<uuid>', body: '按精确 id 取出一条。' },
  ],
  connectTitle: '连接到 AI 客户端',
  connectDescription: '把 MCP 地址加进去后选择登录。授权完成前，客户端会显示 Needs login。',
  cursorTitle: 'Cursor',
  claudeTitle: 'Claude Code',
  chatgptTitle: 'ChatGPT / Claude Desktop',
  chatgptBody: '在自定义连接器里粘贴 MCP 地址，然后完成 OAuth 授权。',
  tokenTitle: '调试用 Token（可选）',
  tokenDescription: 'OAuth 是正式接入方式。本地或脚本也可以用 CLI Token 作为 Bearer。',
  tokenAction: '管理 CLI Tokens',
  clerkTitle: 'Clerk 后台需要打开的开关',
  clerkDescription: '生产环境要在 Clerk Dashboard 的 OAuth Applications 里启用 CIMD 或 Dynamic Client Registration，客户端才能自动完成授权。',
}

const FALLBACK_EN = {
  pageBadge: 'Settings',
  pageTitle: 'MCP',
  pageStatus: 'oauth',
  pageDescription: 'Connect PromptMinder to Cursor, Claude, ChatGPT, or any MCP-capable agent. After one OAuth approval, agents can fetch your prompts with fuzzy queries or slash shortcuts.',
  backAction: 'Back to CLI Tokens',
  signInTitle: 'Sign in to connect MCP',
  signInDescription: 'MCP uses Clerk OAuth. After you sign in, add this URL to any MCP-compatible client.',
  signInAction: 'Sign in',
  urlTitle: 'Public endpoint',
  urlDescription: 'Every MCP client connects to this HTTPS URL. The first connection opens a PromptMinder authorization screen.',
  toolsTitle: 'What agents can do now',
  tools: [
    {
      name: 'search_prompts',
      body: 'Search prompt summaries with natural language, slash shortcuts, tags, or an id.',
    },
    {
      name: 'get_prompt',
      body: 'Load full prompt content from an id returned by search.',
    },
    {
      name: 'list_teams',
      body: 'List personal and team workspaces. Omit team_id to search everything you can access.',
    },
  ],
  shortcutTitle: 'Lookup shortcuts',
  shortcutDescription: 'These work in search_prompts and in clients that expose the /prompt MCP prompt.',
  shortcuts: [
    { example: '/code-review', body: 'Match a title shortcut. Hyphens and spaces are equivalent.' },
    { example: 'tag:writing or #sql', body: 'Filter by tag.' },
    { example: 'weekly report helper', body: 'Fuzzy-match title, description, and tags.' },
    { example: 'id:<uuid>', body: 'Fetch one prompt by exact id.' },
  ],
  connectTitle: 'Connect an AI client',
  connectDescription: 'Add the MCP URL, then choose log in. Clients show Needs login until OAuth finishes.',
  cursorTitle: 'Cursor',
  claudeTitle: 'Claude Code',
  chatgptTitle: 'ChatGPT / Claude Desktop',
  chatgptBody: 'Paste the MCP URL into a custom connector, then complete OAuth.',
  tokenTitle: 'Optional debug token',
  tokenDescription: 'OAuth is the supported login path. Local scripts can also send a CLI token as a Bearer credential.',
  tokenAction: 'Manage CLI Tokens',
  clerkTitle: 'Clerk dashboard switch',
  clerkDescription: 'In production, enable CIMD or Dynamic Client Registration under Clerk Dashboard → OAuth Applications so clients can authorize themselves.',
}

function CopyButton({ text, label, copiedLabel }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore clipboard errors */
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide transition-all duration-150',
        copied
          ? 'border-black bg-black text-white'
          : 'border-black text-black hover:bg-black hover:text-white',
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

function CodeBlock({ title, description, code, copyLabel, copiedLabel }) {
  return (
    <div className="border border-black">
      <div className="flex items-start justify-between gap-4 border-b border-black px-5 py-4">
        <div className="space-y-1">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{title}</h3>
          {description && <p className="max-w-2xl text-sm leading-relaxed text-black/60">{description}</p>}
        </div>
        <CopyButton text={code} label={copyLabel} copiedLabel={copiedLabel} />
      </div>
      <div className={cn('px-5 py-4', CODE_SURFACE_CLASSNAME)}>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-[#f8fafc]">
          <code className="text-inherit">{code}</code>
        </pre>
      </div>
    </div>
  )
}

export default function McpSettingsPage() {
  const { language, t } = useLanguage()
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN)
  const fallback = language === 'en' ? FALLBACK_EN : FALLBACK_ZH
  const translations = {
    ...fallback,
    ...(t?.mcp || {}),
    tools: t?.mcp?.tools || fallback.tools,
    shortcuts: t?.mcp?.shortcuts || fallback.shortcuts,
  }
  const copyLabel = language === 'en' ? 'Copy' : '复制'
  const copiedLabel = language === 'en' ? 'Copied' : '已复制'

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const mcpUrl = `${origin}/mcp`
  const cursorConfig = useMemo(() => JSON.stringify({
    mcpServers: {
      promptminder: {
        url: mcpUrl,
      },
    },
  }, null, 2), [mcpUrl])
  const claudeCommand = `claude mcp add --transport http promptminder ${mcpUrl}`
  const tokenConfig = useMemo(() => JSON.stringify({
    mcpServers: {
      promptminder: {
        url: mcpUrl,
        headers: {
          Authorization: 'Bearer pm_xxx',
        },
      },
    },
  }, null, 2), [mcpUrl])

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/settings/cli-tokens"
              className="inline-flex items-center gap-2 border border-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              {translations.backAction}
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4 text-black/35" />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-black/40">{translations.pageBadge}</span>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <h1 className="text-4xl font-bold tracking-tight text-black">{translations.pageTitle}</h1>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="block h-1.5 w-1.5 animate-pulse bg-black" />
                <span className="font-mono text-xs text-black/40">{translations.pageStatus}</span>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-black/58">{translations.pageDescription}</p>
          </div>
        </header>

        <SignedOut>
          <section className="border border-black p-6">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.signInTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/58">{translations.signInDescription}</p>
            <div className="mt-4">
              <SignInButton mode="modal" redirectUrl="/settings/mcp">
                <button className="border border-black bg-black px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-wide text-white">
                  {translations.signInAction}
                </button>
              </SignInButton>
            </div>
          </section>
        </SignedOut>

        <section className="border border-black">
          <div className="flex items-start justify-between gap-4 border-b border-black px-5 py-4">
            <div className="space-y-1">
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.urlTitle}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-black/60">{translations.urlDescription}</p>
            </div>
            <CopyButton text={mcpUrl} label={copyLabel} copiedLabel={copiedLabel} />
          </div>
          <div className={cn('px-5 py-4', CODE_SURFACE_CLASSNAME)}>
            <code className="block overflow-x-auto font-mono text-sm text-[#f8fafc]">{mcpUrl}</code>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4 text-black/35" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-black">{translations.toolsTitle}</h2>
          </div>
          <div className="grid gap-px bg-black md:grid-cols-3">
            {translations.tools.map((tool) => (
              <div key={tool.name} className="space-y-2 bg-white px-5 py-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-black/50">{tool.name}</p>
                <p className="text-sm leading-relaxed text-black/72">{tool.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-black">{translations.shortcutTitle}</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-black/58">{translations.shortcutDescription}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {translations.shortcuts.map((item) => (
              <div key={item.example} className="border border-black p-5">
                <code className="font-mono text-sm text-black">{item.example}</code>
                <p className="mt-2 text-sm leading-relaxed text-black/58">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-black/35" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-black">{translations.connectTitle}</h2>
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-black/58">{translations.connectDescription}</p>
          <CodeBlock
            title={translations.cursorTitle}
            code={cursorConfig}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
          <CodeBlock
            title={translations.claudeTitle}
            code={claudeCommand}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
          <div className="border border-black p-5">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.chatgptTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/58">{translations.chatgptBody}</p>
            <code className="mt-3 block font-mono text-sm text-black">{mcpUrl}</code>
          </div>
        </section>

        <SignedIn>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="border border-black p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-black/35" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.clerkTitle}</h2>
              </div>
              <p className="text-sm leading-relaxed text-black/58">{translations.clerkDescription}</p>
            </div>
            <div className="border border-black">
              <div className="flex items-start justify-between gap-4 border-b border-black px-5 py-4">
                <div className="space-y-1">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.tokenTitle}</h2>
                  <p className="text-sm leading-relaxed text-black/58">{translations.tokenDescription}</p>
                </div>
                <Link
                  href="/settings/cli-tokens"
                  className="inline-flex items-center border border-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                >
                  {translations.tokenAction}
                </Link>
              </div>
              <div className={cn('px-5 py-4', CODE_SURFACE_CLASSNAME)}>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-[#f8fafc]">
                  <code className="text-inherit">{tokenConfig}</code>
                </pre>
              </div>
            </div>
          </section>
        </SignedIn>
      </div>
    </div>
  )
}
