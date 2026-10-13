'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useClipboard } from '@/lib/clipboard'
import { buildSkillInstallMethods } from '@/lib/skills-sync'
import { cn } from '@/lib/utils'

export function SkillInstallMethods({ skill }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [mode, setMode] = useState('command')
  const { copy, copied } = useClipboard(
    zh ? '已复制到剪贴板' : 'Copied to clipboard',
    zh ? '复制失败' : 'Copy failed'
  )

  const methods = useMemo(
    () => buildSkillInstallMethods({
      slug: skill.slug,
      source: skill.source,
      sourceType: skill.sourceType,
      installUrl: skill.installUrl,
    }),
    [skill.installUrl, skill.slug, skill.source, skill.sourceType]
  )

  if (!methods) return null

  const value = mode === 'prompt' ? methods.prompt : methods.command

  return (
    <div className="border border-slate-200 bg-white dark:border-border dark:bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-border">
        <div>
          <p className="text-sm font-medium text-slate-950 dark:text-foreground">{zh ? '安装' : 'Installation'}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
            {zh ? '与 skills.sh 相同的 Command / Prompt 安装方式' : 'Same Command / Prompt install methods as skills.sh'}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-border" role="group" aria-label={zh ? '安装格式' : 'Install format'}>
          <button
            type="button"
            aria-pressed={mode === 'command'}
            onClick={() => setMode('command')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition',
              mode === 'command' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950 dark:text-muted-foreground dark:hover:text-foreground'
            )}
          >
            Command
          </button>
          <button
            type="button"
            aria-pressed={mode === 'prompt'}
            onClick={() => setMode('prompt')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition',
              mode === 'prompt' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950 dark:text-muted-foreground dark:hover:text-foreground'
            )}
          >
            Prompt
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => copy(value)}
        className="group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-950 dark:hover:bg-muted dark:focus:ring-ring"
        aria-label={zh ? '复制安装内容' : 'Copy install content'}
      >
        <code className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-xs leading-5 text-slate-800 dark:text-foreground">
          {mode === 'command' ? `$ ${value}` : value}
        </code>
        <span className="mt-0.5 shrink-0 text-slate-400 group-hover:text-slate-700 dark:text-muted-foreground dark:group-hover:text-foreground">
          {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> : <Copy className="h-4 w-4" />}
        </span>
      </button>
    </div>
  )
}
