import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { clerkClient } from '@clerk/nextjs/server'
import { eq, or, and, ilike, desc, count as countFn } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

function buildPromptConditions({ teamId, userId, tag, search }) {
  const conditions = []

  if (teamId) {
    conditions.push(eq(prompts.teamId, teamId))
  } else {
    conditions.push(or(eq(prompts.createdBy, userId), eq(prompts.userId, userId)))
  }

  if (tag) {
    conditions.push(ilike(prompts.tags, `%${tag}%`))
  }

  if (search) {
    conditions.push(or(ilike(prompts.title, `%${search}%`), ilike(prompts.description, `%${search}%`)))
  }

  return and(...conditions)
}

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    const whereCondition = buildPromptConditions({ teamId, userId, tag, search })

    const [dataResult, countResult] = await Promise.all([
      db.select().from(prompts).where(whereCondition).orderBy(desc(prompts.createdAt)).limit(limit).offset(offset),
      db.select({ value: countFn() }).from(prompts).where(whereCondition)
    ])

    let promptList = dataResult.map(toSnakeCase)
    const total = countResult[0]?.value || 0

    // Enrich prompts with creator info if possible
    if (promptList.length > 0) {
      const userIds = Array.from(new Set(promptList.map(p => p.created_by).filter(Boolean)))

      if (userIds.length > 0) {
        try {
          let clerk
          if (typeof clerkClient === 'function') {
            clerk = await clerkClient()
          } else {
            clerk = clerkClient
          }

          if (clerk?.users) {
            const users = await clerk.users.getUserList({
              userId: userIds,
              limit: userIds.length,
            })

            const userMap = new Map()
            const userList = Array.isArray(users?.data) ? users.data : (Array.isArray(users) ? users : [])

            userList.forEach(user => {
              const email = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
                || user.emailAddresses?.[0]?.emailAddress

              userMap.set(user.id, {
                id: user.id,
                fullName: user.fullName,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                imageUrl: user.imageUrl,
                email: email
              })
            })

            promptList = promptList.map(prompt => ({
              ...prompt,
              creator: userMap.get(prompt.created_by) || null
            }))
          }
        } catch (error) {
          console.warn('Failed to fetch creator details:', error)
        }
      }
    }

    return NextResponse.json({
      prompts: promptList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load prompts')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    let targetTeamId = null
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
      targetTeamId = teamId
    }

    const data = await request.json()

    const result = await db
      .insert(prompts)
      .values({
        teamId: targetTeamId,
        projectId: targetTeamId ? data.projectId || null : null,
        title: data.title,
        content: data.content,
        description: data.description || null,
        createdBy: userId,
        userId: userId,
        version: data.version || null,
        tags: data.tags || null,
        isPublic: data.is_public ?? false,
        coverImg: data.cover_img || data.image_url || null,
      })
      .returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create prompt')
  }
}
