import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { ApiError } from '@/lib/api-error.js'
import { eq, asc, and, inArray } from 'drizzle-orm'
import { tags, publicTags } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

function assertTagName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new ApiError(400, 'Tag name is required')
  }
}

export async function GET(request) {
  try {
    const userId = await requireUserId()
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
    return handleApiError(error, 'Unable to fetch tags', 'TAG_FETCH_FAILED')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { name, isPublic } = await request.json()

    assertTagName(name)

    const result = await db.insert(tags).values({
      name: name.trim(),
      userId: isPublic ? null : userId,
      createdBy: userId,
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create tag', 'TAG_CREATE_FAILED')
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')
    const idsParam = searchParams.get('ids')

    // 批量删除
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)

      if (ids.length === 0) {
        throw new ApiError(400, 'Tag IDs are required')
      }

      // 验证所有标签是否存在且属于当前用户
      const rows = await db.select({ id: tags.id }).from(tags).where(and(eq(tags.userId, userId), inArray(tags.id, ids)))
      const userTagIds = new Set(rows.map(t => t.id))

      const invalidIds = ids.filter(id => !userTagIds.has(id))
      if (invalidIds.length > 0) {
        throw new ApiError(403, 'Some tags do not exist or cannot be deleted')
      }

      // 执行批量删除
      await db.delete(tags).where(and(eq(tags.userId, userId), inArray(tags.id, ids)))

      return NextResponse.json({ success: true, deletedCount: ids.length })
    }

    // 单个删除
    if (!tagId) {
      throw new ApiError(400, 'Tag ID is required')
    }

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]

    if (!tag) {
      throw new ApiError(404, 'Tag not found')
    }

    if (!tag.userId) {
      throw new ApiError(403, 'Public tags cannot be deleted')
    }

    if (tag.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this tag')
    }

    await db.delete(tags).where(eq(tags.id, tagId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete tag', 'TAG_DELETE_FAILED')
  }
}

export async function PATCH(request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')
    const { name } = await request.json()

    if (!tagId) {
      throw new ApiError(400, 'Tag ID is required')
    }

    assertTagName(name)

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]

    if (!tag) {
      throw new ApiError(404, 'Tag not found')
    }

    if (!tag.userId) {
      throw new ApiError(403, 'Public tags cannot be updated')
    }

    if (tag.userId !== userId) {
      throw new ApiError(403, 'You do not have permission to update this tag')
    }

    const result = await db.update(tags).set({ name: name.trim() }).where(eq(tags.id, tagId)).returning()

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    return handleApiError(error, 'Unable to update tag', 'TAG_UPDATE_FAILED')
  }
}
