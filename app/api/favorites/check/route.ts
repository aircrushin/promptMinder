import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/handle-api-error'
import { eq, and, inArray } from 'drizzle-orm'
import { favorites } from '@/drizzle/schema/index'

export async function GET(request) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const promptIds = searchParams.get('promptIds')

    if (!promptIds) {
      return NextResponse.json({ favorites: {} })
    }

    const ids = promptIds.split(',').filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ favorites: {} })
    }

    const rows = await db.select({ promptId: favorites.promptId }).from(favorites)
      .where(and(eq(favorites.userId, userId), inArray(favorites.promptId, ids)))

    const favoriteMap = {}
    ids.forEach(id => { favoriteMap[id] = false })
    rows.forEach(f => { favoriteMap[f.promptId] = true })

    return NextResponse.json({ favorites: favoriteMap })
  } catch (error) {
    return handleApiError(error, 'Unable to check favorites')
  }
}
