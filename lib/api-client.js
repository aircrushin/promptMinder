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
