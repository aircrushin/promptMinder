import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { auth } from '@clerk/nextjs/server'
import { eq, and, asc } from 'drizzle-orm'
import { publicTags } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

/**
 * GET /api/public-tags
 * 获取所有公共标签（所有用户都可以访问，不需要认证）
 * 可选查询参数:
 * - category: 按类别筛选
 * - active: 只返回激活的标签 (默认 true)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false'

    let conditions = []
    
    if (activeOnly) {
      conditions.push(eq(publicTags.isActive, true))
    }
    
    if (category) {
      conditions.push(eq(publicTags.category, category))
    }

    let query = db.select().from(publicTags)
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const rows = await query
      .orderBy(asc(publicTags.sortOrder), asc(publicTags.name))

    return NextResponse.json(rows.map(toSnakeCase))
  } catch (error) {
    console.error('Error fetching public tags:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/public-tags
 * 创建新的公共标签（仅管理员可用）
 */
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 检查是否为管理员（可以通过 Clerk 的 metadata 或特定角色判断）
    // 这里简化处理，实际项目中应该检查管理员权限
    const isAdmin = sessionClaims?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { name, description, category, sortOrder } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '标签名称不能为空' }, { status: 400 })
    }

    const result = await db.insert(publicTags).values({
      name: name.trim(),
      description: description || null,
      category: category || 'general',
      sortOrder: sortOrder || 0,
      createdBy: userId,
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    console.error('Error creating public tag:', error)
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json({ error: '标签名称已存在' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/public-tags?id=xxx
 * 更新公共标签（仅管理员可用）
 */
export async function PATCH(request) {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const isAdmin = sessionClaims?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json({ error: '未提供标签ID' }, { status: 400 })
    }

    const { name, description, category, sortOrder, isActive } = await request.json()

    const updateData = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (isActive !== undefined) updateData.isActive = isActive
    updateData.updatedAt = new Date()

    const result = await db
      .update(publicTags)
      .set(updateData)
      .where(eq(publicTags.id, tagId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    console.error('Error updating public tag:', error)
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json({ error: '标签名称已存在' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/public-tags?id=xxx
 * 删除公共标签（仅管理员可用）
 */
export async function DELETE(request) {
  try {
    const { userId, sessionClaims } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const isAdmin = sessionClaims?.metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')

    if (!tagId) {
      return NextResponse.json({ error: '未提供标签ID' }, { status: 400 })
    }

    const result = await db
      .delete(publicTags)
      .where(eq(publicTags.id, tagId))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting public tag:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
