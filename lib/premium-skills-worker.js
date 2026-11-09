import { getPremiumSkillMeta } from '@/lib/premium-skills-data';

const premiumSkillFiles = import.meta.glob('../skills/premium/*/SKILL.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function readPremiumContent(slug) {
  const suffix = `/premium/${slug}/SKILL.md`;
  for (const [filePath, content] of Object.entries(premiumSkillFiles)) {
    if (filePath.endsWith(suffix)) return content;
  }
  return null;
}

export async function getPremiumSkill(slug) {
  const meta = getPremiumSkillMeta(slug);
  if (!meta) return null;

  const content = readPremiumContent(slug);
  if (!content) return null;
  return { ...meta, content };
}
