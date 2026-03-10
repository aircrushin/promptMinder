import { NextResponse } from 'next/server'
import { db } from '@/lib/db.js'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'
import { ApiError } from '@/lib/api-error.js'
import { eq, asc, and, inArray, or, ilike, isNull } from 'drizzle-orm'
import { tags, publicTags, prompts } from '@/drizzle/schema/index.js'
import { toSnakeCase } from '@/lib/case-utils.js'

function assertTagName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new ApiError(400, 'Tag name is required')
  }
}

function parsePromptTagList(tagsValue) {
  if (typeof tagsValue !== 'string' || !tagsValue.trim()) {
    return []
  }

  return tagsValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function serializePromptTagList(tagList) {
  return tagList.join(',')
}

function hasTagListChanged(currentList, nextList) {
  if (currentList.length !== nextList.length) {
    return true
  }

  for (let i = 0; i < currentList.length; i += 1) {
    if (currentList[i] !== nextList[i]) {
      return true
    }
  }

  return false
}

function dedupeTagList(tagList) {
  const seen = new Set()
  const deduped = []

  for (const tagName of tagList) {
    const normalized = tagName.toLowerCase()
    if (seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    deduped.push(tagName)
  }

  return deduped
}

function buildPromptScopeConditionForUser(userId) {
  return and(
    isNull(prompts.teamId),
    or(eq(prompts.createdBy, userId), eq(prompts.userId, userId))
  )
}

function buildPromptScopeCondition({ teamId, userId }) {
  if (teamId) {
    return eq(prompts.teamId, teamId)
  }

  return buildPromptScopeConditionForUser(userId)
}

async function replaceTagNameInPrompts(scopeCondition, oldTagName, newTagName) {
  const oldNameNormalized = oldTagName.toLowerCase()
  const candidatePrompts = await db
    .select({ id: prompts.id, tags: prompts.tags })
    .from(prompts)
    .where(and(scopeCondition, ilike(prompts.tags, `%${oldTagName}%`)))

  let updatedCount = 0

  for (const prompt of candidatePrompts) {
    const currentTags = parsePromptTagList(prompt.tags)
    if (currentTags.length === 0) {
      continue
    }

    const replacedTags = currentTags.map((item) =>
      item.toLowerCase() === oldNameNormalized ? newTagName : item
    )
    const nextTags = dedupeTagList(replacedTags)

    if (!hasTagListChanged(currentTags, nextTags)) {
      continue
    }

    await db
      .update(prompts)
      .set({
        tags: serializePromptTagList(nextTags),
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, prompt.id))
    updatedCount += 1
  }

  return updatedCount
}

async function removeTagNamesFromPrompts(scopeCondition, namesToRemove) {
  const normalizedNames = namesToRemove
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter(Boolean)
    .map((name) => name.toLowerCase())

  if (normalizedNames.length === 0) {
    return 0
  }

  const likeConditions = normalizedNames.map((name) => ilike(prompts.tags, `%${name}%`))
  const promptMatchCondition = likeConditions.length === 1 ? likeConditions[0] : or(...likeConditions)

  const candidatePrompts = await db
    .select({ id: prompts.id, tags: prompts.tags })
    .from(prompts)
    .where(and(scopeCondition, promptMatchCondition))

  const removeSet = new Set(normalizedNames)
  let updatedCount = 0

  for (const prompt of candidatePrompts) {
    const currentTags = parsePromptTagList(prompt.tags)
    if (currentTags.length === 0) {
      continue
    }

    const nextTags = currentTags.filter((item) => !removeSet.has(item.toLowerCase()))

    if (!hasTagListChanged(currentTags, nextTags)) {
      continue
    }

    await db
      .update(prompts)
      .set({
        tags: nextTags.length > 0 ? serializePromptTagList(nextTags) : null,
        updatedAt: new Date(),
      })
      .where(eq(prompts.id, prompt.id))
    updatedCount += 1
  }

  return updatedCount
}

function ensureTagMutationAllowed({ tag, userId, requestedTeamId }) {
  if (!tag) {
    throw new ApiError(404, 'Tag not found')
  }

  if (tag.teamId) {
    if (requestedTeamId && requestedTeamId !== tag.teamId) {
      throw new ApiError(403, 'You do not have permission to modify this tag')
    }
    return { scopeTeamId: tag.teamId }
  }

  if (tag.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to modify this tag')
  }

  return { scopeTeamId: null }
}

export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const includePublic = searchParams.get('includePublic') !== 'false'

    let teamRows = []
    let personalRows = []
    let publicRows = []

    if (teamId) {
      // 获取团队标签（teamId 不为 null，userId 为 null）
      teamRows = await db.select().from(tags)
        .where(eq(tags.teamId, teamId))
        .orderBy(asc(tags.name))
    } else {
      // 获取个人标签（teamId 为 null，userId 为当前用户）
      personalRows = await db.select().from(tags)
        .where(eq(tags.userId, userId))
        .orderBy(asc(tags.name))
    }

    // 获取公共标签
    if (includePublic) {
      publicRows = await db.select().from(publicTags)
        .where(eq(publicTags.isActive, true))
        .orderBy(asc(publicTags.sortOrder), asc(publicTags.name))
    }

    // 返回结构化的响应
    return NextResponse.json({
      team: teamRows.map(toSnakeCase),
      personal: personalRows.map(toSnakeCase),
      public: publicRows.map(toSnakeCase),
    })
  } catch (error) {
    return handleApiError(error, 'Unable to fetch tags', 'TAG_FETCH_FAILED')
  }
}

export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const { name, scope } = await request.json()

    assertTagName(name)

    if (scope === 'team' && !teamId) {
      throw new ApiError(400, 'Team ID is required for team tags')
    }

    const createInTeamScope = scope === 'team' || Boolean(teamId)
    const result = await db.insert(tags).values({
      name: name.trim(),
      teamId: createInTeamScope ? teamId : null,
      userId: createInTeamScope ? null : userId,
      createdBy: userId,
    }).returning()

    return NextResponse.json(toSnakeCase(result[0]), { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create tag', 'TAG_CREATE_FAILED')
  }
}

export async function DELETE(request) {
  try {
    const userId = await requireUserId()
    const { teamId: requestedTeamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })
    if (requestedTeamId) {
      await teamService.requireMembership(requestedTeamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')
    const idsParam = searchParams.get('ids')

    // 批量删除
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)

      if (ids.length === 0) {
        throw new ApiError(400, 'Tag IDs are required')
      }

      const rows = await db.select().from(tags).where(inArray(tags.id, ids))
      const existingTagIds = new Set(rows.map((tag) => tag.id))
      const missingIds = ids.filter((id) => !existingTagIds.has(id))
      if (missingIds.length > 0) {
        throw new ApiError(404, 'Some tags do not exist')
      }

      const invalidIds = rows
        .filter((tag) => {
          if (requestedTeamId) {
            return tag.teamId !== requestedTeamId
          }
          return tag.userId !== userId || Boolean(tag.teamId)
        })
        .map((tag) => tag.id)
      if (invalidIds.length > 0) {
        throw new ApiError(403, 'Some tags do not exist or cannot be deleted')
      }

      const scopeCondition = buildPromptScopeCondition({
        teamId: requestedTeamId,
        userId,
      })
      const removedNames = rows.map((tag) => tag.name)
      await removeTagNamesFromPrompts(scopeCondition, removedNames)

      // 执行批量删除
      if (requestedTeamId) {
        await db.delete(tags).where(and(eq(tags.teamId, requestedTeamId), inArray(tags.id, ids)))
      } else {
        await db.delete(tags).where(and(eq(tags.userId, userId), inArray(tags.id, ids)))
      }

      return NextResponse.json({ success: true, deletedCount: ids.length })
    }

    // 单个删除
    if (!tagId) {
      throw new ApiError(400, 'Tag ID is required')
    }

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]
    const { scopeTeamId } = ensureTagMutationAllowed({
      tag,
      userId,
      requestedTeamId,
    })
    if (scopeTeamId) {
      await teamService.requireMembership(scopeTeamId, userId)
    }

    const scopeCondition = buildPromptScopeCondition({
      teamId: scopeTeamId,
      userId,
    })
    await removeTagNamesFromPrompts(scopeCondition, [tag.name])

    await db.delete(tags).where(eq(tags.id, tagId))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete tag', 'TAG_DELETE_FAILED')
  }
}

export async function PATCH(request) {
  try {
    const userId = await requireUserId()
    const { teamId: requestedTeamId, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true,
    })
    if (requestedTeamId) {
      await teamService.requireMembership(requestedTeamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('id')
    const { name } = await request.json()

    if (!tagId) {
      throw new ApiError(400, 'Tag ID is required')
    }

    assertTagName(name)

    const rows = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1)
    const tag = rows[0]
    const { scopeTeamId } = ensureTagMutationAllowed({
      tag,
      userId,
      requestedTeamId,
    })
    if (scopeTeamId) {
      await teamService.requireMembership(scopeTeamId, userId)
    }

    const nextName = name.trim()
    const result = await db
      .update(tags)
      .set({ name: nextName, updatedAt: new Date() })
      .where(eq(tags.id, tagId))
      .returning()

    if (tag.name !== nextName) {
      const scopeCondition = buildPromptScopeCondition({
        teamId: scopeTeamId,
        userId,
      })
      await replaceTagNameInPrompts(scopeCondition, tag.name, nextName)
    }

    return NextResponse.json(toSnakeCase(result[0]))
  } catch (error) {
    return handleApiError(error, 'Unable to update tag', 'TAG_UPDATE_FAILED')
  }
}
