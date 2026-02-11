import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { auth } from '@clerk/nextjs/server'
import { eq, or, isNull, asc } from 'drizzle-orm'
import { tags } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request) {
  try {
    const { userId } = await auth()

    const rows = await db.select().from(tags)
      .where(or(isNull(tags.userId), eq(tags.userId, userId)))
      .orderBy(asc(tags.name))

    return NextResponse.json(rows.map(toSnakeCase))
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const { userId } = await auth()

  try {
    const { name, isPublic } = await request.json()

    const result = await db.insert(tags).values({
      name,
      userId: isPublic ? null : userId,
      createdBy: userId,
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const { userId } = await auth()

  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    if (!tag.userId) {
      return NextResponse.json({ error: '不能删除公共标签' }, { status: 403 })
    }

    if (tag.userId !== userId) {
      return NextResponse.json({ error: '无权删除此标签' }, { status: 403 })
    }

    await db.delete(tags).where(eq(tags.id, tagId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  const { userId } = await auth()

  try {
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')
    const { name } = await request.json()

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]

    if (!tag) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    if (!tag.userId) {
      return NextResponse.json({ error: '不能修改公共标签' }, { status: 403 })
    }

    if (tag.userId !== userId) {
      return NextResponse.json({ error: '无权修改此标签' }, { status: 403 })
    }

    const result = await db.update(tags).set({ name }).where(eq(tags.id, tagId)).returning()

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
