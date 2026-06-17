import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { eq } from 'drizzle-orm'
import { publicPrompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'
import { requireAdmin } from '@/lib/admin-auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function GET(request, { params }) {
  try {
    requireAdmin(request)

    const { id } = await params

    const rows = await db.select().from(publicPrompts).where(eq(publicPrompts.id, id)).limit(1)

    if (!rows[0]) {
      return NextResponse.json({ error: '提示词不存在' }, { status: 404 })
    }

    return NextResponse.json(toSnakeCase(rows[0]))
  } catch (error) {
    return handleApiError(error, 'Unable to load public prompt')
  }
}

export async function PATCH(request, { params }) {
  try {
    requireAdmin(request)

    const { id } = await params

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
    return handleApiError(error, 'Unable to update public prompt')
  }
}

export async function DELETE(request, { params }) {
  try {
    requireAdmin(request)

    const { id } = await params

    await db.delete(publicPrompts).where(eq(publicPrompts.id, id))

    return NextResponse.json({ success: true, message: '提示词已删除' })
  } catch (error) {
    return handleApiError(error, 'Unable to delete public prompt')
  }
}
