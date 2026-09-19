'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  Bot,
  Check,
  Copy,
  Plug,
  ShieldCheck,
  TerminalSquare,
  Wand2,
  Wrench,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const CODE_SURFACE_CLASSNAME = 'border-t border-white/10 bg-[#101216] text-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
const DEFAULT_ORIGIN = 'https://www.prompt-minder.com'

const FALLBACK_ZH = {
  pageBadge: '文档',
  pageTitle: 'MCP 接入说明',
  pageStatus: 'oauth',
  pageDescription: '这页集中说明 PromptMinder 远程 MCP 能做什么，以及如何把它装进 Cursor、Claude、ChatGPT 和其他 AI 客户端。授权一次后，agent 就能用模糊查询或斜杠快捷方式取出你的提示词。',
  backAction: '返回 MCP 设置',
  overviewCards: [
    {
      title: '功能',
      body: '只读查找：搜索提示词摘要、按 id 取完整内容、列出可访问工作区。客户端也可调用名为 prompt 的 MCP prompt。',
    },
    {
      title: '授权',
      body: '正式路径是 Clerk OAuth。首次连接会弹出 PromptMinder 登录页。本地调试也可用 CLI Token 作为 Bearer。',
    },
  ],
  quickstartTitle: '快速开始',
  quickstartDescription: '不需要安装本地 npm 包。把公开 HTTPS 地址加到客户端，完成一次 OAuth 即可开始查询。',
  quickstartSteps: [
    {
      index: '01',
      title: '复制 MCP 地址',
      description: '所有客户端都连接这个 Streamable HTTP 地址。',
      code: `${DEFAULT_ORIGIN}/mcp`,
    },
    {
      index: '02',
      title: '加到 AI 客户端',
      description: 'Cursor 写入 mcp.json，Claude Code 执行一条命令，ChatGPT 粘贴到自定义连接器。',
      code: `claude mcp add --transport http promptminder ${DEFAULT_ORIGIN}/mcp`,
    },
    {
      index: '03',
      title: '完成 OAuth 授权',
      description: '客户端会显示 Needs login。点登录后在浏览器完成 PromptMinder 授权。',
      code: 'Open the login prompt in your MCP client, then approve PromptMinder.',
    },
    {
      index: '04',
      title: '试一次查询',
      description: '用斜杠快捷方式或自然语言让 agent 取出提示词。',
      code: '/code-review',
    },
  ],
  clientsTitle: '按客户端安装',
  clientsDescription: '下面配置都指向同一个远程地址。支持 OAuth 的客户端会先显示 Needs login，授权完成后即可调用工具。',
  cursorTitle: 'Cursor',
  cursorDescription: '打开 Cursor Settings → MCP，新增 HTTP 服务器，或把 JSON 写入 ~/.cursor/mcp.json。保存后点 Login。',
  claudeCodeTitle: 'Claude Code',
  claudeCodeDescription: '在终端执行这条命令。首次调用工具时会打开浏览器授权。',
  claudeDesktopTitle: 'Claude Desktop',
  claudeDesktopDescription: '写入 Claude Desktop 的 mcpServers。若当前版本还不接受远程 URL，用 mcp-remote 做本地桥接。',
  chatgptTitle: 'ChatGPT',
  chatgptDescription: '在 ChatGPT 的 Connectors / 自定义连接器里粘贴 MCP 地址，然后完成 OAuth。',
  vscodeTitle: 'VS Code Copilot',
  vscodeDescription: '在工作区创建 .vscode/mcp.json，或在用户 MCP 设置里添加 HTTP 服务器。',
  windsurfTitle: 'Windsurf',
  windsurfDescription: '把配置写入 Windsurf 的 MCP 设置（通常是 mcp_config.json），保存后完成登录。',
  otherTitle: '其他 MCP 客户端',
  otherDescription: '任意支持 Streamable HTTP 和 OAuth 的客户端，把服务器 URL 设为这个地址即可。',
  toolsTitle: '当前可用能力',
  toolsDescription: 'MVP 只开放只读查找。search_prompts 返回摘要，完整内容必须再调 get_prompt。不传 team_id 时默认搜索你能访问的全部工作区。',
  tools: [
    {
      name: 'search_prompts',
      body: '用自然语言、斜杠快捷方式、标签或 id 搜索提示词摘要。可选 team_id、limit（1–20，默认 8）。',
    },
    {
      name: 'get_prompt',
      body: '用搜索结果里的 id 取出完整提示词内容。',
    },
    {
      name: 'list_teams',
      body: '列出可访问的个人空间和团队空间。个人空间的 team_id 为 null。',
    },
  ],
  promptTitle: 'MCP Prompt',
  promptDescription: '名为 prompt 的 MCP prompt 会按 query 查找。唯一高置信匹配时直接返回完整内容；多条结果会列出 id，再调用 get_prompt。',
  shortcutTitle: '查询快捷方式',
  shortcutDescription: '这些写法可用于 search_prompts 的 query，也可用于客户端里的 /prompt。',
  shortcuts: [
    { example: '/code-review', body: '按标题快捷方式查找。连字符、下划线和空格等价。' },
    { example: 'tag:writing 或 #sql', body: '按标签过滤。' },
    { example: '帮我找周报', body: '模糊匹配标题、描述和标签。' },
    { example: 'id:<uuid>', body: '按精确 id 取出一条。' },
    { example: 'team:<uuid>', body: '把本次查询限制在指定团队。也可单独传 team_id 参数。' },
  ],
  examplesTitle: '给 agent 的示例说法',
  examplesDescription: '把 MCP 接上之后，可以直接用这些句子让客户端去取提示词。',
  examples: [
    {
      title: '斜杠快捷方式',
      commands: ['用 PromptMinder 找出 /code-review，按它的步骤审查这次改动。'],
    },
    {
      title: '自然语言',
      commands: ['帮我在 PromptMinder 里找周报相关提示词。'],
    },
    {
      title: '先选工作区再搜索',
      commands: ['先列出我的 PromptMinder 团队，再在其中搜 tag:sql。'],
    },
  ],
  discoveryTitle: '发现与授权端点',
  discoveryDescription: '兼容 RFC 9728 / RFC 8414 的客户端可以自动发现资源服务器和授权服务器，不必手写 OAuth 细节。',
  troubleshootingTitle: '常见问题排查',
  troubleshootingDescription: '先看客户端里的 Needs login 或 401，再对照下面几类高频问题。',
  troubleshootingItems: [
    {
      title: 'Needs login',
      body: '客户端还没完成 OAuth。点 Login，在浏览器登录 PromptMinder 并批准访问。',
    },
    {
      title: 'HTTP 401',
      body: 'OAuth token 无效或已过期。断开后重新授权。如果用的是 CLI Token，确认 token 仍有效且以 Bearer 发送。',
    },
    {
      title: '搜不到结果',
      body: '先调用 list_teams 确认工作区。不传 team_id 会搜全部可访问空间；个人空间不要传团队 id。试试更短的词或 /标题快捷方式。',
    },
    {
      title: '客户端无法自动注册',
      body: '生产环境要在 Clerk Dashboard → OAuth Applications 启用 CIMD 或 Dynamic Client Registration。',
    },
    {
      title: 'Claude Desktop 不认 url',
      body: '旧版只支持本地 stdio。改用 npx -y mcp-remote <MCP 地址> 做桥接，或升级到支持远程 MCP 的版本。',
    },
  ],
  tokenTitle: '调试用 Token（可选）',
  tokenDescription: 'OAuth 是正式接入方式。本地脚本或不支持 OAuth 的客户端，可以把 CLI Token 放进 Authorization: Bearer。',
  tokenAction: '管理 CLI Tokens',
  clerkTitle: 'Clerk 后台需要打开的开关',
  clerkDescription: '生产环境要在 Clerk Dashboard 的 OAuth Applications 里启用 CIMD 或 Dynamic Client Registration，客户端才能自动完成授权。',
}

const FALLBACK_EN = {
  pageBadge: 'Documentation',
  pageTitle: 'MCP install guide',
  pageStatus: 'oauth',
  pageDescription: 'This page explains what the PromptMinder remote MCP can do and how to add it to Cursor, Claude, ChatGPT, and other AI clients. After one OAuth approval, agents can fetch your prompts with fuzzy queries or slash shortcuts.',
  backAction: 'Back to MCP settings',
  overviewCards: [
    {
      title: 'Features',
      body: 'Read-only lookup: search prompt summaries, load full content by id, and list accessible workspaces. Clients can also call the prompt MCP prompt.',
    },
    {
      title: 'Auth',
      body: 'Clerk OAuth is the supported path. The first connection opens a PromptMinder login screen. Local debugging can send a CLI token as a Bearer credential.',
    },
  ],
  quickstartTitle: 'Quick start',
  quickstartDescription: 'No local npm package is required. Add the public HTTPS URL to a client and complete OAuth once.',
  quickstartSteps: [
    {
      index: '01',
      title: 'Copy the MCP URL',
      description: 'Every client connects to this Streamable HTTP endpoint.',
      code: `${DEFAULT_ORIGIN}/mcp`,
    },
    {
      index: '02',
      title: 'Add it to a client',
      description: 'Write mcp.json in Cursor, run one Claude Code command, or paste the URL into a ChatGPT connector.',
      code: `claude mcp add --transport http promptminder ${DEFAULT_ORIGIN}/mcp`,
    },
    {
      index: '03',
      title: 'Complete OAuth',
      description: 'The client shows Needs login until you approve PromptMinder in the browser.',
      code: 'Open the login prompt in your MCP client, then approve PromptMinder.',
    },
    {
      index: '04',
      title: 'Try a lookup',
      description: 'Ask the agent to fetch a prompt with a slash shortcut or a short phrase.',
      code: '/code-review',
    },
  ],
  clientsTitle: 'Install by client',
  clientsDescription: 'Every config below points at the same remote URL. OAuth-capable clients show Needs login until authorization finishes.',
  cursorTitle: 'Cursor',
  cursorDescription: 'Open Cursor Settings → MCP, add an HTTP server, or write this JSON to ~/.cursor/mcp.json. Save, then click Login.',
  claudeCodeTitle: 'Claude Code',
  claudeCodeDescription: 'Run this command in a terminal. The first tool call opens a browser for authorization.',
  claudeDesktopTitle: 'Claude Desktop',
  claudeDesktopDescription: 'Add the server to Claude Desktop mcpServers. If your build still rejects a remote URL, bridge it with mcp-remote.',
  chatgptTitle: 'ChatGPT',
  chatgptDescription: 'Paste the MCP URL into ChatGPT Connectors / custom connectors, then complete OAuth.',
  vscodeTitle: 'VS Code Copilot',
  vscodeDescription: 'Create .vscode/mcp.json in the workspace, or add an HTTP server in user MCP settings.',
  windsurfTitle: 'Windsurf',
  windsurfDescription: 'Write the config to Windsurf MCP settings (usually mcp_config.json), save, then sign in.',
  otherTitle: 'Other MCP clients',
  otherDescription: 'Any client that supports Streamable HTTP and OAuth can use this server URL.',
  toolsTitle: 'What agents can do now',
  toolsDescription: 'The MVP is read-only lookup. search_prompts returns summaries; full content requires get_prompt. Omit team_id to search every workspace you can access.',
  tools: [
    {
      name: 'search_prompts',
      body: 'Search prompt summaries with natural language, slash shortcuts, tags, or an id. Optional team_id and limit (1–20, default 8).',
    },
    {
      name: 'get_prompt',
      body: 'Load full prompt content from an id returned by search.',
    },
    {
      name: 'list_teams',
      body: 'List personal and team workspaces. Personal workspace uses a null team id.',
    },
  ],
  promptTitle: 'MCP prompt',
  promptDescription: 'The prompt MCP prompt looks up a query. A single high-confidence match returns full content; multiple matches list ids so the client can call get_prompt.',
  shortcutTitle: 'Lookup shortcuts',
  shortcutDescription: 'These work in search_prompts and in clients that expose the /prompt MCP prompt.',
  shortcuts: [
    { example: '/code-review', body: 'Match a title shortcut. Hyphens, underscores, and spaces are equivalent.' },
    { example: 'tag:writing or #sql', body: 'Filter by tag.' },
    { example: 'weekly report helper', body: 'Fuzzy-match title, description, and tags.' },
    { example: 'id:<uuid>', body: 'Fetch one prompt by exact id.' },
    { example: 'team:<uuid>', body: 'Limit this lookup to one team. You can also pass a team_id argument.' },
  ],
  examplesTitle: 'Example prompts for agents',
  examplesDescription: 'After the MCP is connected, these phrases are enough for a client to fetch a prompt.',
  examples: [
    {
      title: 'Slash shortcut',
      commands: ['Use PromptMinder to load /code-review and follow its steps for this change.'],
    },
    {
      title: 'Natural language',
      commands: ['Find my weekly report prompts in PromptMinder.'],
    },
    {
      title: 'Pick a workspace first',
      commands: ['List my PromptMinder teams, then search tag:sql in one of them.'],
    },
  ],
  discoveryTitle: 'Discovery endpoints',
  discoveryDescription: 'Clients that implement RFC 9728 and RFC 8414 can discover the resource and authorization servers without hard-coding OAuth details.',
  troubleshootingTitle: 'Troubleshooting',
  troubleshootingDescription: 'Start with Needs login or HTTP 401 in the client, then map it to one of these common cases.',
  troubleshootingItems: [
    {
      title: 'Needs login',
      body: 'OAuth is not finished. Click Login and approve PromptMinder in the browser.',
    },
    {
      title: 'HTTP 401',
      body: 'The OAuth token is invalid or expired. Disconnect and authorize again. For a CLI token, confirm it is still active and sent as Bearer.',
    },
    {
      title: 'No matches',
      body: 'Call list_teams first. Omitting team_id searches every accessible workspace; do not pass a team id for personal scope. Try a shorter phrase or a /title shortcut.',
    },
    {
      title: 'Client cannot register',
      body: 'In production, enable CIMD or Dynamic Client Registration under Clerk Dashboard → OAuth Applications.',
    },
    {
      title: 'Claude Desktop rejects url',
      body: 'Older builds only support local stdio. Bridge with npx -y mcp-remote <MCP URL>, or upgrade to a build that supports remote MCP.',
    },
  ],
  tokenTitle: 'Optional debug token',
  tokenDescription: 'OAuth is the supported login path. Local scripts or clients without OAuth can send a CLI token as Authorization: Bearer.',
  tokenAction: 'Manage CLI Tokens',
  clerkTitle: 'Clerk dashboard switch',
  clerkDescription: 'In production, enable CIMD or Dynamic Client Registration under Clerk Dashboard → OAuth Applications so clients can authorize themselves.',
}

function CopyButton({ text, label, copiedLabel, className }) {
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
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? copiedLabel : label}
    </button>
  )
}

function CommandBlock({ title, description, commands, copyLabel, copiedLabel }) {
  const text = useMemo(() => commands.join('\n'), [commands])

  return (
    <div className="border border-black">
      <div className="flex items-start justify-between gap-4 border-b border-black px-5 py-4">
        <div className="space-y-1">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{title}</h3>
          {description && <p className="max-w-2xl text-sm leading-relaxed text-black/60">{description}</p>}
        </div>
        <CopyButton text={text} label={copyLabel} copiedLabel={copiedLabel} />
      </div>
      <div className={cn('px-5 py-4', CODE_SURFACE_CLASSNAME)}>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-[#f8fafc]">
          <code className="text-inherit">{text}</code>
        </pre>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-black/35" />
        <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.24em] text-black">{title}</h2>
      </div>
      {description && <p className="max-w-3xl text-sm leading-relaxed text-black/58">{description}</p>}
    </div>
  )
}

function prettyJson(value) {
  return JSON.stringify(value, null, 2)
}

export default function McpDocsPage() {
  const { language, t } = useLanguage()
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN)
  const fallback = language === 'en' ? FALLBACK_EN : FALLBACK_ZH
  const translations = {
    ...fallback,
    ...(t?.mcp?.docs || {}),
    overviewCards: t?.mcp?.docs?.overviewCards || fallback.overviewCards,
    quickstartSteps: t?.mcp?.docs?.quickstartSteps || fallback.quickstartSteps,
    tools: t?.mcp?.docs?.tools || fallback.tools,
    shortcuts: t?.mcp?.docs?.shortcuts || fallback.shortcuts,
    examples: t?.mcp?.docs?.examples || fallback.examples,
    troubleshootingItems: t?.mcp?.docs?.troubleshootingItems || fallback.troubleshootingItems,
  }
  const commonTranslations = {
    ...(language === 'en' ? { copy: 'Copy', copied: 'Copied' } : { copy: '复制', copied: '已复制' }),
    ...(t?.common || {}),
  }

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const mcpUrl = `${origin}/mcp`
  const cursorConfig = useMemo(() => prettyJson({
    mcpServers: {
      promptminder: {
        url: mcpUrl,
      },
    },
  }), [mcpUrl])
  const vscodeConfig = useMemo(() => prettyJson({
    servers: {
      promptminder: {
        type: 'http',
        url: mcpUrl,
      },
    },
  }), [mcpUrl])
  const claudeDesktopRemote = useMemo(() => prettyJson({
    mcpServers: {
      promptminder: {
        command: 'npx',
        args: ['-y', 'mcp-remote', mcpUrl],
      },
    },
  }), [mcpUrl])
  const tokenConfig = useMemo(() => prettyJson({
    mcpServers: {
      promptminder: {
        url: mcpUrl,
        headers: {
          Authorization: 'Bearer pm_xxx',
        },
      },
    },
  }), [mcpUrl])
  const claudeCommand = `claude mcp add --transport http promptminder ${mcpUrl}`
  const discoveryEndpoints = [
    mcpUrl,
    `${origin}/.well-known/oauth-protected-resource/mcp`,
    `${origin}/.well-known/oauth-authorization-server`,
  ]
  const quickstartSteps = translations.quickstartSteps.map((step) => {
    if (step.index === '01') {
      return { ...step, code: mcpUrl }
    }
    if (step.index === '02') {
      return { ...step, code: claudeCommand }
    }
    return step
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/settings/mcp"
              className="inline-flex items-center gap-2 border border-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" />
              {translations.backAction}
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpenText className="h-4 w-4 text-black/35" />
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

          <section className="border border-black">
            <div className="grid gap-px bg-black md:grid-cols-2">
              {translations.overviewCards.map((card) => (
                <div key={card.title} className="space-y-2 bg-white px-5 py-5">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-black/50">{card.title}</p>
                  <p className="text-sm leading-relaxed text-black/72">{card.body}</p>
                </div>
              ))}
            </div>
          </section>
        </header>

        <section className="space-y-4">
          <SectionTitle
            icon={TerminalSquare}
            title={translations.quickstartTitle}
            description={translations.quickstartDescription}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {quickstartSteps.map((step) => (
              <div key={step.index} className="border border-black p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <span className="font-mono text-3xl font-bold leading-none text-black/10">{step.index}</span>
                  <CopyButton text={step.code} label={commonTranslations.copy} copiedLabel={commonTranslations.copied} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-black/58">{step.description}</p>
                  <div className={cn('px-4 py-3', CODE_SURFACE_CLASSNAME)}>
                    <code className="block overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-[#f8fafc]">{step.code}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={Plug}
            title={translations.clientsTitle}
            description={translations.clientsDescription}
          />
          <div className="space-y-4">
            <CommandBlock
              title={translations.cursorTitle}
              description={translations.cursorDescription}
              commands={[cursorConfig]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.claudeCodeTitle}
              description={translations.claudeCodeDescription}
              commands={[claudeCommand]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.claudeDesktopTitle}
              description={translations.claudeDesktopDescription}
              commands={[claudeDesktopRemote]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.chatgptTitle}
              description={translations.chatgptDescription}
              commands={[mcpUrl]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.vscodeTitle}
              description={translations.vscodeDescription}
              commands={[vscodeConfig]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.windsurfTitle}
              description={translations.windsurfDescription}
              commands={[cursorConfig]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
            <CommandBlock
              title={translations.otherTitle}
              description={translations.otherDescription}
              commands={[mcpUrl]}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={Wand2}
            title={translations.toolsTitle}
            description={translations.toolsDescription}
          />
          <div className="grid gap-px bg-black md:grid-cols-3">
            {translations.tools.map((tool) => (
              <div key={tool.name} className="space-y-2 bg-white px-5 py-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-black/50">{tool.name}</p>
                <p className="text-sm leading-relaxed text-black/72">{tool.body}</p>
              </div>
            ))}
          </div>
          <div className="border border-black p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.promptTitle}</p>
            <p className="mt-2 text-sm leading-relaxed text-black/58">{translations.promptDescription}</p>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={Wrench}
            title={translations.shortcutTitle}
            description={translations.shortcutDescription}
          />
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
          <SectionTitle
            icon={Bot}
            title={translations.examplesTitle}
            description={translations.examplesDescription}
          />
          <div className="space-y-4">
            {translations.examples.map((example) => (
              <CommandBlock
                key={example.title}
                title={example.title}
                commands={example.commands}
                copyLabel={commonTranslations.copy}
                copiedLabel={commonTranslations.copied}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={ShieldCheck}
            title={translations.discoveryTitle}
            description={translations.discoveryDescription}
          />
          <CommandBlock
            title={translations.discoveryTitle}
            commands={discoveryEndpoints}
            copyLabel={commonTranslations.copy}
            copiedLabel={commonTranslations.copied}
          />
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={AlertTriangle}
            title={translations.troubleshootingTitle}
            description={translations.troubleshootingDescription}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {translations.troubleshootingItems.map((item) => (
              <div key={item.title} className="border border-black p-5">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/58">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

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
      </div>
    </div>
  )
}
