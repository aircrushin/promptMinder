import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq, desc, count as countFn } from 'drizzle-orm'
import { promptContributions } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function POST(request) {
  try {
    const { title, role, content, language, contributorEmail, contributorName } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!role || !role.trim()) {
      return NextResponse.json({ error: 'Role/Category is required' }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const result = await db.insert(promptContributions).values({
      title: title.trim(),
      roleCategory: role.trim(),
      content: content.trim(),
      language: language || 'zh',
      contributorEmail: contributorEmail?.trim() || null,
      contributorName: contributorName?.trim() || null,
      status: 'pending',
    }).returning()

    const newContribution = toSnakeCase(result[0])

    return NextResponse.json({
      message: 'Contribution submitted successfully',
      id: newContribution.id,
      status: newContribution.status,
      created_at: newContribution.created_at
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let dataQuery = db.select().from(promptContributions).orderBy(desc(promptContributions.createdAt))
    let countQuery = db.select({ value: countFn() }).from(promptContributions)

    if (status !== 'all') {
      dataQuery = dataQuery.where(eq(promptContributions.status, status))
      countQuery = countQuery.where(eq(promptContributions.status, status))
    }

    const [contributions, countResult] = await Promise.all([
      dataQuery.limit(limit).offset(offset),
      countQuery,
    ])

    return NextResponse.json({
      contributions: contributions.map(toSnakeCase),
      pagination: {
        page, limit,
        total: countResult[0]?.value || 0,
        totalPages: Math.ceil((countResult[0]?.value || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
