import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq } from 'drizzle-orm'
import { publicPrompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

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

export async function GET(request, { params }) {
  const authResult = await verifyAdmin(request)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { id } = await params

  try {
    const rows = await db.select().from(publicPrompts).where(eq(publicPrompts.id, id)).limit(1)

    if (!rows[0]) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 })
    }

    return NextResponse.json(toSnakeCase(rows[0]))
  } catch (error) {
    console.error('Error in get public prompt:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  const authResult = await verifyAdmin(request)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { title, role_category, content, category, language } = body

    if (title !== undefined && !title?.trim()) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    if (content !== undefined && !content?.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const updateData = { updatedAt: new Date() }
    if (title !== undefined) updateData.title = title.trim()
    if (role_category !== undefined) updateData.roleCategory = role_category.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (category !== undefined) updateData.category = category.trim()
    if (language !== undefined) updateData.language = language

    const result = await db.update(publicPrompts).set(updateData)
      .where(eq(publicPrompts.id, id)).returning()

    if (!result[0]) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 })
    }

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    console.error('Error in update public prompt:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const authResult = await verifyAdmin(request)
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { id } = await params

  try {
    await db.delete(publicPrompts).where(eq(publicPrompts.id, id))

    return NextResponse.json({ success: true, message: '提示词已删除' })
  } catch (error) {
    console.error('Error in delete public prompt:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
