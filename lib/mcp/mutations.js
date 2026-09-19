import { and, eq } from 'drizzle-orm'
import { prompts } from '@/drizzle/schema/index.js'
import { ApiError } from '@/lib/api-error.js'
import { db as defaultDb } from '@/lib/db.js'
import {
  createChangeRequest,
  createPromptDirect,
  ensureLineage,
  isTeamApprovalEnabled,
} from '@/lib/prompt-workflow.js'
import { prepareSkillVersion } from '@/lib/skill-version.js'
import { TEAM_ROLES } from '@/lib/team-service.js'
import {
  formatPromptDetail,
  getMcpPromptMembership,
  isMcpPromptCreator,
  loadMcpPromptForAccess,
  resolveMcpWorkspace,
} from './prompts.js'

function normalizeOptionalText(value) {
  if (value === undefined || value === null) {
    return undefined
  }
  return String(value)
}

function normalizeRequiredText(value, message) {
  const text = String(value || '').trim()
  if (!text) {
    throw new ApiError(400, message)
  }
  return text
}

function isTeamManager(membership) {
  return Boolean(membership && [TEAM_ROLES.ADMIN, TEAM_ROLES.OWNER].includes(membership.role))
}

function resolveWriteTeamId(workspace) {
  return workspace.mode === 'team' ? workspace.teamId : null
}

function formatChangeRequest(changeRequest, title) {
  return {
    id: changeRequest.id,
    status: changeRequest.status,
    request_type: changeRequest.request_type,
    title: changeRequest.proposed_title || title,
  }
}

function assertCanUpdatePrompt(prompt, userId, membership, approvalEnabled) {
  if (isMcpPromptCreator(prompt, userId) || isTeamManager(membership)) {
    return
  }

  if (approvalEnabled && prompt.skill_package) {
    return
  }

  throw new ApiError(403, 'Only the creator or team managers can update this prompt')
}

function assertCanDeletePrompt(prompt, userId, membership) {
  if (isMcpPromptCreator(prompt, userId) || isTeamManager(membership)) {
    return
  }

  throw new ApiError(403, 'Only the creator or team managers can delete this prompt')
}

export async function createMcpPrompt(userId, {
  title,
  content,
  description,
  tags,
  version,
  teamId = null,
  db = defaultDb,
} = {}) {
  const nextTitle = normalizeRequiredText(title, 'Title is required')
  const nextContent = normalizeRequiredText(content, 'Content is required')
  const workspace = await resolveMcpWorkspace(db, userId, teamId || null)
  const writeTeamId = resolveWriteTeamId(workspace)
  const data = {
    title: nextTitle,
    content: nextContent,
    description: normalizeOptionalText(description) ?? null,
    tags: normalizeOptionalText(tags) ?? null,
    version: normalizeOptionalText(version) ?? null,
  }

  if (writeTeamId && await isTeamApprovalEnabled(db, writeTeamId)) {
    const lineageId = await ensureLineage(db, {
      teamId: writeTeamId,
      title: nextTitle,
      userId,
    })
    const changeRequest = await createChangeRequest(db, {
      teamId: writeTeamId,
      lineageId,
      requestType: 'create_prompt',
      submitterUserId: userId,
      proposal: data,
    })

    return {
      mode: 'approval_required',
      change_request: formatChangeRequest(changeRequest, nextTitle),
      hint: 'This team requires approval. The prompt will appear after a manager approves the request.',
    }
  }

  const prompt = await createPromptDirect(db, {
    teamId: writeTeamId,
    userId,
    data,
  })

  return {
    mode: 'created',
    prompt: formatPromptDetail(prompt),
  }
}

export async function updateMcpPrompt(userId, {
  id,
  teamId = null,
  title,
  content,
  description,
  tags,
  version,
  db = defaultDb,
} = {}) {
  const payload = {}
  if (title !== undefined) payload.title = normalizeRequiredText(title, 'Title is required')
  if (content !== undefined) payload.content = normalizeRequiredText(content, 'Content is required')
  if (description !== undefined) payload.description = normalizeOptionalText(description)
  if (tags !== undefined) payload.tags = normalizeOptionalText(tags)
  if (version !== undefined) payload.version = normalizeOptionalText(version)

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'At least one field to update is required')
  }

  const { prompt, workspace } = await loadMcpPromptForAccess(userId, { id, teamId, db })
  const membership = getMcpPromptMembership(workspace, prompt)
  const approvalEnabled = Boolean(prompt.team_id && await isTeamApprovalEnabled(db, prompt.team_id))

  assertCanUpdatePrompt(prompt, userId, membership, approvalEnabled)

  const proposal = await prepareSkillVersion(db, payload, prompt, {
    teamId: prompt.team_id,
    userId,
  })

  if (approvalEnabled) {
    const changeRequest = await createChangeRequest(db, {
      teamId: prompt.team_id,
      lineageId: prompt.lineage_id,
      basePromptId: prompt.id,
      requestType: 'create_version',
      submitterUserId: userId,
      proposal,
    })

    return {
      mode: 'approval_required',
      change_request: formatChangeRequest(changeRequest, proposal.title),
      hint: 'This team requires approval. The update will apply after a manager approves the request.',
    }
  }

  if (proposal.skill_package) {
    const published = await createPromptDirect(db, {
      teamId: prompt.team_id,
      userId,
      lineageId: prompt.lineage_id,
      data: { ...proposal, is_public: false },
    })

    return {
      mode: 'version_created',
      prompt: formatPromptDetail(published),
    }
  }

  const updateData = { updatedAt: new Date() }
  if (payload.title !== undefined) updateData.title = payload.title
  if (payload.content !== undefined) updateData.content = payload.content
  if (payload.description !== undefined) updateData.description = payload.description
  if (payload.tags !== undefined) updateData.tags = payload.tags
  if (payload.version !== undefined) updateData.version = payload.version

  const updateConditions = [eq(prompts.id, prompt.id)]
  if (prompt.team_id) {
    updateConditions.push(eq(prompts.teamId, prompt.team_id))
  }

  await db.update(prompts).set(updateData).where(and(...updateConditions))

  return {
    mode: 'updated',
    prompt: formatPromptDetail({
      ...prompt,
      title: updateData.title ?? prompt.title,
      content: updateData.content ?? prompt.content,
      description: payload.description !== undefined ? payload.description : prompt.description,
      tags: payload.tags !== undefined ? payload.tags : prompt.tags,
      version: payload.version !== undefined ? payload.version : prompt.version,
      updated_at: updateData.updatedAt,
    }),
  }
}

export async function deleteMcpPrompt(userId, {
  id,
  teamId = null,
  confirm = false,
  db = defaultDb,
} = {}) {
  if (confirm !== true && confirm !== 'true') {
    throw new ApiError(400, 'Set confirm=true to permanently delete this prompt')
  }

  const { prompt, workspace } = await loadMcpPromptForAccess(userId, { id, teamId, db })
  const membership = getMcpPromptMembership(workspace, prompt)
  assertCanDeletePrompt(prompt, userId, membership)

  const deleteConditions = [eq(prompts.id, prompt.id)]
  if (prompt.team_id) {
    deleteConditions.push(eq(prompts.teamId, prompt.team_id))
  }

  await db.delete(prompts).where(and(...deleteConditions))

  return {
    mode: 'deleted',
    id: prompt.id,
    title: prompt.title,
  }
}
