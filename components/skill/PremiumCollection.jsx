'use client'

import Link from 'next/link'
import { ArrowUpRight, LockKeyhole } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PREMIUM_COLLECTION } from '@/lib/premium-skills-data'
import { PremiumWaitlistForm } from '@/components/skill/PremiumWaitlistForm'

export function PremiumCollection() {
  const { language } = useLanguage()
  const zh = language === 'zh'

  return (
    <section id="premium" className="border-y border-slate-300 bg-slate-100/70">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{PREMIUM_COLLECTION.eyebrow}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {zh ? 'Premium Collection' : PREMIUM_COLLECTION.name}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              {zh ? PREMIUM_COLLECTION.description : 'Five opinionated workflows for turning good prompts into repeatable, reviewable AI work.'}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-950">
              <LockKeyhole className="h-4 w-4" />
              <span>{zh ? PREMIUM_COLLECTION.priceAnchor : 'Estimated ¥199 per collection, early access pricing for the launch list.'}</span>
            </div>
          </div>

          <div className="divide-y divide-slate-300 border-y border-slate-300 bg-white">
            {PREMIUM_COLLECTION.skills.map((skill) => (
              <Link
                key={skill.slug}
                href={`/skills/premium/${skill.slug}`}
                className="group grid gap-3 px-4 py-5 transition-colors hover:bg-slate-50 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-5"
              >
                <span className="font-mono text-xs text-slate-400">0{skill.order}</span>
                <span>
                  <span className="block text-base font-semibold text-slate-950 group-hover:underline">{zh ? skill.zhName : skill.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{skill.tagline}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-slate-950" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 max-w-4xl">
          <PremiumWaitlistForm />
        </div>
      </div>
    </section>
  )
}
