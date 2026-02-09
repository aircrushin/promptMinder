import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { resolveTeamContext } from '@/lib/team-request.js';
import { TEAM_ROLES } from '@/lib/team-service.js';
import { queries } from '@/lib/db/index.js';

async function getPromptId(paramsPromise) {
  const { id } = await paramsPromise;
  if (!id) {
    throw new Error('Prompt id missing in route params');
  }
  return id;
}

function isCreator(prompt, userId) {
  return prompt.createdBy === userId || prompt.userId === userId;
}

function ensureManagerPermission(membership) {
  return membership && [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership.role);
}

export async function GET(request, { params }) {
  try {
    const id = await getPromptId(params);
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    });

    let membership = null;
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId);
    }

    const prompt = await queries.prompts.getById(id, { teamId, userId });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    return handleApiError(error, 'Unable to load prompt');
  }
}

export async function POST(request, { params }) {
  try {
    const id = await getPromptId(params);
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    });

    let membership = null;
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId);
    }

    const prompt = await queries.prompts.getById(id, { teamId, userId });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    if (!isCreator(prompt, userId) && !ensureManagerPermission(membership)) {
      return NextResponse.json({ error: 'Only the creator or team managers can update this prompt' }, { status: 403 });
    }

    const payload = await request.json();

    const updateData = {};

    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.content !== undefined) updateData.content = payload.content;
    if (payload.description !== undefined) updateData.description = payload.description;
    if (payload.is_public !== undefined) updateData.isPublic = payload.is_public;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.image_url !== undefined || payload.cover_img !== undefined) {
      updateData.coverImg = payload.cover_img ?? payload.image_url;
    }
    if (payload.version !== undefined) updateData.version = payload.version;
    if (payload.projectId !== undefined) updateData.projectId = payload.projectId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No changes supplied' });
    }

    const updated = await queries.prompts.update(id, updateData, { teamId: prompt.teamId });

    return NextResponse.json({ message: 'Prompt updated successfully', prompt: updated });
  } catch (error) {
    return handleApiError(error, 'Unable to update prompt');
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = await getPromptId(params);
    const userId = await requireUserId();
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    });

    let membership = null;
    if (teamId) {
      membership = await teamService.requireMembership(teamId, userId);
    }

    const prompt = await queries.prompts.getById(id, { teamId, userId });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const canDelete = isCreator(prompt, userId) || ensureManagerPermission(membership);
    if (!canDelete) {
      return NextResponse.json({ error: 'Only the creator or team managers can delete this prompt' }, { status: 403 });
    }

    await queries.prompts.delete(id, { teamId: prompt.teamId });

    return NextResponse.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    return handleApiError(error, 'Unable to delete prompt');
  }
}
