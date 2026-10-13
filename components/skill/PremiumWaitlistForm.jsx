'use client'

import { useState } from 'react'
import { Check, Loader2, Mail } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { PREMIUM_COLLECTION, PREMIUM_INTENT_LEVELS, getPremiumSkillMeta } from '@/lib/premium-skills-data'

export function PremiumWaitlistForm({ defaultSkillSlug = PREMIUM_COLLECTION.skills[0].slug, source = '/skills' }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [skillSlug, setSkillSlug] = useState(defaultSkillSlug)
  const [interestLevel, setInterestLevel] = useState('early_access')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const selectedSkill = getPremiumSkillMeta(skillSlug)

  async function submit(event) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/premium-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, skillSlug, interestLevel, source }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || (zh ? '提交失败，请稍后重试。' : 'Unable to join the list.'))
      setStatus('success')
      setMessage(zh ? '已记录。首发时间和早鸟权益会发到你的邮箱。' : 'You are on the list. We will email the launch date and early access details.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <form onSubmit={submit} className="border border-slate-300 bg-white p-5 sm:p-6 dark:border-border dark:bg-card">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
          <Mail className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-950 dark:text-foreground">{zh ? '加入首发候补' : 'Join the launch list'}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
            {zh ? `预计 ${PREMIUM_COLLECTION.priceAnchor}。不扣款，只在首发前联系你。` : 'Estimated at ¥199 per collection. No charge today, just a launch update.'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="text-sm font-medium text-slate-800 dark:text-foreground">
          {zh ? '最想要哪一个？' : 'Which skill matters most?'}
          <select
            value={skillSlug}
            onChange={(event) => setSkillSlug(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-border dark:bg-card dark:text-foreground dark:focus:border-border dark:focus:ring-ring/10"
          >
            {PREMIUM_COLLECTION.skills.map((skill) => (
              <option key={skill.slug} value={skill.slug}>{zh ? skill.zhName : skill.name}</option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal text-slate-500 dark:text-muted-foreground">{selectedSkill?.outcome}</span>
        </label>

        <label className="text-sm font-medium text-slate-800 dark:text-foreground">
          {zh ? '你的意向' : 'Your intent'}
          <select
            value={interestLevel}
            onChange={(event) => setInterestLevel(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-border dark:bg-card dark:text-foreground dark:focus:border-border dark:focus:ring-ring/10"
          >
            {PREMIUM_INTENT_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>{zh ? level.label : level.value.replace('_', ' ')}</option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal text-slate-500 dark:text-muted-foreground">
            {PREMIUM_INTENT_LEVELS.find((level) => level.value === interestLevel)?.description}
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="premium-email">{zh ? '邮箱' : 'Email'}</label>
        <input
          id="premium-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={zh ? 'you@example.com' : 'you@example.com'}
          className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-border dark:text-foreground dark:placeholder:text-muted-foreground dark:focus:border-border dark:focus:ring-ring/10"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {zh ? '加入候补' : 'Join waitlist'}
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-700 dark:text-red-300' : 'text-slate-600 dark:text-muted-foreground'}`} role="status">
          {message}
        </p>
      )}
    </form>
  )
}
