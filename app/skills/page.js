import { SkillCatalog } from '@/components/skill/SkillCatalog'
import { listCatalogSkills } from '@/lib/skills-catalog'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Agent Skills 专区',
  description: '发现、审查并添加可复用的 Agent Skills 到 PromptMinder 工作区。',
  alternates: { canonical: '/skills' },
}

export default async function SkillsPage({ searchParams }) {
  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q : ''
  const sort = params.sort === 'latest' ? 'latest' : 'popular'
  const parsedPage = Number.parseInt(params.page || '1', 10)
  const page = Number.isInteger(parsedPage) ? parsedPage : 1
  const result = await listCatalogSkills({ search, sort, page })

  return <SkillCatalog {...result} search={search} sort={sort} />
}

