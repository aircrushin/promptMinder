import { count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db.js'
import { catalogSkills } from '@/drizzle/schema/index.js'

const CATALOG_REVALIDATE_SECONDS = 3600

const getCachedCatalogSkills = unstable_cache(async ({ search, sort, page, pageSize }) => {
  const where = search
    ? or(
        ilike(catalogSkills.name, `%${search}%`),
        ilike(catalogSkills.description, `%${search}%`),
        ilike(catalogSkills.source, `%${search}%`)
      )
    : undefined
  const order = sort === 'latest'
    ? desc(catalogSkills.syncedAt)
    : desc(catalogSkills.installs)

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: catalogSkills.id,
        name: catalogSkills.name,
        description: catalogSkills.description,
        source: catalogSkills.source,
        installs: catalogSkills.installs,
        licenseSpdx: catalogSkills.licenseSpdx,
        auditStatus: catalogSkills.auditStatus,
        hasContent: sql`${catalogSkills.content} IS NOT NULL`,
        syncedAt: catalogSkills.syncedAt,
      })
      .from(catalogSkills)
      .where(where)
      .orderBy(order)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(catalogSkills).where(where),
  ])

  const total = totalRows[0]?.value || 0
  return {
    skills: rows.map((skill) => ({
      ...skill,
      hasContent: skill.hasContent,
      syncedAt: skill.syncedAt.toISOString(),
    })),
    pagination: {
      page,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  }
}, ['catalog-skills-list'], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ['catalog-skills'],
})

const getCachedCatalogSkill = unstable_cache(async (id) => {
  const rows = await db
    .select()
    .from(catalogSkills)
    .where(eq(catalogSkills.id, id))
    .limit(1)
  const skill = rows[0]
  if (!skill) return null

  return {
    ...skill,
    syncedAt: skill.syncedAt.toISOString(),
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
  }
}, ['catalog-skill'], {
  revalidate: CATALOG_REVALIDATE_SECONDS,
  tags: ['catalog-skills'],
})

export async function listCatalogSkills({ search = '', sort = 'popular', page = 1, pageSize = 20 } = {}) {
  return getCachedCatalogSkills({
    search: String(search).trim().slice(0, 100),
    sort: sort === 'latest' ? 'latest' : 'popular',
    page: Math.max(1, Math.floor(Number(page) || 1)),
    pageSize: Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 20))),
  })
}

export async function getCatalogSkill(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null
  }

  return getCachedCatalogSkill(id)
}
