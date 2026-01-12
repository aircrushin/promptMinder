import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { createSupabaseServerClient } from '@/lib/supabaseServer.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('prompt_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (favError) {
      throw favError
    }

    const { count, error: countError } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      throw countError
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({
        prompts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    const promptIds = favorites.map(f => f.prompt_id)

    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .in('id', promptIds)

    if (promptsError) {
      throw promptsError
    }

    const promptMap = new Map(prompts.map(p => [p.id, p]))
    let orderedPrompts = promptIds
      .map(id => promptMap.get(id))
      .filter(Boolean)

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

            orderedPrompts = orderedPrompts.map(prompt => ({
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
      prompts: orderedPrompts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load favorites')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()

    const { promptId } = await request.json()

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId is required' },
        { status: 400 }
      )
    }

    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id')
      .eq('id', promptId)
      .single()

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('prompt_id', promptId)
      .single()

    if (existing) {
      return NextResponse.json({ favorited: true, message: 'Already favorited' })
    }

    const { error: insertError } = await supabase
      .from('favorites')
      .insert([{
        user_id: userId,
        prompt_id: promptId
      }])

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ favorited: true }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to add favorite')
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId()
    const supabase = createSupabaseServerClient()

    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get('promptId')

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('prompt_id', promptId)

    if (error) {
      throw error
    }

    return NextResponse.json({ favorited: false })
  } catch (error) {
    return handleApiError(error, 'Unable to remove favorite')
  }
}
