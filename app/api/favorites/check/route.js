import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()

    const { searchParams } = new URL(request.url)
    const promptIds = searchParams.get('promptIds')

    if (!promptIds) {
      return NextResponse.json({ favorites: {} })
    }

    const ids = promptIds.split(',').filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json({ favorites: {} })
    }

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('prompt_id')
      .eq('user_id', userId)
      .in('prompt_id', ids)

    if (error) {
      throw error
    }

    const favoriteMap = {}
    ids.forEach(id => {
      favoriteMap[id] = false
    })
    favorites?.forEach(f => {
      favoriteMap[f.prompt_id] = true
    })

    return NextResponse.json({ favorites: favoriteMap })
  } catch (error) {
    return handleApiError(error, 'Unable to check favorites')
  }
}
