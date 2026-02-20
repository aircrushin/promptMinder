class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

import { PERSONAL_TEAM_ID, TEAM_STORAGE_KEY } from '@/lib/team-storage.js'

export class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const hasExplicitTeam = Object.prototype.hasOwnProperty.call(options, 'teamId');

    let preferredTeamId;
    if (hasExplicitTeam) {
      preferredTeamId = options.teamId ?? null;
    } else {
      preferredTeamId = typeof window !== 'undefined'
        ? window.localStorage.getItem(TEAM_STORAGE_KEY)
        : null;
    }

    if (preferredTeamId === PERSONAL_TEAM_ID) {
      preferredTeamId = null
    }

    if (preferredTeamId && !config.headers['X-Team-Id']) {
      config.headers['X-Team-Id'] = preferredTeamId;
    }

    delete config.teamId;

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      let data = null;
      try {
        data = await response.json();
      } catch (jsonError) {
        // Ignore JSON parse error
      }
      if (!response.ok) {
        throw new ApiError(
          data?.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, { originalError: error });
    }
  }

  // Prompt API methods
  async getPrompts(params = {}, options = {}) {
    const { teamId } = options;
    const searchParams = new URLSearchParams(params);
    if (teamId) {
      searchParams.set('teamId', teamId);
    }
    const queryString = searchParams.toString();
    const endpoint = `/api/prompts${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint, { teamId });
  }

  async getPrompt(id, options = {}) {
    return this.request(`/api/prompts/${id}`, options);
  }

  async createPrompt(promptData, options = {}) {
    return this.request('/api/prompts', {
      method: 'POST',
      body: promptData,
      teamId: options.teamId,
    });
  }

  async updatePrompt(id, promptData, options = {}) {
    return this.request(`/api/prompts/${id}`, {
      method: 'POST',
      body: promptData,
      teamId: options.teamId,
    });
  }

  async deletePrompt(id, options = {}) {
    return this.request(`/api/prompts/${id}`, {
      method: 'DELETE',
      teamId: options.teamId,
    });
  }

  async sharePrompt(id, options = {}) {
    return this.request(`/api/prompts/share/${id}`, {
      method: 'POST',
      teamId: options.teamId,
    });
  }

  async copyPrompt(promptData, options = {}) {
    return this.request('/api/prompts/copy', {
      method: 'POST',
      body: { promptData },
      teamId: options.teamId,
    });
  }

  // Tags API methods
  async getTags(options = {}) {
    const { teamId } = options;
    const endpoint = teamId ? `/api/tags?teamId=${teamId}` : '/api/tags';
    return this.request(endpoint, { teamId });
  }

  async createTag(tagData, options = {}) {
    return this.request('/api/tags', {
      method: 'POST',
      body: tagData,
      teamId: options.teamId,
    });
  }

  async updateTag(id, tagData, options = {}) {
    return this.request(`/api/tags?id=${id}`, {
      method: 'PATCH',
      body: tagData,
      teamId: options.teamId,
    });
  }

  async deleteTag(id, options = {}) {
    return this.request(`/api/tags?id=${id}`, {
      method: 'DELETE',
      teamId: options.teamId,
    });
  }

  async deleteTags(ids, options = {}) {
    const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
    return this.request(`/api/tags?ids=${encodeURIComponent(idsParam)}`, {
      method: 'DELETE',
      teamId: options.teamId,
    });
  }

  // Favorites API methods
  async getFavorites(params = {}) {
    const searchParams = new URLSearchParams(params);
    const queryString = searchParams.toString();
    const endpoint = `/api/favorites${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async addFavorite(promptId) {
    return this.request('/api/favorites', {
      method: 'POST',
      body: { promptId },
    });
  }

  async removeFavorite(promptId) {
    return this.request(`/api/favorites?promptId=${promptId}`, {
      method: 'DELETE',
    });
  }

  async checkFavorites(promptIds) {
    if (!promptIds || promptIds.length === 0) {
      return { favorites: {} };
    }
    return this.request(`/api/favorites/check?promptIds=${promptIds.join(',')}`);
  }

  // Chat API methods (for streaming responses)
  async chat(messages, options = {}) {
    const url = `${this.baseURL}/api/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, ...options }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return response; // Return the response for streaming
  }

  // Generate API methods (for streaming responses)
  async generate(text) {
    const url = `${this.baseURL}/api/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return response; // Return the response for streaming
  }

  // Agent Conversation API methods
  async getAgentConversations(options = {}) {
    const { teamId, limit = 50, offset = 0 } = options;
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', String(limit));
    if (offset) searchParams.set('offset', String(offset));
    const queryString = searchParams.toString();
    const endpoint = `/api/agent/conversations${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint, { teamId });
  }

  async getAgentConversation(id, options = {}) {
    return this.request(`/api/agent/conversations/${id}`, options);
  }

  async createAgentConversation(data, options = {}) {
    return this.request('/api/agent/conversations', {
      method: 'POST',
      body: data,
      teamId: options.teamId,
    });
  }

  async updateAgentConversation(id, data, options = {}) {
    return this.request(`/api/agent/conversations/${id}`, {
      method: 'PATCH',
      body: data,
      teamId: options.teamId,
    });
  }

  async deleteAgentConversation(id, options = {}) {
    return this.request(`/api/agent/conversations/${id}`, {
      method: 'DELETE',
      teamId: options.teamId,
    });
  }

  // Agent Message API methods
  async saveAgentMessage(data, options = {}) {
    return this.request('/api/agent/messages', {
      method: 'POST',
      body: data,
      teamId: options.teamId,
    });
  }

  async saveAgentMessages(data, options = {}) {
    return this.request('/api/agent/messages', {
      method: 'PUT',
      body: data,
      teamId: options.teamId,
    });
  }
}

// 创建单例实例
export const apiClient = new ApiClient();
export { ApiError };

// Hook for API operations with React Query style
export function useApiRequest() {
  return {
    apiClient,
    ApiError,
  };
} 
