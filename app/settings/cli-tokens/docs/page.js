'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenText,
  Bot,
  Check,
  Copy,
  ExternalLink,
  TerminalSquare,
  Wrench,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const CODE_SURFACE_CLASSNAME = 'border-t border-white/10 bg-[#101216] text-[#f8fafc] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'

const FALLBACK_ZH = {
  pageBadge: '文档',
  pageTitle: 'CLI 与 Skills 使用说明',
  pageStatus: 'reference',
  pageDescription: '这页集中说明 PromptMinder CLI、promptminder-agent 和独立 skill 的推荐安装方式，适合本地调试、自动化脚本和 AI agent 接入时直接查阅。',
  backAction: '返回 Tokens',
  repoAction: '独立 Skill 仓库',
  overviewCards: [
    {
      title: 'CLI',
      body: 'JSON stdout/stderr 约定、token 认证、team 作用域，以及 prompt / tag 的日常操作。',
    },
    {
      title: 'Skills',
      body: '面向 Cursor、Claude Code、Codex CLI 等 agent 运行环境的独立 skill 安装方式。',
    },
  ],
  quickstartTitle: '快速开始',
  quickstartDescription: '需要 Node.js ≥ 20。安装 CLI 后，环境变量与本地登录任选一种，再验证连接。',
  quickstartSteps: [
    {
      index: '01',
      title: '安装 CLI',
      description: '全局安装 PromptMinder CLI。公开版本为 0.1.3；工作区 Skill 命令属于尚未发布的 0.2.0。',
      code: 'npm i -g @aircrushin/promptminder-cli',
    },
    {
      index: '02',
      title: '认证方式一：环境变量',
      description: '在 Tokens 页面创建 token，明文只显示一次。脚本和 AI agent 推荐设置环境变量；使用此方式后无需本地登录。',
      code: 'export PROMPTMINDER_TOKEN=pm_xxx',
    },
    {
      index: '03',
      title: '认证方式二：本地登录（可选）',
      description: '个人机器也可将 token 保存到 ~/.promptminder/config.json。优先级为 --token → PROMPTMINDER_TOKEN → 本地配置；旧环境变量会覆盖新保存的 token。',
      code: 'promptminder auth login --token pm_xxx',
    },
    {
      index: '04',
      title: '验证连接',
      description: '查询可访问的团队以验证 token；后续操作使用 --team 指定目标团队。',
      code: 'promptminder team list',
    },
  ],
  cliReferenceTitle: 'CLI 常用命令',
  cliReferenceDescription: 'API 成功响应走 stdout JSON，错误走 stderr JSON。下方单独标注尚未发布的 0.2.0 工作区 Skill 命令。',
  cliGroups: [
    {
      title: '安装与更新',
      description: '需要 Node.js ≥ 20。查看已安装版本，或更新到 npm 最新公开版本（当前为 0.1.3）。',
      commands: [
        'node --version',
        'npm list -g @aircrushin/promptminder-cli --depth=0',
        'npm i -g @aircrushin/promptminder-cli@latest',
      ],
    },
    {
      title: '认证与团队',
      description: '个人空间默认不传 `--team`；非个人 workspace 才显式带 team id。',
      commands: [
        'promptminder auth login --token <token>',
        'promptminder auth logout',
        'promptminder team list',
        'promptminder prompt list --team team-uuid-xyz',
      ],
    },
    {
      title: 'Prompt 操作',
      description: '内容输入只能三选一：`--content`、`--content-file` 或 `--stdin`。',
      commands: [
        'promptminder prompt list --tag writing --search assistant --page 1 --limit 20',
        'promptminder prompt get prompt-id --team team-uuid-xyz',
        'promptminder prompt create --title "SQL helper" --content "Write clean SQL" --tags sql,assistant',
        'promptminder prompt update prompt-id --title "SQL helper v2" --content "Write careful SQL"',
        'promptminder prompt delete prompt-id --yes',
      ],
    },
    {
      title: '工作区 Skill（0.2.0，尚未发布）',
      description: '以下命令仅在仓库 0.2.0 中实现，npm 0.1.3 不支持。单数 skill 管理工作区技能包，复数 skills 管理内置 CLI 使用指南。不传 --team 使用个人空间；安装默认写入当前项目 .cursor/skills，不覆盖现有目录。ID 指向保存的版本快照，--version 可选择同一版本链中的标签；启用团队审批时须审批通过后才能安装。技能包需要含 name、description 的 SKILL.md，最多 200 个文件、总计 2 MB。',
      commands: [
        'promptminder skill list --team <team-id> --search review',
        'promptminder skill import ./review-skill --team <team-id> --version 1.0.0',
        'promptminder skill get <prompt-id> --team <team-id>',
        'promptminder skill update <prompt-id> ./review-skill --team <team-id> --version 1.0.1',
        'promptminder skill install <prompt-id> --team <team-id> --target codex',
        'promptminder skill install <prompt-id> --team <team-id> --version 1.0.1 --out-dir ./reviewed-skills',
        'promptminder-agent skill.list --input \'{"team":"<team-id>"}\'',
        'promptminder-agent skill.get --input \'{"id":"<prompt-id>","team":"<team-id>"}\'',
        'promptminder-agent skill.import --input \'{"directory":"./review-skill","team":"<team-id>"}\'',
        'promptminder-agent skill.update --input \'{"id":"<prompt-id>","directory":"./review-skill","version":"1.0.1","team":"<team-id>"}\'',
        'promptminder-agent skill.install --input \'{"id":"<prompt-id>","team":"<team-id>","out-dir":"./reviewed-skills"}\'',
      ],
    },
    {
      title: 'Tag 操作',
      description: '标签命令也支持 `--team`，并可以决定是否包含公共标签。',
      commands: [
        'promptminder tag list --include-public true',
        'promptminder tag create --name growth',
        'promptminder tag update tag-id --name lifecycle',
        'promptminder tag delete tag-id --yes',
      ],
    },
  ],
  agentTitle: 'Agent Wrapper',
  agentDescription: '`promptminder-agent` 适合脚本和 AI agent pipeline。动作使用 dot notation，输入统一走一个 JSON 对象。',
  agentRulesTitle: '关键规则',
  agentRules: [
    '动作名必须写成 `prompt.list`、`prompt.get` 这种点号形式，不是空格子命令。',
    '传参优先用 `--input`，内容是单个 JSON 对象；复杂场景也可以用 `--stdin` 读 JSON。',
    '非个人团队空间用 `team` 字段或 CLI 的 `--team` 明确指定作用域。',
  ],
  agentExamplesTitle: 'Agent 示例',
  agentExamples: [
    {
      title: '列出 prompts',
      commands: ['promptminder-agent prompt.list'],
    },
    {
      title: '获取指定 prompt',
      commands: ['promptminder-agent prompt.get --input \'{"id":"prompt-id"}\''],
    },
    {
      title: '在团队空间创建 prompt',
      commands: ['promptminder-agent prompt.create --input \'{"title":"SQL helper","content":"Write clean SQL","team":"team-uuid"}\''],
    },
    {
      title: '从文件流读取 JSON',
      commands: ['cat payload.json | promptminder-agent prompt.create --stdin'],
    },
  ],
  skillsTitle: 'Skills 安装',
  skillsDescription: '如果你希望 Cursor、Claude Code、Codex CLI 之类的 agent 正确理解 PromptMinder CLI 的认证、team 作用域和 JSON 输入输出，优先安装独立 skill 仓库。',
  skillsHighlightTitle: '推荐路径',
  skillsHighlightBody: '官方推荐安装 `aircrushin/promptminder-cli-skill`。这个仓库是对外分发的主路径，比 CLI 内置兼容安装更适合新接入场景。',
  skillsInstallBlocks: [
    {
      title: '安装独立 skill',
      description: '先装 CLI，再把 skill 加入本地 skills 索引。',
      commands: [
        'npm i -g @aircrushin/promptminder-cli',
        'npx skills add aircrushin/promptminder-cli-skill',
      ],
    },
    {
      title: '验证安装',
      description: '用 list 查看已安装的 skill；find 只搜索可发现的 skill，不能验证本地安装。',
      commands: ['npx skills list'],
    },
  ],
  compatibilityTitle: '兼容安装路径',
  compatibilityDescription: 'CLI 仍保留 bundled skill 安装命令，但现在它主要用于兼容旧方式，不再是推荐入口。',
  compatibilityNoteTitle: '兼容说明',
  compatibilityNoteBody: '如果你的环境已经依赖 CLI 内置 skills，可以继续使用这些命令；新接入优先走独立 GitHub skill 仓库。',
  compatibilityCommands: [
    'promptminder skills install',
    'promptminder skills install --target codex',
    'promptminder skills list',
    'promptminder skills path',
  ],
  troubleshootingTitle: '常见问题排查',
  troubleshootingDescription: '先看 stderr 里的 JSON 错误消息，再对照下面几类高频问题。',
  troubleshootingItems: [
    {
      title: 'Missing token',
      body: '没有找到 `--token`、`PROMPTMINDER_TOKEN` 或本地保存的认证配置。先设置环境变量，或重新执行 `promptminder auth login --token <token>`。',
    },
    {
      title: 'HTTP 401',
      body: 'token 无效、过期或已删除。重新创建后更新正在使用的认证来源；旧 PROMPTMINDER_TOKEN 会覆盖本地登录，auth logout 也不会清除环境变量。',
    },
    {
      title: '团队作用域错误',
      body: '访问非个人 workspace 时要传 `--team <uuid>`。参数名固定是 `--team`，不是 `--team-id`。',
    },
    {
      title: 'Agent 命令格式错误',
      body: '`promptminder-agent prompt list` 会失败，必须写成 `promptminder-agent prompt.list`。如果需要参数，放进 `--input` 的 JSON 对象里。',
    },
    {
      title: '内容来源冲突',
      body: '创建或更新 prompt 时，`--content`、`--content-file`、`--stdin` 只能保留一个，否则 CLI 会直接报错。',
    },
  ],
}

const FALLBACK_EN = {
  pageBadge: 'Documentation',
  pageTitle: 'CLI + Skills guide',
  pageStatus: 'reference',
  pageDescription: 'This page collects the recommended setup for PromptMinder CLI, `promptminder-agent`, and the standalone skill repository so local scripts and AI agents can integrate without guesswork.',
  backAction: 'Back to tokens',
  repoAction: 'Standalone skill repo',
  overviewCards: [
    {
      title: 'CLI',
      body: 'JSON stdout/stderr conventions, token auth, team scoping, and prompt or tag operations.',
    },
    {
      title: 'Skills',
      body: 'Standalone skill installation for Cursor, Claude Code, Codex CLI, and similar agent runtimes.',
    },
  ],
  quickstartTitle: 'Quick start',
  quickstartDescription: 'Requires Node.js ≥ 20. Install the CLI, choose either an environment variable or local login, then verify connectivity.',
  quickstartSteps: [
    {
      index: '01',
      title: 'Install the CLI',
      description: 'Install the global package. The public version is 0.1.3; workspace Skill commands belong to unreleased 0.2.0.',
      code: 'npm i -g @aircrushin/promptminder-cli',
    },
    {
      index: '02',
      title: 'Auth option 1: Environment variable',
      description: 'Create a token on the Tokens page; its plain text is shown once. Scripts and AI agents should use an environment variable. Local login is then unnecessary.',
      code: 'export PROMPTMINDER_TOKEN=pm_xxx',
    },
    {
      index: '03',
      title: 'Auth option 2: Local login (optional)',
      description: 'On a personal machine, save the token to ~/.promptminder/config.json instead. Precedence: --token → PROMPTMINDER_TOKEN → saved config. An old environment token overrides a newly saved token.',
      code: 'promptminder auth login --token pm_xxx',
    },
    {
      index: '04',
      title: 'Verify connectivity',
      description: 'List accessible teams to verify the token, then pass --team when targeting a team workspace.',
      code: 'promptminder team list',
    },
  ],
  cliReferenceTitle: 'CLI quick reference',
  cliReferenceDescription: 'API success responses go to stdout as JSON; errors go to stderr as JSON. Unreleased 0.2.0 workspace Skill commands are labeled separately below.',
  cliGroups: [
    {
      title: 'Install and update',
      description: 'Requires Node.js ≥ 20. Check the installed version or update to the latest public npm version (currently 0.1.3).',
      commands: [
        'node --version',
        'npm list -g @aircrushin/promptminder-cli --depth=0',
        'npm i -g @aircrushin/promptminder-cli@latest',
      ],
    },
    {
      title: 'Auth and teams',
      description: 'Personal workspace calls omit `--team`; non-personal workspaces should pass an explicit team id.',
      commands: [
        'promptminder auth login --token <token>',
        'promptminder auth logout',
        'promptminder team list',
        'promptminder prompt list --team team-uuid-xyz',
      ],
    },
    {
      title: 'Prompt operations',
      description: 'Content input is mutually exclusive: use exactly one of `--content`, `--content-file`, or `--stdin`.',
      commands: [
        'promptminder prompt list --tag writing --search assistant --page 1 --limit 20',
        'promptminder prompt get prompt-id --team team-uuid-xyz',
        'promptminder prompt create --title "SQL helper" --content "Write clean SQL" --tags sql,assistant',
        'promptminder prompt update prompt-id --title "SQL helper v2" --content "Write careful SQL"',
        'promptminder prompt delete prompt-id --yes',
      ],
    },
    {
      title: 'Workspace Skills (0.2.0, unreleased)',
      description: 'These commands exist in repository version 0.2.0 and are unavailable in npm 0.1.3. Singular skill manages workspace packages; plural skills manages bundled CLI instructions. Omit --team for personal scope. Installation defaults to project .cursor/skills and never overwrites an existing directory. IDs identify saved snapshots; --version selects a label in the same lineage. Team approval must complete before a proposal can be installed. Packages require SKILL.md with name and description, at most 200 files and 2 MB total.',
      commands: [
        'promptminder skill list --team <team-id> --search review',
        'promptminder skill import ./review-skill --team <team-id> --version 1.0.0',
        'promptminder skill get <prompt-id> --team <team-id>',
        'promptminder skill update <prompt-id> ./review-skill --team <team-id> --version 1.0.1',
        'promptminder skill install <prompt-id> --team <team-id> --target codex',
        'promptminder skill install <prompt-id> --team <team-id> --version 1.0.1 --out-dir ./reviewed-skills',
        'promptminder-agent skill.list --input \'{"team":"<team-id>"}\'',
        'promptminder-agent skill.get --input \'{"id":"<prompt-id>","team":"<team-id>"}\'',
        'promptminder-agent skill.import --input \'{"directory":"./review-skill","team":"<team-id>"}\'',
        'promptminder-agent skill.update --input \'{"id":"<prompt-id>","directory":"./review-skill","version":"1.0.1","team":"<team-id>"}\'',
        'promptminder-agent skill.install --input \'{"id":"<prompt-id>","team":"<team-id>","out-dir":"./reviewed-skills"}\'',
      ],
    },
    {
      title: 'Tag operations',
      description: 'Tag commands also support `--team` and optional public tag inclusion.',
      commands: [
        'promptminder tag list --include-public true',
        'promptminder tag create --name growth',
        'promptminder tag update tag-id --name lifecycle',
        'promptminder tag delete tag-id --yes',
      ],
    },
  ],
  agentTitle: 'Agent wrapper',
  agentDescription: '`promptminder-agent` is the better fit for scripts and AI agent pipelines. Actions use dot notation and inputs are passed as a single JSON object.',
  agentRulesTitle: 'Key rules',
  agentRules: [
    'Write actions as `prompt.list` or `prompt.get`, never as space-separated subcommands.',
    'Use `--input` for a single JSON payload, or `--stdin` when you want to pipe JSON from another process.',
    'For non-personal workspaces, include a `team` field or pass `--team` explicitly so scope is unambiguous.',
  ],
  agentExamplesTitle: 'Agent examples',
  agentExamples: [
    {
      title: 'List prompts',
      commands: ['promptminder-agent prompt.list'],
    },
    {
      title: 'Fetch one prompt',
      commands: ['promptminder-agent prompt.get --input \'{"id":"prompt-id"}\''],
    },
    {
      title: 'Create a prompt in a team workspace',
      commands: ['promptminder-agent prompt.create --input \'{"title":"SQL helper","content":"Write clean SQL","team":"team-uuid"}\''],
    },
    {
      title: 'Pipe JSON from a file',
      commands: ['cat payload.json | promptminder-agent prompt.create --stdin'],
    },
  ],
  skillsTitle: 'Skills install',
  skillsDescription: 'If you want Cursor, Claude Code, Codex CLI, and similar agents to use PromptMinder CLI correctly, install the standalone skill repository first.',
  skillsHighlightTitle: 'Recommended path',
  skillsHighlightBody: 'The recommended install target is `aircrushin/promptminder-cli-skill`. That repository is the public distribution path and the best default for new integrations.',
  skillsInstallBlocks: [
    {
      title: 'Install the standalone skill',
      description: 'Install the CLI first, then add the skill into the local skills index.',
      commands: [
        'npm i -g @aircrushin/promptminder-cli',
        'npx skills add aircrushin/promptminder-cli-skill',
      ],
    },
    {
      title: 'Verify installation',
      description: 'Use list to inspect installed skills. find searches discoverable skills and does not verify local installation.',
      commands: ['npx skills list'],
    },
  ],
  compatibilityTitle: 'Compatibility path',
  compatibilityDescription: 'The CLI still ships bundled skill installation commands, but they are now a compatibility path rather than the primary recommendation.',
  compatibilityNoteTitle: 'Compatibility note',
  compatibilityNoteBody: 'Keep using these commands if an older setup already depends on bundled skills. For new setups, prefer the standalone GitHub skill repository.',
  compatibilityCommands: [
    'promptminder skills install',
    'promptminder skills install --target codex',
    'promptminder skills list',
    'promptminder skills path',
  ],
  troubleshootingTitle: 'Troubleshooting',
  troubleshootingDescription: 'Read the stderr JSON first, then map it to one of these common failure modes.',
  troubleshootingItems: [
    {
      title: 'Missing token',
      body: 'No `--token`, `PROMPTMINDER_TOKEN`, or saved auth config was found. Export the env var or run `promptminder auth login --token <token>` again.',
    },
    {
      title: 'HTTP 401',
      body: 'The token is invalid, expired, or revoked. Update the active auth source. An old PROMPTMINDER_TOKEN overrides saved login; auth logout does not clear the environment variable.',
    },
    {
      title: 'Wrong workspace scope',
      body: 'Use `--team <uuid>` for non-personal workspaces. The flag is always `--team`, never `--team-id`.',
    },
    {
      title: 'Wrong agent syntax',
      body: '`promptminder-agent prompt list` fails. Use `promptminder-agent prompt.list` and move arguments into the JSON payload passed to `--input`.',
    },
    {
      title: 'Conflicting content sources',
      body: 'For prompt create or update, keep only one of `--content`, `--content-file`, or `--stdin`.',
    },
  ],
}

const FALLBACK_COMMON = {
  copy: '复制',
  copied: '已复制',
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
        className
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

export default function CliTokensDocsPage() {
  const { language, t } = useLanguage()
  const fallback = language === 'en' ? FALLBACK_EN : FALLBACK_ZH
  const translations = {
    ...fallback,
    ...(t?.cliTokens?.docs || {}),
    overviewCards: t?.cliTokens?.docs?.overviewCards || fallback.overviewCards,
    quickstartSteps: t?.cliTokens?.docs?.quickstartSteps || fallback.quickstartSteps,
    cliGroups: t?.cliTokens?.docs?.cliGroups || fallback.cliGroups,
    agentRules: t?.cliTokens?.docs?.agentRules || fallback.agentRules,
    agentExamples: t?.cliTokens?.docs?.agentExamples || fallback.agentExamples,
    skillsInstallBlocks: t?.cliTokens?.docs?.skillsInstallBlocks || fallback.skillsInstallBlocks,
    compatibilityCommands: t?.cliTokens?.docs?.compatibilityCommands || fallback.compatibilityCommands,
    troubleshootingItems: t?.cliTokens?.docs?.troubleshootingItems || fallback.troubleshootingItems,
  }
  const commonTranslations = {
    ...(language === 'en' ? { copy: 'Copy', copied: 'Copied' } : FALLBACK_COMMON),
    ...(t?.common || {}),
  }

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
            <Link
              href="https://github.com/aircrushin/promptminder-cli-skill"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-black px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              {translations.repoAction}
              <ExternalLink className="h-3 w-3" />
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
            {translations.quickstartSteps.map((step) => (
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
            icon={Wrench}
            title={translations.cliReferenceTitle}
            description={translations.cliReferenceDescription}
          />
          <div className="space-y-4">
            {translations.cliGroups.map((group) => (
              <CommandBlock
                key={group.title}
                title={group.title}
                description={group.description}
                commands={group.commands}
                copyLabel={commonTranslations.copy}
                copiedLabel={commonTranslations.copied}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={Bot}
            title={translations.agentTitle}
            description={translations.agentDescription}
          />
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border border-black p-5">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-black/35" />
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.agentRulesTitle}</p>
              </div>
              <ul className="space-y-3">
                {translations.agentRules.map((rule) => (
                  <li key={rule} className="border-l border-black pl-3 text-sm leading-relaxed text-black/62">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              {translations.agentExamples.map((example) => (
                <CommandBlock
                  key={example.title}
                  title={example.title}
                  commands={example.commands}
                  copyLabel={commonTranslations.copy}
                  copiedLabel={commonTranslations.copied}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={BookOpenText}
            title={translations.skillsTitle}
            description={translations.skillsDescription}
          />
          <div className="border border-black">
            <div className="border-b border-black bg-black px-5 py-4 text-white">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em]">{translations.skillsHighlightTitle}</p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/70">{translations.skillsHighlightBody}</p>
            </div>
            <div className="space-y-4 px-5 py-5">
              {translations.skillsInstallBlocks.map((block) => (
                <CommandBlock
                  key={block.title}
                  title={block.title}
                  description={block.description}
                  commands={block.commands}
                  copyLabel={commonTranslations.copy}
                  copiedLabel={commonTranslations.copied}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            icon={AlertTriangle}
            title={translations.compatibilityTitle}
            description={translations.compatibilityDescription}
          />
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border border-black p-5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-black">{translations.compatibilityNoteTitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/58">{translations.compatibilityNoteBody}</p>
            </div>
            <CommandBlock
              title={translations.compatibilityTitle}
              commands={translations.compatibilityCommands}
              copyLabel={commonTranslations.copy}
              copiedLabel={commonTranslations.copied}
            />
          </div>
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
      </div>
    </div>
  )
}
