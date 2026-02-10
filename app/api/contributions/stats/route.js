import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq, gte, desc, asc } from 'drizzle-orm'
import { promptContributions } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request) {
  try {
    // Get all statuses
    const allRows = await db.select({ status: promptContributions.status }).from(promptContributions)

    const statusStats = { pending: 0, approved: 0, rejected: 0, total: allRows.length }
    allRows.forEach(item => {
      statusStats[item.status] = (statusStats[item.status] || 0) + 1
    })

    // Recent 7 days trend
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

    // Pending preview
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
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
