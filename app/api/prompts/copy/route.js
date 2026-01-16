import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })

    let targetTeamId = null
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
      targetTeamId = teamId
    }

    const { sourceId, promptData } = await request.json()

    if (!sourceId && !promptData) {
      return NextResponse.json({ error: 'Invalid request: Missing sourceId or promptData' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()

    let dataToCopy = null

    if (promptData) {
      dataToCopy = {
        title: promptData.role,
        content: promptData.prompt,
        description: `${promptData.category}`,
        tags: promptData.category || null,
        cover_img: null,
      }
    } else if (sourceId) {
      let sourcePrompt = null

      if (teamId) {
        const { data: teamPrompt, error: teamPromptError } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', sourceId)
          .eq('team_id', teamId)
          .maybeSingle()

        if (teamPromptError) {
          throw teamPromptError
        }

        sourcePrompt = teamPrompt
      }

      if (!sourcePrompt) {
        const { data: publicPrompt, error: publicError } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', sourceId)
          .eq('is_public', true)
          .maybeSingle()

        if (publicError) {
          throw publicError
        }

        if (!publicPrompt) {
          return NextResponse.json({ error: 'Prompt not found or unavailable' }, { status: 404 })
        }

        if (publicPrompt.user_id === userId) {
          return NextResponse.json({ error: 'Cannot copy your own public prompt' }, { status: 400 })
        }

        sourcePrompt = publicPrompt
      }

      dataToCopy = {
        title: sourcePrompt.title,
        content: sourcePrompt.content,
        description: sourcePrompt.description,
        tags: sourcePrompt.tags,
        cover_img: sourcePrompt.cover_img,
        project_id: sourcePrompt.project_id,
      }
    }

    const insertPayload = {
      id: crypto.randomUUID(),
      team_id: targetTeamId,
      project_id: targetTeamId ? dataToCopy.project_id || null : null,
      title: dataToCopy.title,
      content: dataToCopy.content,
      description: dataToCopy.description,
      tags: dataToCopy.tags,
      version: '1.0.0',
      user_id: userId,
      created_by: userId,
      is_public: false,
      cover_img: dataToCopy.cover_img,
      created_at: timestamp,
      updated_at: timestamp,
    }

    const { data: newPrompt, error: insertError } = await supabase
      .from('prompts')
      .insert([insertPayload])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      message: 'Prompt copied successfully',
      prompt: newPrompt,
    })
  } catch (error) {
    return handleApiError(error, 'Unable to copy prompt')
  }
}
