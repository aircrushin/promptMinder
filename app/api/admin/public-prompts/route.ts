import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { or, ilike, desc, count as countFn } from 'drizzle-orm'
import { publicPrompts } from '@/drizzle/schema/index'
import { toSnakeCase } from '@/lib/case-utils'

async function verifyAdmin(request) {
  const adminEmail = request.headers.get('x-admin-email')
  const adminToken = request.headers.get('x-admin-token')

  if (!adminEmail || !adminToken) {
    return { success: false, error: '未授权访问' }
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

  if (!adminEmails.includes(adminEmail.toLowerCase())) {
    return { success: false, error: '无管理员权限' }
  }

  return { success: true }
}

export async function GET(request) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const offset = (page - 1) * limit

    const whereCondition = search
      ? or(
          ilike(publicPrompts.title, `%${search}%`),
          ilike(publicPrompts.roleCategory, `%${search}%`),
          ilike(publicPrompts.content, `%${search}%`)
        )
      : undefined

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
    console.error('Error in public prompts API:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authResult = await verifyAdmin(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { title, role_category, content, category, language } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const adminEmail = request.headers.get('x-admin-email')

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
    console.error('Error in create public prompt:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
