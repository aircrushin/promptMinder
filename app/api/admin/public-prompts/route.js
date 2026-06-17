import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { or, ilike, desc, count as countFn, eq, and } from 'drizzle-orm'
import { publicPrompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { requireAdmin } from '@/lib/admin-auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function GET(request) {
  try {
    requireAdmin(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []
    
    if (search) {
      conditions.push(
        or(
          ilike(publicPrompts.title, `%${search}%`),
          ilike(publicPrompts.roleCategory, `%${search}%`),
          ilike(publicPrompts.content, `%${search}%`)
        )
      )
    }
    
    if (category) {
      conditions.push(eq(publicPrompts.category, category))
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

    const [dataRows, countResult] = await Promise.all([
      db.select().from(publicPrompts).where(whereCondition).orderBy(desc(publicPrompts.createdAt)).limit(limit).offset(offset),
      db.select({ value: countFn() }).from(publicPrompts).where(whereCondition),
    ])

    const total = countResult[0]?.value || 0

    return NextResponse.json({
      prompts: dataRows.map(toSnakeCase),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load public prompts')
  }
}

export async function POST(request) {
  try {
    const adminEmail = requireAdmin(request)

    const body = await request.json()
    const { title, role_category, content, category, language } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const result = await db.insert(publicPrompts).values({
      title: title.trim(),
      roleCategory: role_category?.trim() || title.trim(),
      content: content.trim(),
      category: category?.trim() || '通用',
      language: language || 'zh',
      createdBy: adminEmail,
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create public prompt')
  }
}
