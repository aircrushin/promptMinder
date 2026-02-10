import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { auth } from '@clerk/nextjs/server'
import { eq, desc, count as countFn } from 'drizzle-orm'
import { userFeedback } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

export async function POST(request) {
  try {
    const data = await request.json()
    const { type, description, email } = data

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required' }, { status: 400 })
    }

    if (!['feature_request', 'bug'].includes(type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 })
    }

    let userId = null
    try {
      const { userId: authUserId } = await auth()
      userId = authUserId
    } catch {
      // User not authenticated, that's okay
    }

    const result = await db.insert(userFeedback).values({
      type,
      description,
      email: email || null,
      userId,
      status: 'pending',
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to submit feedback')
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    const whereCondition = status ? eq(userFeedback.status, status) : undefined

    const [dataRows, countResult] = await Promise.all([
      db.select().from(userFeedback).where(whereCondition).orderBy(desc(userFeedback.createdAt)).limit(limit).offset(offset),
      db.select({ value: countFn() }).from(userFeedback).where(whereCondition),
    ])

    const total = countResult[0]?.value || 0

    return NextResponse.json({
      feedback: dataRows.map(toSnakeCase),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load feedback')
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json()
    const { id, status } = data

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }

    if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const result = await db.update(userFeedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(userFeedback.id, id))
      .returning()

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    return handleApiError(error, 'Unable to update feedback')
  }
}
