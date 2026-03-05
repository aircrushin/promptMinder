import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { eq, and } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index.js'
import { createChangeRequest, createPromptDirect, ensureLineage, isTeamApprovalEnabled } from '@/lib/prompt-workflow.js'

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, db, teamService } = await resolveTeamContext(request, userId, {
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

    let dataToCopy = null

    if (promptData) {
      dataToCopy = {
        title: promptData.role,
        content: promptData.prompt,
        description: `${promptData.category}`,
        tags: promptData.category || null,
        coverImg: null,
      }
    } else if (sourceId) {
      let sourcePrompt = null

      if (teamId) {
        const rows = await db.select().from(prompts)
          .where(and(eq(prompts.id, sourceId), eq(prompts.teamId, teamId)))
          .limit(1)
        sourcePrompt = rows[0] || null
      }

      if (!sourcePrompt) {
        const rows = await db.select().from(prompts)
          .where(and(eq(prompts.id, sourceId), eq(prompts.isPublic, true)))
          .limit(1)

        if (!rows[0]) {
          return NextResponse.json({ error: 'Prompt not found or unavailable' }, { status: 404 })
        }

        if (rows[0].userId === userId) {
          return NextResponse.json({ error: 'Cannot copy your own public prompt' }, { status: 400 })
        }

        sourcePrompt = rows[0]
      }

      dataToCopy = {
        title: sourcePrompt.title,
        content: sourcePrompt.content,
        description: sourcePrompt.description,
        tags: sourcePrompt.tags,
        coverImg: sourcePrompt.coverImg,
        projectId: sourcePrompt.projectId,
      }
    }

    if (targetTeamId && (await isTeamApprovalEnabled(db, targetTeamId))) {
      const lineageId = await ensureLineage(db, {
        teamId: targetTeamId,
        title: dataToCopy.title,
        userId,
      })

      const changeRequest = await createChangeRequest(db, {
        teamId: targetTeamId,
        lineageId,
        requestType: 'create_prompt',
        submitterUserId: userId,
        proposal: {
          title: dataToCopy.title,
          content: dataToCopy.content,
          description: dataToCopy.description || null,
          tags: dataToCopy.tags || null,
          version: '1.0.0',
          projectId: dataToCopy.projectId || null,
        },
      })

      return NextResponse.json({
        mode: 'approval_required',
        change_request: changeRequest,
      }, { status: 201 })
    }

    const prompt = await createPromptDirect(db, {
      teamId: targetTeamId,
      userId,
      data: {
        title: dataToCopy.title,
        content: dataToCopy.content,
        description: dataToCopy.description,
        tags: dataToCopy.tags,
        version: '1.0.0',
        projectId: dataToCopy.projectId || null,
        is_public: false,
        cover_img: dataToCopy.coverImg,
      },
    })

    return NextResponse.json({
      message: 'Prompt copied successfully',
      prompt,
    })
  } catch (error) {
    return handleApiError(error, 'Unable to copy prompt')
  }
}
