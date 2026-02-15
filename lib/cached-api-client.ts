/**
 * Enhanced API Client with integrated caching support
 */

import { apiClient, ApiError } from './api-client';
import { requestCache, CacheInvalidationStrategies } from './api-cache';

class CachedApiClient {
  baseClient: any;
  cache: any;

  constructor(baseClient: any = apiClient) {
    this.baseClient = baseClient;
    this.cache = requestCache;
  }

  async request(endpoint: string, options: any = {}) {
    const {
      cache: cacheOptions = {},
      skipCache = false,
      ...requestOptions
    } = options;

    const {
      ttl = 300000,
      key: customKey = null,
      invalidateOnMutation = true
    } = cacheOptions;

    const method = requestOptions.method || 'GET';
    const shouldCache = !skipCache && method === 'GET';

    if (!shouldCache) {
      const result = await this.baseClient.request(endpoint, requestOptions);

      if (invalidateOnMutation && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        this.invalidateCacheForMutation(endpoint, method);
      }

      return result;
    }

    const cacheKey = customKey || this.cache.generateKey(endpoint, requestOptions);

    const cachedData = this.cache.get(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    const data = await this.baseClient.request(endpoint, requestOptions);

    this.cache.set(cacheKey, data, ttl);

    return data;
  }

  invalidateCacheForMutation(endpoint: string, method: string) {
    if (endpoint.includes('/api/prompts')) {
      if (method === 'DELETE' || method === 'POST' || method === 'PUT' || method === 'PATCH') {
        CacheInvalidationStrategies.onPromptMutation(this.cache);
      }
    } else if (endpoint.includes('/api/tags')) {
      if (method === 'DELETE' || method === 'POST' || method === 'PUT' || method === 'PATCH') {
        CacheInvalidationStrategies.onTagMutation(this.cache);
      }
    }
  }

  async getPrompts(params: any = {}, cacheOptions: any = {}, { teamId }: any = {}) {
    const searchParams = new URLSearchParams(params);
    if (teamId) {
      searchParams.set('teamId', teamId);
    }
    const queryString = searchParams.toString();
    const endpoint = `/api/prompts${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint, {
      cache: {
        ttl: 300000,
        ...cacheOptions
      },
      teamId
    });
  }

  async createPrompt(promptData: any, { teamId }: any = {}) {
    const result = await this.request('/api/prompts', {
      method: 'POST',
      body: promptData,
      teamId
    });

    CacheInvalidationStrategies.onPromptMutation(this.cache);

    return result;
  }

  async updatePrompt(id: string, promptData: any, { teamId }: any = {}) {
    const result = await this.request(`/api/prompts/${id}`, {
      method: 'POST',
      body: promptData,
      teamId
    });

    CacheInvalidationStrategies.onPromptUpdate(this.cache, id);

    return result;
  }

  async deletePrompt(id: string, { teamId }: any = {}) {
    const result = await this.request(`/api/prompts/${id}`, {
      method: 'DELETE',
      teamId
    });

    CacheInvalidationStrategies.onPromptMutation(this.cache);

    return result;
  }

  async sharePrompt(id: string, { teamId }: any = {}) {
    return this.request(`/api/prompts/share/${id}`, {
      method: 'POST',
      teamId
    });
  }

  async copyPrompt(promptData: any, { teamId }: any = {}) {
    const result = await this.request('/api/prompts/copy', {
      method: 'POST',
      body: { promptData },
      teamId
    });

    CacheInvalidationStrategies.onPromptMutation(this.cache);

    return result;
  }

  async getTags(cacheOptions: any = {}, { teamId }: any = {}) {
    const endpoint = teamId ? `/api/tags?teamId=${teamId}` : '/api/tags'
    return this.request(endpoint, {
      cache: {
        ttl: 600000,
        ...cacheOptions
      },
      teamId
    });
  }

  async createTag(tagData: any, { teamId }: any = {}) {
    const result = await this.request('/api/tags', {
      method: 'POST',
      body: tagData,
      teamId
    });

    CacheInvalidationStrategies.onTagMutation(this.cache);

    return result;
  }

  async updateTag(id: string, tagData: any, { teamId }: any = {}) {
    const result = await this.request(`/api/tags?id=${id}`, {
      method: 'PATCH',
      body: tagData,
      teamId
    });

    CacheInvalidationStrategies.onTagMutation(this.cache);

    return result;
  }

  async deleteTag(id: string, { teamId }: any = {}) {
    const result = await this.request(`/api/tags?id=${id}`, {
      method: 'DELETE',
      teamId
    });

    CacheInvalidationStrategies.onTagMutation(this.cache);

    return result;
  }

  async chat(messages: any[], options: any = {}) {
    return this.baseClient.chat(messages, options);
  }

  async generate(text: string) {
    return this.baseClient.generate(text);
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern: any) {
    this.cache.invalidate(pattern);
  }

  invalidateCacheByEndpoint(endpoint: string) {
    this.cache.invalidateByEndpoint(endpoint);
  }

  async prefetch(requests: Array<{ endpoint: string; options?: any; ttl?: number }>) {
    const prefetchPromises = requests.map(async ({ endpoint, options = {}, ttl = 300000 }) => {
      try {
        const cacheKey = this.cache.generateKey(endpoint, options);

        if (!this.cache.has(cacheKey)) {
          const data = await this.baseClient.request(endpoint, options);
          this.cache.set(cacheKey, data, ttl);
        }
      } catch (error) {
        console.warn(`Prefetch failed for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
  }

  async warmCache() {
    const commonRequests = [
      { endpoint: '/api/prompts', options: {}, ttl: 300000 },
      { endpoint: '/api/tags', options: {}, ttl: 600000 }
    ];

    await this.prefetch(commonRequests);
  }
}

// Create singleton cached API client
export const cachedApiClient = new CachedApiClient();

// Export for backward compatibility and testing
export { CachedApiClient, ApiError };
