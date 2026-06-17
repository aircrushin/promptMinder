import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq, gte, desc, asc } from 'drizzle-orm'
import { promptContributions } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { requireAdmin } from '@/lib/admin-auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function GET(request) {
  try {
    requireAdmin(request)

    const allRows = await db.select({ status: promptContributions.status }).from(promptContributions)

    const statusStats = { pending: 0, approved: 0, rejected: 0, total: allRows.length }
    allRows.forEach(item => {
      statusStats[item.status] = (statusStats[item.status] || 0) + 1
    })

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentRows = await db.select({ createdAt: promptContributions.createdAt })
      .from(promptContributions)
      .where(gte(promptContributions.createdAt, sevenDaysAgo))
      .orderBy(asc(promptContributions.createdAt))

    const dailyStats = {}
    recentRows.forEach(row => {
      const date = new Date(row.createdAt).toISOString().split('T')[0]
      dailyStats[date] = (dailyStats[date] || 0) + 1
    })

    const pendingPreview = await db
      .select({
        id: promptContributions.id,
        title: promptContributions.title,
        roleCategory: promptContributions.roleCategory,
        createdAt: promptContributions.createdAt,
      })
      .from(promptContributions)
      .where(eq(promptContributions.status, 'pending'))
      .orderBy(desc(promptContributions.createdAt))
      .limit(5)

    return NextResponse.json({
      statusStats,
      dailyStats,
      pendingPreview: pendingPreview.map(toSnakeCase),
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load contribution stats')
  }
}
