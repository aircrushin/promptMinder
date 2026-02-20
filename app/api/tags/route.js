import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { auth } from '@clerk/nextjs/server'
import { eq, asc } from 'drizzle-orm'
import { tags, publicTags } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request) {
  try {
    const { userId } = await auth()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const includePublic = searchParams.get('includePublic') !== 'false'

    let teamRows = []
    let personalRows = []
    let publicRows = []

    if (teamId) {
      // 获取团队标签（teamId 不为 null，userId 为 null）
      teamRows = await db.select().from(tags)
        .where(eq(tags.teamId, teamId))
        .orderBy(asc(tags.name))
    } else {
      // 获取个人标签（teamId 为 null，userId 为当前用户）
      personalRows = await db.select().from(tags)
        .where(eq(tags.userId, userId))
        .orderBy(asc(tags.name))
    }

    // 获取公共标签
    if (includePublic) {
      publicRows = await db.select().from(publicTags)
        .where(eq(publicTags.isActive, true))
        .orderBy(asc(publicTags.sortOrder), asc(publicTags.name))
    }

    // 返回结构化的响应
    return NextResponse.json({
      team: teamRows.map(toSnakeCase),
      personal: personalRows.map(toSnakeCase),
      public: publicRows.map(toSnakeCase),
    })
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
    const idsParam = searchParams.get('ids')

    // 批量删除
    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean)
      
      if (ids.length === 0) {
        return NextResponse.json({ error: '未提供标签ID' }, { status: 400 })
      }

      // 验证所有标签是否存在且属于当前用户
      const rows = await db.select().from(tags).where(eq(tags.userId, userId))
      const userTagIds = new Set(rows.map(t => t.id))
      
      const invalidIds = ids.filter(id => !userTagIds.has(id))
      if (invalidIds.length > 0) {
        return NextResponse.json({ error: '部分标签不存在或无权删除' }, { status: 403 })
      }

      // 执行批量删除
      for (const id of ids) {
        await db.delete(tags).where(eq(tags.id, id))
      }

      return NextResponse.json({ success: true, deletedCount: ids.length })
    }

    // 单个删除
    if (!tagId) {
      return NextResponse.json({ error: '未提供标签ID' }, { status: 400 })
    }

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
