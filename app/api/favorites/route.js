import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { db } from '@/lib/db.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { clerkClient } from '@clerk/nextjs/server'
import { eq, and, desc, inArray, count as countFn } from 'drizzle-orm'
import { favorites, prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function GET(request) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    const [favRows, countResult] = await Promise.all([
      db.select({ promptId: favorites.promptId })
        .from(favorites)
        .where(eq(favorites.userId, userId))
        .orderBy(desc(favorites.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: countFn() })
        .from(favorites)
        .where(eq(favorites.userId, userId))
    ])

    const total = countResult[0]?.value || 0

    if (!favRows.length) {
      return NextResponse.json({
        prompts: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      })
    }

    const promptIds = favRows.map(f => f.promptId)

    const promptRows = await db.select().from(prompts).where(inArray(prompts.id, promptIds))

    const promptMap = new Map(promptRows.map(p => [p.id, toSnakeCase(p)]))
    let orderedPrompts = promptIds.map(id => promptMap.get(id)).filter(Boolean)

    if (orderedPrompts.length > 0) {
      const userIds = Array.from(new Set(orderedPrompts.map(p => p.created_by).filter(Boolean)))

      if (userIds.length > 0) {
        try {
          let clerk
          if (typeof clerkClient === 'function') {
            clerk = await clerkClient()
          } else {
            clerk = clerkClient
          }

          if (clerk?.users) {
            const users = await clerk.users.getUserList({ userId: userIds, limit: userIds.length })
            const userMap = new Map()
            const userList = Array.isArray(users?.data) ? users.data : (Array.isArray(users) ? users : [])

            userList.forEach(user => {
              const email = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
                || user.emailAddresses?.[0]?.emailAddress
              userMap.set(user.id, {
                id: user.id, fullName: user.fullName, firstName: user.firstName,
                lastName: user.lastName, username: user.username, imageUrl: user.imageUrl, email
              })
            })

            orderedPrompts = orderedPrompts.map(prompt => ({
              ...prompt, creator: userMap.get(prompt.created_by) || null
            }))
          }
        } catch (error) {
          console.warn('Failed to fetch creator details:', error)
        }
      }
    }

    return NextResponse.json({
      prompts: orderedPrompts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load favorites')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { promptId } = await request.json()

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }

    const promptRows = await db.select({ id: prompts.id }).from(prompts).where(eq(prompts.id, promptId)).limit(1)
    if (!promptRows[0]) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    const existingRows = await db.select({ id: favorites.id }).from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.promptId, promptId)))
      .limit(1)

    if (existingRows[0]) {
      return NextResponse.json({ favorited: true, message: 'Already favorited' })
    }

    await db.insert(favorites).values({ userId, promptId })

    return NextResponse.json({ favorited: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to add favorite')
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId()
    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')

    if (!promptId) {
      return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
    }

    await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.promptId, promptId)))

    return NextResponse.json({ favorited: false })
  } catch (error) {
    return handleApiError(error, 'Unable to remove favorite')
  }
}
