import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { resolveTeamContext } from '@/lib/team-request.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { queries } from '@/lib/db/index.js';

export async function POST(request) {
  try {
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    });

    let targetTeamId = null;
    if (teamId) {
      await teamService.requireMembership(teamId, userId);
      targetTeamId = teamId;
    }

    const { sourceId, promptData } = await request.json();

    if (!sourceId && !promptData) {
      return NextResponse.json({ error: 'Invalid request: Missing sourceId or promptData' }, { status: 400 });
    }

    let dataToCopy = null;

    if (promptData) {
      dataToCopy = {
        title: promptData.role,
        content: promptData.prompt,
        description: `${promptData.category}`,
        tags: promptData.category || null,
        coverImg: null,
      };
    } else if (sourceId) {
      let sourcePrompt = null;

      if (teamId) {
        sourcePrompt = await queries.prompts.getById(sourceId, { teamId });
      }

      if (!sourcePrompt) {
        sourcePrompt = await queries.prompts.getById(sourceId);

        if (!sourcePrompt || !sourcePrompt.isPublic) {
          return NextResponse.json({ error: 'Prompt not found or unavailable' }, { status: 404 });
        }

        if (sourcePrompt.userId === userId) {
          return NextResponse.json({ error: 'Cannot copy your own public prompt' }, { status: 400 });
        }
      }

      dataToCopy = {
        title: sourcePrompt.title,
        content: sourcePrompt.content,
        description: sourcePrompt.description,
        tags: sourcePrompt.tags,
        coverImg: sourcePrompt.coverImg,
        projectId: sourcePrompt.projectId,
      };
    }

    const newPrompt = await queries.prompts.create({
      teamId: targetTeamId,
      projectId: targetTeamId ? dataToCopy.projectId || null : null,
      title: dataToCopy.title,
      content: dataToCopy.content,
      description: dataToCopy.description,
      tags: dataToCopy.tags,
      version: '1.0.0',
      userId: userId,
      createdBy: userId,
      isPublic: false,
      coverImg: dataToCopy.coverImg,
    });

    return NextResponse.json({
      message: 'Prompt copied successfully',
      prompt: newPrompt,
    });
  } catch (error) {
    return handleApiError(error, 'Unable to copy prompt');
  }
}
