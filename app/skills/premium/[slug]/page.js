import { notFound } from 'next/navigation'
import { PremiumSkillDetail } from '@/components/skill/PremiumSkillDetail'
import { PREMIUM_COLLECTION } from '@/lib/premium-skills-data'
import { getPremiumSkill } from '@/lib/premium-skills-server'

export const revalidate = 3600

export function generateStaticParams() {
  return PREMIUM_COLLECTION.skills.map((skill) => ({ slug: skill.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const skill = await getPremiumSkill(slug)
  if (!skill) return { title: 'Premium Skill not found' }

  return {
    title: `${skill.name} · Premium Collection`,
    description: skill.description,
    alternates: { canonical: `/skills/premium/${skill.slug}` },
  }
}

export default async function PremiumSkillPage({ params }) {
  const { slug } = await params
  const skill = await getPremiumSkill(slug)
  if (!skill) notFound()

  return <PremiumSkillDetail skill={skill} />
}
