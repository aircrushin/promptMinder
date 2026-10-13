'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { AddSkillButton } from '@/components/skill/AddSkillButton'
import { SkillInstallMethods } from '@/components/skill/SkillInstallMethods'
import { CatalogSkillExportButton } from '@/components/skill/ExportSkillButton'
import { canRedistributeSkill } from '@/lib/skills-sync'

export function SkillDetail({ skill }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const supportingFiles = (skill.files || []).filter((file) => file.path !== 'SKILL.md')

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-muted/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/skills" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950 dark:text-muted-foreground dark:hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {zh ? '返回 Skills' : 'Back to Skills'}
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main className="min-w-0">
            <div className="border-b border-slate-200 pb-8 dark:border-border">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-muted-foreground">
                <span>{skill.source}</span>
                {skill.licenseSpdx && <span>· {skill.licenseSpdx}</span>}
                {skill.content && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <ShieldCheck className="h-3 w-3" /> {zh ? '内容可用' : 'Content available'}
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-foreground">{skill.name}</h1>
              {skill.description && <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-muted-foreground">{skill.description}</p>}
            </div>

            <div className="mt-8 flex flex-col gap-6">
              <SkillInstallMethods skill={skill} />

              {skill.content ? (
                <article className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-slate-950 dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.content}</ReactMarkdown>
                </article>
              ) : (
                <div className="border border-slate-200 bg-white p-8 dark:border-border dark:bg-card">
                  <h2 className="font-semibold text-slate-950 dark:text-foreground">{zh ? '完整内容未托管' : 'Full content is not hosted'}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                    {zh
                      ? '该来源的许可证或安全状态尚不满足同步条件，请前往原始来源查看。'
                      : 'This source does not yet meet the license or security requirements for content sync. View it at the original source.'}
                  </p>
                </div>
              )}
            </div>

            {supportingFiles.length > 0 && (
              <section className="mt-12 border-t border-slate-200 pt-8 dark:border-border">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-foreground">{zh ? '附带文件' : 'Supporting files'}</h2>
                <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-border dark:border-border">
                  {supportingFiles.map((file) => (
                    <details key={file.path} className="group py-4">
                      <summary className="cursor-pointer list-none text-sm font-medium text-slate-700 group-open:text-slate-950 dark:text-foreground dark:group-open:text-foreground">
                        {file.path}
                      </summary>
                      <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-100 dark:text-muted-foreground">
                        <code>{file.contents}</code>
                      </pre>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="h-fit border border-slate-200 bg-white p-5 lg:sticky lg:top-24 dark:border-border dark:bg-card">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500 dark:text-muted-foreground">{zh ? '安装量' : 'Installs'}</dt>
                <dd className="mt-1 font-medium text-slate-950 dark:text-foreground">{skill.installs.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-muted-foreground">{zh ? '最近同步' : 'Last synced'}</dt>
                <dd className="mt-1 font-medium text-slate-950 dark:text-foreground">{new Date(skill.syncedAt).toLocaleDateString()}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              {skill.content && canRedistributeSkill(skill) && <CatalogSkillExportButton skill={skill} />}
              {skill.content && <AddSkillButton skill={{ id: skill.id, name: skill.name, source: skill.source, content: skill.content }} />}
              <a
                href={skill.skillsShUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:border-slate-950 hover:text-slate-950 dark:border-border dark:text-foreground dark:hover:border-border dark:hover:text-foreground"
              >
                skills.sh <ExternalLink className="h-4 w-4" />
              </a>
              {skill.installUrl && (
                <a href={skill.installUrl} target="_blank" rel="noopener noreferrer" className="text-center text-xs text-slate-500 hover:text-slate-950 dark:text-muted-foreground dark:hover:text-foreground">
                  {zh ? '查看原始仓库' : 'View source repository'}
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
