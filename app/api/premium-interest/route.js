import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { asc, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { requireAdmin } from '@/lib/admin-auth.js'
import { premiumCollectionInterest } from '@/drizzle/schema/index.js'
import { getPremiumSkillMeta, PREMIUM_INTENT_LEVELS } from '@/lib/premium-skills-data.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const intentValues = new Set(PREMIUM_INTENT_LEVELS.map((level) => level.value))

export async function POST(request) {
  try {
    const body = await request.json()
    const email = String(body.email || '').trim().toLowerCase()
    const skillSlug = String(body.skillSlug || '').trim()
    const interestLevel = String(body.interestLevel || 'notify').trim()
    const source = String(body.source || '/skills').trim().slice(0, 200) || '/skills'

    if (!emailPattern.test(email) || email.length > 255) {
      return NextResponse.json({ error: '请输入有效的邮箱地址。' }, { status: 400 })
    }
    if (!getPremiumSkillMeta(skillSlug)) {
      return NextResponse.json({ error: '请选择有效的 Premium Skill。' }, { status: 400 })
    }
    if (!intentValues.has(interestLevel)) {
      return NextResponse.json({ error: '请选择你的购买意向。' }, { status: 400 })
    }

    let userId = null
    try {
      const session = await auth()
      userId = session.userId || null
    } catch {
      // Anonymous interest is supported.
    }

    const existing = await db
      .select({ id: premiumCollectionInterest.id })
      .from(premiumCollectionInterest)
      .where(sql`lower(${premiumCollectionInterest.email}) = ${email} AND ${premiumCollectionInterest.skillSlug} = ${skillSlug}`)
      .limit(1)

    const values = {
      skillSlug,
      email,
      userId,
      interestLevel,
      source,
      updatedAt: new Date(),
    }

    const rows = existing[0]
      ? await db.update(premiumCollectionInterest).set(values).where(eq(premiumCollectionInterest.id, existing[0].id)).returning()
      : await db.insert(premiumCollectionInterest).values(values).returning()

    return NextResponse.json({ ok: true, interest: rows[0] }, { status: existing[0] ? 200 : 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to save premium interest.')
  }
}

export async function GET(request) {
  try {
    requireAdmin(request)
    const [summary, latest] = await Promise.all([
      db
        .select({ skillSlug: premiumCollectionInterest.skillSlug, interestLevel: premiumCollectionInterest.interestLevel, total: count() })
        .from(premiumCollectionInterest)
        .groupBy(premiumCollectionInterest.skillSlug, premiumCollectionInterest.interestLevel)
        .orderBy(asc(premiumCollectionInterest.skillSlug), asc(premiumCollectionInterest.interestLevel)),
      db
        .select()
        .from(premiumCollectionInterest)
        .orderBy(desc(premiumCollectionInterest.createdAt))
        .limit(100),
    ])

    return NextResponse.json({ summary, latest })
  } catch (error) {
    return handleApiError(error, 'Unable to load premium interest.')
  }
}
