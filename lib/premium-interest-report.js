import { PREMIUM_COLLECTION, PREMIUM_INTENT_LEVELS } from '@/lib/premium-skills-data.js';

export function buildInterestSummary(summary) {
  const slugs = new Set([...PREMIUM_COLLECTION.skills.map((skill) => skill.slug), ...summary.map((row) => row.skillSlug)]);
  return [...slugs].map((skillSlug) => {
    const counts = Object.fromEntries(PREMIUM_INTENT_LEVELS.map(({ value }) => [value, 0]));
    let total = 0;
    for (const row of summary.filter((item) => item.skillSlug === skillSlug)) {
      counts[row.interestLevel] = Number(row.total);
      total += Number(row.total);
    }
    return { skillSlug, counts, total };
  });
}

// Quote every field and neutralize spreadsheet formulas in user-controlled values.
export function reportCsv(rows) {
  return '\uFEFF' + rows.map((row) => row.map((value) => {
    let cell = String(value ?? '');
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(cell) || /^[\t\r\n]/.test(cell)) cell = `'${cell}`;
    return `"${cell.replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}
