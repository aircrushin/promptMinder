'use client'

import Link from 'next/link'
import { Search, ShieldCheck, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function pageHref({ search, sort, page }) {
  const params = new URLSearchParams()
  if (search) params.set('q', search)
  if (sort !== 'popular') params.set('sort', sort)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return `/skills${query ? `?${query}` : ''}`
}

export function SkillCatalog({ skills, pagination, search, sort }) {
  const { language } = useLanguage()
  const zh = language === 'zh'

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
              ? '同步自公开来源。仅在许可证明确且安全状态可接受时托管完整内容，所有 Skill 均保留原始出处。'
              : 'Synced from public sources. Full content is hosted only when licensing and security status allow it, with original attribution preserved.'}
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
            <select
              name="sort"
              defaultValue={sort}
              className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            >
              <option value="popular">{zh ? '最多安装' : 'Most installed'}</option>
              <option value="latest">{zh ? '最近同步' : 'Recently synced'}</option>
            </select>
            <button className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2">
              {zh ? '搜索' : 'Search'}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
          <span>{zh ? `共 ${pagination.total} 个 Skills` : `${pagination.total} skills`}</span>
          <span>{zh ? `第 ${pagination.page} 页` : `Page ${pagination.page}`}</span>
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
          <nav className="mt-8 flex items-center justify-between" aria-label={zh ? '分页' : 'Pagination'}>
            {pagination.page > 1 ? (
              <Link
                href={pageHref({ search, sort, page: pagination.page - 1 })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-950 hover:text-slate-950"
              >
                <ChevronLeft className="h-4 w-4" /> {zh ? '上一页' : 'Previous'}
              </Link>
            ) : <span />}
            {pagination.page < pagination.totalPages && (
              <Link
                href={pageHref({ search, sort, page: pagination.page + 1 })}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-950 hover:text-slate-950"
              >
                {zh ? '下一页' : 'Next'} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  )
}

