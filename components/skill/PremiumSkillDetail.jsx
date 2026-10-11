'use client'

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PremiumWaitlistForm } from '@/components/skill/PremiumWaitlistForm'
import { PREMIUM_COLLECTION } from '@/lib/premium-skills-data'

export function PremiumSkillDetail({ skill }) {
  const { language } = useLanguage()
  const zh = language === 'zh'

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/skills#premium" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> {zh ? '返回 Premium Collection' : 'Back to Premium Collection'}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <main className="min-w-0">
            <div className="border-b border-slate-300 pb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{PREMIUM_COLLECTION.eyebrow}</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{zh ? skill.zhName : skill.name}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{skill.description}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                <LockKeyhole className="h-4 w-4" /> {skill.signal}
              </p>
            </div>

            <article className="prose prose-slate mt-8 max-w-none prose-headings:scroll-mt-20 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-slate-950">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{skill.content}</ReactMarkdown>
            </article>
          </main>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="border border-slate-300 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{zh ? '首发候补' : 'Launch list'}</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">{skill.outcome}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {zh ? '先看完整方法，再决定是否加入。现在提交不会扣款。' : 'Read the full method first. Joining today does not charge you.'}
              </p>
              <div className="mt-5 text-sm font-medium text-slate-950">{PREMIUM_COLLECTION.priceAnchor}</div>
            </div>
            <div className="mt-4">
              <PremiumWaitlistForm defaultSkillSlug={skill.slug} source={`/skills/premium/${skill.slug}`} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
