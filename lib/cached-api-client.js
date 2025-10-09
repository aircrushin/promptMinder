/**
 * Enhanced API Client with integrated caching support
 */

import { apiClient, ApiError } from './api-client';
import { requestCache, CacheInvalidationStrategies } from './api-cache';

class CachedApiClient {
  constructor(baseClient = apiClient) {
    this.baseClient = baseClient;
    this.cache = requestCache;
  }

  /**
   * Enhanced request method with caching support
   */
  async request(endpoint, options = {}) {
    const {
      cache: cacheOptions = {},
      skipCache = false,
      ...requestOptions
    } = options;

    const {
      ttl = 300000, // 5 minutes default
      key: customKey = null,
      invalidateOnMutation = true
    } = cacheOptions;

    // Skip cache for non-GET requests by default
    const method = requestOptions.method || 'GET';
    const shouldCache = !skipCache && method === 'GET';

    if (!shouldCache) {
      const result = await this.baseClient.request(endpoint, requestOptions);
      
      // Invalidate cache for mutation operations
      if (invalidateOnMutation && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        this.invalidateCacheForMutation(endpoint, method);
      }
      
      return result;
    }

    // Generate cache key
    const cacheKey = customKey || this.cache.generateKey(endpoint, requestOptions);

    // Try to get from cache first
    const cachedData = this.cache.get(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }

    // Make the actual request
    const data = await this.baseClient.request(endpoint, requestOptions);
    
    // Cache the result
    this.cache.set(cacheKey, data, ttl);
    
    return data;
  }

  /**
   * Invalidate cache based on mutation type
   */
  invalidateCacheForMutation(endpoint, method) {
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

  // Enhanced Prompt API methods with caching
  async getPrompts(params = {}, cacheOptions = {}, { teamId } = {}) {
    const searchParams = new URLSearchParams(params);
    if (teamId) {
      searchParams.set('teamId', teamId);
    }
    const queryString = searchParams.toString();
    const endpoint = `/api/prompts${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      cache: {
        ttl: 300000, // 5 minutes
        ...cacheOptions
      },
      teamId
    });
  }

  async createPrompt(promptData, { teamId } = {}) {
    const result = await this.request('/api/prompts', {
      method: 'POST',
      body: promptData,
      teamId
    });
    
    // Invalidate prompts cache
    CacheInvalidationStrategies.onPromptMutation(this.cache);
    
    return result;
  }

  async updatePrompt(id, promptData, { teamId } = {}) {
    const result = await this.request(`/api/prompts/${id}`, {
      method: 'POST',
      body: promptData,
      teamId
    });
    
    // Invalidate specific prompt and general prompts cache
    CacheInvalidationStrategies.onPromptUpdate(this.cache, id);
    
    return result;
  }

  async deletePrompt(id, { teamId } = {}) {
    const result = await this.request(`/api/prompts/${id}`, {
      method: 'DELETE',
      teamId
    });
    
    // Invalidate prompts cache
    CacheInvalidationStrategies.onPromptMutation(this.cache);
    
    return result;
  }

  async sharePrompt(id, { teamId } = {}) {
    return this.request(`/api/prompts/share/${id}`, {
      method: 'POST',
      teamId
    });
  }

  async copyPrompt(promptData, { teamId } = {}) {
    const result = await this.request('/api/prompts/copy', {
      method: 'POST',
      body: { promptData },
      teamId
    });
    
    // Invalidate prompts cache as we have a new prompt
    CacheInvalidationStrategies.onPromptMutation(this.cache);
    
    return result;
  }

  // Enhanced Tags API methods with caching
  async getTags(cacheOptions = {}, { teamId } = {}) {
    const endpoint = teamId ? `/api/tags?teamId=${teamId}` : '/api/tags'
    return this.request(endpoint, {
      cache: {
        ttl: 600000, // 10 minutes (tags change less frequently)
        ...cacheOptions
      },
      teamId
    });
  }

  async createTag(tagData, { teamId } = {}) {
    const result = await this.request('/api/tags', {
      method: 'POST',
      body: tagData,
      teamId
    });
    
    // Invalidate tags cache
    CacheInvalidationStrategies.onTagMutation(this.cache);
    
    return result;
  }

  async updateTag(id, tagData, { teamId } = {}) {
    const result = await this.request(`/api/tags?id=${id}`, {
      method: 'PATCH',
      body: tagData,
      teamId
    });
    
    // Invalidate tags cache
    CacheInvalidationStrategies.onTagMutation(this.cache);
    
    return result;
  }

  async deleteTag(id, { teamId } = {}) {
    const result = await this.request(`/api/tags?id=${id}`, {
      method: 'DELETE',
      teamId
    });
    
    // Invalidate tags cache
    CacheInvalidationStrategies.onTagMutation(this.cache);
    
    return result;
  }

  // Streaming methods (no caching)
  async chat(messages, options = {}) {
    return this.baseClient.chat(messages, options);
  }

  async generate(text) {
    return this.baseClient.generate(text);
  }

  // Cache management methods
  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
  }

  invalidateCacheByEndpoint(endpoint) {
    this.cache.invalidateByEndpoint(endpoint);
  }

  /**
   * Prefetch data for better UX
   */
  async prefetch(requests) {
    const prefetchPromises = requests.map(async ({ endpoint, options = {}, ttl = 300000 }) => {
      try {
        const cacheKey = this.cache.generateKey(endpoint, options);
        
        // Only prefetch if not already cached
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

  /**
   * Warm cache with commonly accessed data
   */
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
