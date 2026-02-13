/**
 * Tests for API Cache System
 */

import { RequestCache, CacheEntry, CacheInvalidationStrategies } from '../../lib/api-cache';

describe('CacheEntry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create cache entry with correct properties', () => {
    const data = { test: 'data' };
    const ttl = 60000;
    const entry = new CacheEntry(data, ttl);

    expect(entry.data).toBe(data);
    expect(entry.ttl).toBe(ttl);
    expect(entry.accessCount).toBe(0);
    expect(entry.timestamp).toBe(Date.now());
    expect(entry.lastAccessed).toBe(Date.now());
  });

  test('should detect expiration correctly', () => {
    const entry = new CacheEntry({ test: 'data' }, 1000);
    
    expect(entry.isExpired()).toBe(false);
    
    jest.advanceTimersByTime(1001);
    expect(entry.isExpired()).toBe(true);
  });

  test('should update access count and timestamp on touch', () => {
    const entry = new CacheEntry({ test: 'data' });
    const initialAccessCount = entry.accessCount;
    const initialLastAccessed = entry.lastAccessed;
    
    jest.advanceTimersByTime(1000);
    entry.touch();
    
    expect(entry.accessCount).toBe(initialAccessCount + 1);
    expect(entry.lastAccessed).toBeGreaterThan(initialLastAccessed);
  });

  test('should calculate remaining TTL correctly', () => {
    const ttl = 5000;
    const entry = new CacheEntry({ test: 'data' }, ttl);
    
    expect(entry.getRemainingTTL()).toBe(ttl);
    
    jest.advanceTimersByTime(2000);
    expect(entry.getRemainingTTL()).toBe(3000);
    
    jest.advanceTimersByTime(4000);
    expect(entry.getRemainingTTL()).toBe(0);
  });
});

describe('RequestCache', () => {
  let cache;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new RequestCache({
      defaultTTL: 5000,
      maxSize: 3,
      strategy: 'lru',
      cleanupInterval: 10000
    });
  });

  afterEach(() => {
    cache.destroy();
    jest.useRealTimers();
  });

  test('should generate consistent cache keys', () => {
    const endpoint = '/api/test';
    const options = { method: 'GET', params: { id: 1 } };
    
    const key1 = cache.generateKey(endpoint, options);
    const key2 = cache.generateKey(endpoint, options);

    expect(key1).toBe(key2);
    expect(typeof key1).toBe('string');
    expect(key1.length).toBeGreaterThan(0);

    const parsed = JSON.parse(Buffer.from(key1, 'base64').toString('utf8'));
    expect(parsed).toMatchObject({
      endpoint,
      method: 'GET'
    });
  });

  test('should store and retrieve data correctly', () => {
    const key = 'test-key';
    const data = { test: 'data' };
    
    cache.set(key, data);
    const retrieved = cache.get(key);
    
    expect(retrieved).toEqual(data);
    expect(cache.has(key)).toBe(true);
  });

  test('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
    expect(cache.has('non-existent')).toBe(false);
  });

  test('should handle expiration correctly', () => {
    const key = 'test-key';
    const data = { test: 'data' };
    
    cache.set(key, data, 1000);
    expect(cache.get(key)).toEqual(data);
    
    jest.advanceTimersByTime(1001);
    expect(cache.get(key)).toBeNull();
    expect(cache.has(key)).toBe(false);
  });

  test('should evict entries when cache is full', () => {
    // Fill cache to max size
    cache.set('key1', 'data1');
    cache.set('key2', 'data2');
    cache.set('key3', 'data3');
    
    expect(cache.cache.size).toBe(3);
    
    // Add one more to trigger eviction
    cache.set('key4', 'data4');
    
    expect(cache.cache.size).toBe(3);
    expect(cache.has('key1')).toBe(false); // Should be evicted (LRU)
    expect(cache.has('key4')).toBe(true);
  });

  test('should invalidate by exact key', () => {
    cache.set('key1', 'data1');
    cache.set('key2', 'data2');
    
    cache.invalidate('key1');
    
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
  });

  test('should invalidate by regex pattern', () => {
    const key1 = cache.generateKey('/api/prompts', {});
    const key2 = cache.generateKey('/api/tags', {});
    const key3 = cache.generateKey('/api/prompts/123', {});
    
    cache.set(key1, 'data1');
    cache.set(key2, 'data2');
    cache.set(key3, 'data3');
    
    cache.invalidateByEndpoint('/api/prompts');
    
    expect(cache.has(key1)).toBe(false);
    expect(cache.has(key3)).toBe(false);
    expect(cache.has(key2)).toBe(true);
  });

  test('should invalidate by custom predicate', () => {
    cache.set('key1', 'data1');
    cache.set('key2', 'data2');
    cache.set('key3', 'data3');
    
    cache.invalidate((key) => key.includes('key1') || key.includes('key3'));
    
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key3')).toBe(false);
    expect(cache.has('key2')).toBe(true);
  });

  test('should clear all entries', () => {
    cache.set('key1', 'data1');
    cache.set('key2', 'data2');
    
    cache.clear();
    
    expect(cache.cache.size).toBe(0);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
  });

  test('should cleanup expired entries', () => {
    cache.set('key1', 'data1', 1000);
    cache.set('key2', 'data2', 5000);
    
    jest.advanceTimersByTime(1001);
    
    const cleanedCount = cache.cleanup();
    
    expect(cleanedCount).toBe(1);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
  });

  test('should provide accurate statistics', () => {
    cache.set('key1', 'data1');
    cache.set('key2', 'data2', 1000);
    
    cache.get('key1'); // Hit
    cache.get('key1'); // Hit
    cache.get('nonexistent'); // Miss
    
    jest.advanceTimersByTime(1001); // Expire key2
    
    const stats = cache.getStats();
    
    expect(stats.totalEntries).toBe(2);
    expect(stats.expiredEntries).toBe(1);
    expect(stats.activeEntries).toBe(1);
    expect(stats.maxSize).toBe(3);
  });

  test('should run automatic cleanup', () => {
    cache.set('key1', 'data1', 1000);
    
    jest.advanceTimersByTime(1001);
    jest.advanceTimersByTime(10000); // Trigger cleanup interval
    
    expect(cache.has('key1')).toBe(false);
  });
});

describe('CacheInvalidationStrategies', () => {
  let cache;

  beforeEach(() => {
    cache = new RequestCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  test('should invalidate prompts cache on mutation', () => {
    const promptKey = cache.generateKey('/api/prompts', {});
    const tagKey = cache.generateKey('/api/tags', {});
    
    cache.set(promptKey, 'prompt-data');
    cache.set(tagKey, 'tag-data');
    
    CacheInvalidationStrategies.onPromptMutation(cache);
    
    expect(cache.has(promptKey)).toBe(false);
    expect(cache.has(tagKey)).toBe(true);
  });

  test('should invalidate specific prompt and general prompts on update', () => {
    const promptsKey = cache.generateKey('/api/prompts', {});
    const specificPromptKey = cache.generateKey('/api/prompts/123', {});
    const otherPromptKey = cache.generateKey('/api/prompts/456', {});
    
    cache.set(promptsKey, 'prompts-data');
    cache.set(specificPromptKey, 'specific-prompt-data');
    cache.set(otherPromptKey, 'other-prompt-data');
    
    CacheInvalidationStrategies.onPromptUpdate(cache, '123');
    
    expect(cache.has(promptsKey)).toBe(false);
    expect(cache.has(specificPromptKey)).toBe(false);
    expect(cache.has(otherPromptKey)).toBe(true);
  });

  test('should invalidate tags and prompts cache on tag mutation', () => {
    const promptKey = cache.generateKey('/api/prompts', {});
    const tagKey = cache.generateKey('/api/tags', {});
    
    cache.set(promptKey, 'prompt-data');
    cache.set(tagKey, 'tag-data');
    
    CacheInvalidationStrategies.onTagMutation(cache);
    
    expect(cache.has(promptKey)).toBe(false);
    expect(cache.has(tagKey)).toBe(false);
  });

  test('should invalidate all GET requests on global refresh', () => {
    const getKey = cache.generateKey('/api/prompts', { method: 'GET' });
    const postKey = cache.generateKey('/api/prompts', { method: 'POST' });
    
    cache.set(getKey, 'get-data');
    cache.set(postKey, 'post-data');
    
    CacheInvalidationStrategies.onGlobalRefresh(cache);
    
    expect(cache.has(getKey)).toBe(false);
    expect(cache.has(postKey)).toBe(true);
  });
});