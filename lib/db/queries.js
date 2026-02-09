import { eq, and, or, desc, asc, like, ilike, inArray, isNull, sql, count, gte, lte } from 'drizzle-orm';
import { getDb, schema } from './client.js';
import { ApiError } from '../api-error.js';

const {
  teams, teamMembers, prompts, publicPrompts, tags, favorites, likes,
  promptVersions, contributions, providerKeys, feedback,
} = schema;

// ==================== Helper Functions ====================
function createApiError(message, status, originalError) {
  console.error(`[DB Error] ${message}:`, originalError);
  return new ApiError(status, message, originalError?.message);
}

// ==================== Prompts Queries ====================
export const promptQueries = {
  // 获取所有提示词（带分页和过滤）
  async getAll({ teamId, userId, tag, search, page = 1, limit = 10 } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    
    try {
      let conditions = [];
      
      if (teamId) {
        conditions.push(eq(prompts.teamId, teamId));
      } else {
        conditions.push(or(
          eq(prompts.createdBy, userId),
          eq(prompts.userId, userId)
        ));
      }
      
      if (tag) {
        conditions.push(ilike(prompts.tags, `%${tag}%`));
      }
      
      if (search) {
        conditions.push(or(
          ilike(prompts.title, `%${search}%`),
          ilike(prompts.description, `%${search}%`)
        ));
      }
      
      const whereClause = conditions.length > 1 
        ? and(...conditions) 
        : conditions[0];
      
      const [data, totalResult] = await Promise.all([
        db.query.prompts.findMany({
          where: whereClause,
          orderBy: [desc(prompts.createdAt)],
          limit,
          offset,
        }),
        db.select({ count: count() }).from(prompts).where(whereClause),
      ]);
      
      return {
        prompts: data,
        pagination: {
          page,
          limit,
          total: Number(totalResult[0]?.count || 0),
          totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
        },
      };
    } catch (error) {
      throw createApiError('Failed to fetch prompts', 500, error);
    }
  },

  // 根据ID获取提示词
  async getById(id, { teamId, userId } = {}) {
    const db = getDb();
    
    try {
      let conditions = [eq(prompts.id, id)];
      
      if (teamId) {
        conditions.push(eq(prompts.teamId, teamId));
      } else if (userId) {
        conditions.push(or(
          eq(prompts.createdBy, userId),
          eq(prompts.userId, userId)
        ));
      }
      
      const whereClause = conditions.length > 1 
        ? and(...conditions) 
        : conditions[0];
      
      const result = await db.query.prompts.findFirst({
        where: whereClause,
      });
      
      return result;
    } catch (error) {
      throw createApiError('Failed to fetch prompt', 500, error);
    }
  },

  // 创建提示词
  async create(data) {
    const db = getDb();
    
    try {
      const result = await db.insert(prompts).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return result[0];
    } catch (error) {
      throw createApiError('Failed to create prompt', 500, error);
    }
  },

  // 更新提示词
  async update(id, data, { teamId } = {}) {
    const db = getDb();
    
    try {
      let conditions = [eq(prompts.id, id)];
      
      if (teamId) {
        conditions.push(eq(prompts.teamId, teamId));
      }
      
      const whereClause = conditions.length > 1 
        ? and(...conditions) 
        : conditions[0];
      
      const result = await db.update(prompts)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(whereClause)
        .returning();
      
      return result[0];
    } catch (error) {
      throw createApiError('Failed to update prompt', 500, error);
    }
  },

  // 删除提示词
  async delete(id, { teamId } = {}) {
    const db = getDb();
    
    try {
      let conditions = [eq(prompts.id, id)];
      
      if (teamId) {
        conditions.push(eq(prompts.teamId, teamId));
      }
      
      const whereClause = conditions.length > 1 
        ? and(...conditions) 
        : conditions[0];
      
      await db.delete(prompts).where(whereClause);
      
      return { success: true };
    } catch (error) {
      throw createApiError('Failed to delete prompt', 500, error);
    }
  },

  // 获取用户的提示词数量
  async countByUser(userId) {
    const db = getDb();
    
    try {
      const result = await db.select({ count: count() })
        .from(prompts)
        .where(eq(prompts.createdBy, userId));
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      throw createApiError('Failed to count prompts', 500, error);
    }
  },
};

// ==================== Team Queries ====================
export const teamQueries = {
  // 获取所有团队
  async getAll() {
    const db = getDb();
    return await db.query.teams.findMany({
      orderBy: [desc(teams.createdAt)],
    });
  },

  // 根据ID获取团队
  async getById(id) {
    const db = getDb();
    return await db.query.teams.findFirst({
      where: eq(teams.id, id),
    });
  },

  // 获取用户的个人团队
  async getPersonalTeam(userId) {
    const db = getDb();
    return await db.query.teams.findFirst({
      where: and(
        eq(teams.ownerId, userId),
        eq(teams.isPersonal, true)
      ),
    });
  },

  // 检查用户是否已有个人团队
  async hasPersonalTeam(userId) {
    const db = getDb();
    const result = await db.select({ count: count() })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.isPersonal, true)
      ));
    return Number(result[0]?.count || 0) > 0;
  },

  // 统计用户的非个人团队数量
  async countNonPersonalTeams(userId) {
    const db = getDb();
    const result = await db.select({ count: count() })
      .from(teams)
      .where(and(
        eq(teams.ownerId, userId),
        eq(teams.isPersonal, false)
      ));
    return Number(result[0]?.count || 0);
  },

  // 创建团队
  async create(data) {
    const db = getDb();
    const result = await db.insert(teams).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新团队
  async update(id, data) {
    const db = getDb();
    const result = await db.update(teams)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  },

  // 删除团队
  async delete(id) {
    const db = getDb();
    await db.delete(teams).where(eq(teams.id, id));
    return { success: true };
  },
};

// ==================== Team Member Queries ====================
export const teamMemberQueries = {
  // 获取团队成员
  async getByTeamId(teamId) {
    const db = getDb();
    return await db.query.teamMembers.findMany({
      where: eq(teamMembers.teamId, teamId),
    });
  },

  // 获取用户的团队成员身份
  async getMembership(teamId, userId) {
    const db = getDb();
    return await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ),
    });
  },

  // 获取用户的所有团队会员
  async getByUserId(userId, { includePending = false } = {}) {
    const db = getDb();
    
    const statuses = includePending 
      ? ['active', 'pending'] 
      : ['active'];
    
    return await db.query.teamMembers.findMany({
      where: and(
        eq(teamMembers.userId, userId),
        inArray(teamMembers.status, statuses)
      ),
      with: {
        team: true,
      },
      orderBy: [asc(teamMembers.createdAt)],
    });
  },

  // 创建团队成员
  async create(data) {
    const db = getDb();
    const result = await db.insert(teamMembers).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新团队成员
  async update(id, data) {
    const db = getDb();
    const result = await db.update(teamMembers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, id))
      .returning();
    return result[0];
  },

  // 根据用户ID和团队ID更新
  async updateByUserAndTeam(teamId, userId, data) {
    const db = getDb();
    const result = await db.update(teamMembers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .returning();
    return result[0];
  },

  // 根据email获取待处理的邀请
  async getPendingByEmail(teamId, email) {
    const db = getDb();
    return await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.email, email.toLowerCase().trim()),
        eq(teamMembers.status, 'pending')
      ),
    });
  },
};

// ==================== Tags Queries ====================
export const tagQueries = {
  // 获取所有标签
  async getAll({ userId } = {}) {
    const db = getDb();
    
    if (userId) {
      return await db.query.tags.findMany({
        where: or(
          isNull(tags.userId),
          eq(tags.userId, userId)
        ),
        orderBy: [asc(tags.name)],
      });
    }
    
    return await db.query.tags.findMany({
      orderBy: [asc(tags.name)],
    });
  },

  // 根据ID获取标签
  async getById(id) {
    const db = getDb();
    return await db.query.tags.findFirst({
      where: eq(tags.id, id),
    });
  },

  // 创建标签
  async create(data) {
    const db = getDb();
    const result = await db.insert(tags).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新标签
  async update(id, data) {
    const db = getDb();
    const result = await db.update(tags)
      .set(data)
      .where(eq(tags.id, id))
      .returning();
    return result[0];
  },

  // 删除标签
  async delete(id) {
    const db = getDb();
    await db.delete(tags).where(eq(tags.id, id));
    return { success: true };
  },
};

// ==================== Favorites Queries ====================
export const favoriteQueries = {
  // 获取用户的收藏
  async getByUser(userId, { page = 1, limit = 10 } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    
    const [data, totalResult] = await Promise.all([
      db.query.favorites.findMany({
        where: eq(favorites.userId, userId),
        with: {
          prompt: true,
        },
        orderBy: [desc(favorites.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() })
        .from(favorites)
        .where(eq(favorites.userId, userId)),
    ]);
    
    return {
      favorites: data.map(f => f.prompt).filter(Boolean),
      pagination: {
        page,
        limit,
        total: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  },

  // 检查是否已收藏
  async isFavorited(userId, promptId) {
    const db = getDb();
    const result = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, userId),
        eq(favorites.promptId, promptId)
      ),
    });
    return !!result;
  },

  // 批量检查收藏状态
  async checkFavorites(userId, promptIds) {
    const db = getDb();
    
    if (!promptIds || promptIds.length === 0) {
      return {};
    }
    
    const result = await db.query.favorites.findMany({
      where: and(
        eq(favorites.userId, userId),
        inArray(favorites.promptId, promptIds)
      ),
    });
    
    const favoritesMap = {};
    promptIds.forEach(id => {
      favoritesMap[id] = result.some(f => f.promptId === id);
    });
    
    return favoritesMap;
  },

  // 添加收藏
  async create(userId, promptId) {
    const db = getDb();
    try {
      const result = await db.insert(favorites).values({
        userId,
        promptId,
        createdAt: new Date(),
      }).returning();
      return result[0];
    } catch (error) {
      // 如果已存在，忽略错误
      if (error.message?.includes('unique')) {
        return null;
      }
      throw error;
    }
  },

  // 删除收藏
  async delete(userId, promptId) {
    const db = getDb();
    await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.promptId, promptId)
      ));
    return { success: true };
  },
};

// ==================== Likes Queries ====================
export const likeQueries = {
  // 检查是否已点赞
  async isLiked(userId, promptId) {
    const db = getDb();
    const result = await db.query.likes.findFirst({
      where: and(
        eq(likes.userId, userId),
        eq(likes.promptId, promptId)
      ),
    });
    return !!result;
  },

  // 添加点赞
  async create(userId, promptId) {
    const db = getDb();
    try {
      const result = await db.insert(likes).values({
        userId,
        promptId,
        createdAt: new Date(),
      }).returning();
      
      // 更新提示词的点赞数
      await db.update(prompts)
        .set({
          likes: sql`${prompts.likes} + 1`,
        })
        .where(eq(prompts.id, promptId));
      
      return result[0];
    } catch (error) {
      if (error.message?.includes('unique')) {
        return null;
      }
      throw error;
    }
  },

  // 删除点赞
  async delete(userId, promptId) {
    const db = getDb();
    
    await db.delete(likes)
      .where(and(
        eq(likes.userId, userId),
        eq(likes.promptId, promptId)
      ));
    
    // 更新提示词的点赞数
    await db.update(prompts)
      .set({
        likes: sql`${prompts.likes} - 1`,
      })
      .where(eq(prompts.id, promptId));
    
    return { success: true };
  },
};

// ==================== Public Prompts Queries ====================
export const publicPromptQueries = {
  // 获取所有公开提示词
  async getAll({ page = 1, limit = 10, category, search } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    
    let conditions = [];
    
    if (category) {
      conditions.push(eq(publicPrompts.category, category));
    }
    
    if (search) {
      conditions.push(or(
        ilike(publicPrompts.title, `%${search}%`),
        ilike(publicPrompts.description, `%${search}%`)
      ));
    }
    
    const whereClause = conditions.length > 1 
      ? and(...conditions) 
      : conditions[0];
    
    const [data, totalResult] = await Promise.all([
      db.query.publicPrompts.findMany({
        where: whereClause,
        orderBy: [desc(publicPrompts.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() })
        .from(publicPrompts)
        .where(whereClause),
    ]);
    
    return {
      prompts: data,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  },

  // 根据ID获取公开提示词
  async getById(id) {
    const db = getDb();
    return await db.query.publicPrompts.findFirst({
      where: eq(publicPrompts.id, id),
    });
  },

  // 创建公开提示词
  async create(data) {
    const db = getDb();
    const result = await db.insert(publicPrompts).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新公开提示词
  async update(id, data) {
    const db = getDb();
    const result = await db.update(publicPrompts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(publicPrompts.id, id))
      .returning();
    return result[0];
  },

  // 删除公开提示词
  async delete(id) {
    const db = getDb();
    await db.delete(publicPrompts).where(eq(publicPrompts.id, id));
    return { success: true };
  },
};

// ==================== Contributions Queries ====================
export const contributionQueries = {
  // 获取所有贡献
  async getAll({ page = 1, limit = 10, status } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    if (status) {
      whereClause = eq(contributions.status, status);
    }
    
    const [data, totalResult] = await Promise.all([
      db.query.contributions.findMany({
        where: whereClause,
        orderBy: [desc(contributions.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() })
        .from(contributions)
        .where(whereClause),
    ]);
    
    return {
      contributions: data,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  },

  // 获取用户的贡献
  async getByUser(userId) {
    const db = getDb();
    return await db.query.contributions.findMany({
      where: eq(contributions.userId, userId),
      orderBy: [desc(contributions.createdAt)],
    });
  },

  // 根据ID获取贡献
  async getById(id) {
    const db = getDb();
    return await db.query.contributions.findFirst({
      where: eq(contributions.id, id),
    });
  },

  // 创建贡献
  async create(data) {
    const db = getDb();
    const result = await db.insert(contributions).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新贡献
  async update(id, data) {
    const db = getDb();
    const result = await db.update(contributions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(contributions.id, id))
      .returning();
    return result[0];
  },

  // 删除贡献
  async delete(id) {
    const db = getDb();
    await db.delete(contributions).where(eq(contributions.id, id));
    return { success: true };
  },
};

// ==================== Provider Keys Queries ====================
export const providerKeyQueries = {
  // 获取用户的API密钥
  async getByUser(userId) {
    const db = getDb();
    return await db.query.providerKeys.findMany({
      where: eq(providerKeys.userId, userId),
      orderBy: [desc(providerKeys.createdAt)],
    });
  },

  // 根据provider获取密钥
  async getByProvider(userId, provider) {
    const db = getDb();
    return await db.query.providerKeys.findFirst({
      where: and(
        eq(providerKeys.userId, userId),
        eq(providerKeys.provider, provider)
      ),
    });
  },

  // 创建或更新密钥
  async upsert(userId, provider, apiKey) {
    const db = getDb();
    
    const existing = await this.getByProvider(userId, provider);
    
    if (existing) {
      const result = await db.update(providerKeys)
        .set({
          apiKey,
          updatedAt: new Date(),
        })
        .where(eq(providerKeys.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(providerKeys).values({
      userId,
      provider,
      apiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 删除密钥
  async delete(id) {
    const db = getDb();
    await db.delete(providerKeys).where(eq(providerKeys.id, id));
    return { success: true };
  },
};

// ==================== Feedback Queries ====================
export const feedbackQueries = {
  // 获取所有反馈
  async getAll({ page = 1, limit = 10, isResolved } = {}) {
    const db = getDb();
    const offset = (page - 1) * limit;
    
    let whereClause = undefined;
    if (isResolved !== undefined) {
      whereClause = eq(feedback.isResolved, isResolved);
    }
    
    const [data, totalResult] = await Promise.all([
      db.query.feedback.findMany({
        where: whereClause,
        orderBy: [desc(feedback.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: count() })
        .from(feedback)
        .where(whereClause),
    ]);
    
    return {
      feedback: data,
      pagination: {
        page,
        limit,
        total: Number(totalResult[0]?.count || 0),
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
      },
    };
  },

  // 创建反馈
  async create(data) {
    const db = getDb();
    const result = await db.insert(feedback).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  },

  // 更新反馈（标记为已解决）
  async resolve(id, resolvedBy) {
    const db = getDb();
    const result = await db.update(feedback)
      .set({
        isResolved: true,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(feedback.id, id))
      .returning();
    return result[0];
  },
};

// ==================== Prompt Versions Queries ====================
export const promptVersionQueries = {
  // 获取提示词的所有版本
  async getByPromptId(promptId) {
    const db = getDb();
    return await db.query.promptVersions.findMany({
      where: eq(promptVersions.promptId, promptId),
      orderBy: [desc(promptVersions.createdAt)],
    });
  },

  // 创建版本
  async create(data) {
    const db = getDb();
    const result = await db.insert(promptVersions).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  },
};

// 导出所有查询
export const queries = {
  prompts: promptQueries,
  teams: teamQueries,
  teamMembers: teamMemberQueries,
  tags: tagQueries,
  favorites: favoriteQueries,
  likes: likeQueries,
  publicPrompts: publicPromptQueries,
  contributions: contributionQueries,
  providerKeys: providerKeyQueries,
  feedback: feedbackQueries,
  promptVersions: promptVersionQueries,
};
