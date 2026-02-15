/**
 * Request Cache System with TTL Support
 * Provides in-memory caching with configurable TTL and cache invalidation strategies
 */

class CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;

  constructor(data: any, ttl: number = 300000) { // Default 5 minutes
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.accessCount = 0;
    this.lastAccessed = Date.now();
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  touch() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  getRemainingTTL() {
    return Math.max(0, this.ttl - (Date.now() - this.timestamp));
  }
}

class RequestCache {
  cache: Map<string, CacheEntry>;
  hitCount: number;
  missCount: number;
  config: any;
  cleanupTimer: ReturnType<typeof setInterval> | null;

  constructor(config: any = {}) {
    this.cache = new Map();
    this.hitCount = 0;
    this.missCount = 0;
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxSize: 100,
      strategy: 'lru', // 'lru', 'fifo', 'ttl'
      cleanupInterval: 60000, // 1 minute
      ...config
    };
    
    // Start cleanup interval
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(endpoint: string, options: any = {}) {
    const method = options.method || 'GET';
    const params = options.params || {};
    const body = options.body || '';
    
    // Create a stable key from the request parameters
    const keyData = {
      endpoint,
      method,
      params: JSON.stringify(params),
      body: typeof body === 'string' ? body : JSON.stringify(body)
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get cached data if available and not expired
   */
  get(key: string) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }
    
    if (entry.isExpired()) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    entry.touch();
    this.hitCount++;
    return entry.data;
  }

  /**
   * Set data in cache with optional TTL
   */
  set(key: string, data: any, ttl: number | null = null) {
    const actualTTL = ttl || this.config.defaultTTL;
    
    // Check if we need to evict entries (only if key doesn't exist)
    if (!this.cache.has(key) && this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const entry = new CacheEntry(data, actualTTL);
    this.cache.set(key, entry);
    
    return entry;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.isExpired()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate cache entries by pattern or specific key
   */
  invalidate(pattern: any) {
    if (typeof pattern === 'string') {
      // Exact key match
      this.cache.delete(pattern);
      return;
    }
    
    if (pattern instanceof RegExp) {
      // Pattern matching
      for (const [key] of this.cache) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
      return;
    }
    
    if (typeof pattern === 'function') {
      // Custom predicate function
      for (const [key, entry] of this.cache) {
        if (pattern(key, entry)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Invalidate cache entries by endpoint pattern
   */
  invalidateByEndpoint(endpoint: string) {
    const pattern = new RegExp(endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    this.invalidate((key) => {
      try {
        const keyData = JSON.parse(Buffer.from(key, 'base64').toString('utf8'));
        return pattern.test(keyData.endpoint);
      } catch {
        return false;
      }
    });
  }

  /**
   * Invalidate cache entries by method
   */
  invalidateByMethod(method: string) {
    this.invalidate((key) => {
      try {
        const keyData = JSON.parse(Buffer.from(key, 'base64').toString('utf8'));
        return keyData.method === method;
      } catch {
        return false;
      }
    });
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalEntries = 0;
    let expiredEntries = 0;
    let totalAccessCount = 0;
    
    for (const [key, entry] of this.cache) {
      totalEntries++;
      totalAccessCount += entry.accessCount;
      
      if (entry.isExpired()) {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries,
      expiredEntries,
      activeEntries: totalEntries - expiredEntries,
      totalAccessCount,
      averageAccessCount: totalEntries > 0 ? totalAccessCount / totalEntries : 0,
      maxSize: this.config.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      missRate: this.missCount / (this.hitCount + this.missCount) || 0
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.isExpired()) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    return expiredKeys.length;
  }

  /**
   * Evict entries based on strategy when cache is full
   */
  evict() {
    if (this.cache.size === 0) return;
    
    let keyToEvict;
    
    switch (this.config.strategy) {
      case 'lru':
        // Evict least recently used
        let oldestAccess = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.lastAccessed < oldestAccess) {
            oldestAccess = entry.lastAccessed;
            keyToEvict = key;
          }
        }
        break;
        
      case 'fifo':
        // Evict first in (oldest timestamp)
        let oldestTimestamp = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            keyToEvict = key;
          }
        }
        break;
        
      case 'ttl':
        // Evict entry with shortest remaining TTL
        let shortestTTL = Infinity;
        for (const [key, entry] of this.cache) {
          const remainingTTL = entry.getRemainingTTL();
          if (remainingTTL < shortestTTL) {
            shortestTTL = remainingTTL;
            keyToEvict = key;
          }
        }
        break;
        
      default:
        // Default to first key (FIFO)
        keyToEvict = this.cache.keys().next().value;
    }
    
    if (keyToEvict) {
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * Destroy cache and cleanup timers
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Cache invalidation strategies for different operations
export const CacheInvalidationStrategies = {
  onPromptMutation: (cache: RequestCache) => {
    cache.invalidateByEndpoint('/api/prompts');
  },

  onPromptUpdate: (cache: RequestCache, promptId: string) => {
    cache.invalidate((key) => {
      try {
        const keyData = JSON.parse(Buffer.from(key, 'base64').toString('utf8'));
        return keyData.endpoint === `/api/prompts/${promptId}` || keyData.endpoint === '/api/prompts';
      } catch {
        return false;
      }
    });
  },
  
  // Invalidate tags cache when tags are modified
  onTagMutation: (cache: RequestCache) => {
    cache.invalidateByEndpoint('/api/tags');
    // Also invalidate prompts as they might include tag information
    cache.invalidateByEndpoint('/api/prompts');
  },
  
  // Invalidate all GET requests (useful for global refresh)
  onGlobalRefresh: (cache: RequestCache) => {
    cache.invalidateByMethod('GET');
  }
};

// Create singleton cache instance
export const requestCache = new RequestCache({
  defaultTTL: 300000, // 5 minutes
  maxSize: 100,
  strategy: 'lru',
  cleanupInterval: 60000 // 1 minute
});

export { RequestCache, CacheEntry };