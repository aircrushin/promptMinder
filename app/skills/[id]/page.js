import { notFound } from 'next/navigation'
import { SkillDetail } from '@/components/skill/SkillDetail'
import { getCatalogSkill } from '@/lib/skills-catalog'

export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const skill = await getCatalogSkill(id)
  if (!skill) return { title: 'Skill not found' }

  return {
    title: skill.name,
    description: skill.description || `查看 ${skill.name} 的完整 Skill 内容与来源信息。`,
    alternates: { canonical: `/skills/${skill.id}` },
  }
}

export default async function SkillDetailPage({ params }) {
  const { id } = await params
  const skill = await getCatalogSkill(id)
  if (!skill) notFound()

  return <SkillDetail skill={skill} />
}
