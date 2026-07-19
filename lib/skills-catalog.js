import { count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '@/lib/db.js'
import { catalogSkills } from '@/drizzle/schema/index.js'

export async function listCatalogSkills({ search = '', sort = 'popular', page = 1, pageSize = 20 }) {
  const normalizedSearch = search.trim().slice(0, 100)
  const currentPage = Math.max(1, page)
  const where = normalizedSearch
    ? or(
        ilike(catalogSkills.name, `%${normalizedSearch}%`),
        ilike(catalogSkills.description, `%${normalizedSearch}%`),
        ilike(catalogSkills.source, `%${normalizedSearch}%`)
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
      .offset((currentPage - 1) * pageSize),
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
      page: currentPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  }
}

export async function getCatalogSkill(id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null
  }
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
}
