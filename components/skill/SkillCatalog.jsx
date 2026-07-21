'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShieldCheck, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function pageHref({ search, sort, page }) {
  const params = new URLSearchParams()
  if (search) params.set('q', search)
  if (sort !== 'popular') params.set('sort', sort)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/skills${query ? `?${query}` : ''}`
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p))

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
    result.push(sorted[i])
  }
  return result
}

export function SkillCatalog({ skills, pagination, search, sort }) {
  const { language } = useLanguage()
  const zh = language === 'zh'
  const [sortValue, setSortValue] = useState(sort)

  return (
    <div className="min-h-screen bg-slate-50/60">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="mb-3 text-sm font-medium text-slate-500">PromptMinder Skills</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {zh ? '可审查、可复用的 Agent Skills' : 'Reviewable, reusable Agent Skills'}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            {zh
              ? '同步自公开来源。'
              : 'Synced from public sources.'}
          </p>

          <form className="mt-9 flex max-w-3xl flex-col gap-3 sm:flex-row" action="/skills">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={search}
                placeholder={zh ? '搜索名称、描述或来源' : 'Search name, description, or source'}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
            </div>
            <input type="hidden" name="sort" value={sortValue} />
            <Select value={sortValue} onValueChange={setSortValue}>
              <SelectTrigger className="h-11 w-full rounded-lg border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 focus:ring-offset-0 sm:w-[11.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-slate-200 bg-white text-slate-900 shadow-lg">
                <SelectItem
                  value="popular"
                  className="cursor-pointer rounded-md py-2.5 focus:bg-slate-100 focus:text-slate-950"
                >
                  {zh ? '最多安装' : 'Most installed'}
                </SelectItem>
                <SelectItem
                  value="latest"
                  className="cursor-pointer rounded-md py-2.5 focus:bg-slate-100 focus:text-slate-950"
                >
                  {zh ? '最近同步' : 'Recently synced'}
                </SelectItem>
              </SelectContent>
            </Select>
            <button className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
              {zh ? '搜索' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
          <span>{zh ? `共 ${pagination.total} 个 Skills` : `${pagination.total} skills`}</span>
          <span>
            {zh
              ? `第 ${pagination.page} / ${pagination.totalPages} 页`
              : `Page ${pagination.page} of ${pagination.totalPages}`}
          </span>
        </div>

        {skills.length === 0 ? (
          <div className="border-y border-slate-200 py-20 text-center">
            <p className="font-medium text-slate-900">{zh ? '还没有可展示的 Skill' : 'No skills to show yet'}</p>
            <p className="mt-2 text-sm text-slate-500">
              {zh ? '运行同步脚本，或换一个关键词搜索。' : 'Run the sync script or try another search.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {skills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="group grid gap-4 py-6 transition-colors hover:bg-white sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-950 group-hover:underline">
                      {skill.name}
                    </h2>
                    {skill.hasContent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3 w-3" />
                        {zh ? '内容可用' : 'Content available'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {zh ? '仅索引' : 'Index only'}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {skill.description || (zh ? '暂无描述' : 'No description available')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{skill.source}</span>
                    {skill.licenseSpdx && <span>{skill.licenseSpdx}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 self-center text-sm text-slate-500">
                  <span>{numberFormatter.format(skill.installs)} {zh ? '安装' : 'installs'}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-950" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={zh ? '分页' : 'Pagination'}>
            <Link
              href={pageHref({ search, sort, page: pagination.page - 1 })}
              aria-disabled={pagination.page <= 1}
              tabIndex={pagination.page <= 1 ? -1 : undefined}
              className={`inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition ${
                pagination.page <= 1
                  ? 'pointer-events-none border-slate-200 text-slate-300'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{zh ? '上一页' : 'Previous'}</span>
            </Link>

            {getPageNumbers(pagination.page, pagination.totalPages).map((item, index) =>
              item === '...' ? (
                <span key={`ellipsis-${index}`} className="px-1 text-sm text-slate-400">
                  …
                </span>
              ) : (
                <Link
                  key={item}
                  href={pageHref({ search, sort, page: item })}
                  aria-current={item === pagination.page ? 'page' : undefined}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
                    item === pagination.page
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950'
                  }`}
                >
                  {item}
                </Link>
              )
            )}

            <Link
              href={pageHref({ search, sort, page: pagination.page + 1 })}
              aria-disabled={pagination.page >= pagination.totalPages}
              tabIndex={pagination.page >= pagination.totalPages ? -1 : undefined}
              className={`inline-flex h-10 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition ${
                pagination.page >= pagination.totalPages
                  ? 'pointer-events-none border-slate-200 text-slate-300'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950'
              }`}
            >
              <span className="hidden sm:inline">{zh ? '下一页' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </section>
    </div>
  )
}

