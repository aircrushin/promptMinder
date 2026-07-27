import { SkillCatalog } from '@/components/skill/SkillCatalog'
import { listCatalogSkills } from '@/lib/skills-catalog'

export const revalidate = 3600

export const metadata = {
  title: 'Agent Skills 专区',
  description: '发现、审查并添加可复用的 Agent Skills 到 PromptMinder 工作区。',
  alternates: { canonical: '/skills' },
}

export default async function SkillsPage() {
  const result = await listCatalogSkills()

  return <SkillCatalog {...result} search="" sort="popular" />
}
