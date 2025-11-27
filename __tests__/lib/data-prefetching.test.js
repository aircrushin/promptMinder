/**
 * Tests for Data Prefetching Service
 */

import { DataPrefetchingService, PrefetchStrategy, PrefetchUtils } from '../../lib/data-prefetching';

// Mock the cached API client
jest.mock('../../lib/cached-api-client', () => ({
  cachedApiClient: {
    request: jest.fn(),
    getPrompts: jest.fn(),
    getTags: jest.fn()
  }
}));

describe('PrefetchStrategy', () => {
  test('should create strategy with correct properties', () => {
    const condition = (context) => context.test === true;
    const strategy = new PrefetchStrategy('test-strategy', 2, condition);

    expect(strategy.name).toBe('test-strategy');
    expect(strategy.priority).toBe(2);
    expect(strategy.condition).toBe(condition);
  });

  test('should evaluate condition correctly', () => {
    const strategy = new PrefetchStrategy('test', 1, (context) => context.enabled);

    expect(strategy.shouldPrefetch({ enabled: true })).toBe(true);
    expect(strategy.shouldPrefetch({ enabled: false })).toBe(false);
  });
});

describe('DataPrefetchingService', () => {
  let service;
  let mockApiClient;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new DataPrefetchingService({
      maxConcurrentPrefetches: 2,
      prefetchDelay: 50,
      maxPrefetchAge: 1000,
      enableIntelligentPrefetching: true
    });

    // Get the mocked API client
    const { cachedApiClient } = require('../../lib/cached-api-client');
    mockApiClient = cachedApiClient;
    
    // Reset mocks
    mockApiClient.request.mockClear();
    mockApiClient.getPrompts.mockClear();
    mockApiClient.getTags.mockClear();
  });

  afterEach(() => {
    service.destroy();
    jest.useRealTimers();
  });

  test('should initialize with default strategies', () => {
    expect(service.strategies.size).toBeGreaterThan(0);
    expect(service.strategies.has('nextPagePrompts')).toBe(true);
    expect(service.strategies.has('promptDetails')).toBe(true);
    expect(service.strategies.has('tags')).toBe(true);
  });

  test('should add and remove strategies', () => {
    const strategy = new PrefetchStrategy('custom', 1);
    
    service.addStrategy(strategy);
    expect(service.strategies.has('custom')).toBe(true);
    
    service.removeStrategy('custom');
    expect(service.strategies.has('custom')).toBe(false);
  });

  test('should record user behavior', () => {
    service.recordUserBehavior('hover', { promptId: '123' });
    
    expect(service.userBehaviorPatterns.size).toBe(1);
    
    const pattern = service.userBehaviorPatterns.get('hover:{"promptId":"123"}');
    expect(pattern.count).toBe(1);
    expect(pattern.context).toEqual({ promptId: '123' });
  });

  test('should add items to prefetch queue', () => {
    const prefetchItem = {
      id: 'test-item',
      type: 'test',
      priority: 2,
      requestFn: jest.fn(),
      context: {}
    };

    service.addToPrefetchQueue(prefetchItem);
    
    expect(service.prefetchQueue.length).toBe(1);
    expect(service.prefetchQueue[0].id).toBe('test-item');
  });

  test('should sort prefetch queue by priority', () => {
    service.addToPrefetchQueue({
      id: 'low-priority',
      priority: 1,
      requestFn: jest.fn()
    });
    
    service.addToPrefetchQueue({
      id: 'high-priority',
      priority: 3,
      requestFn: jest.fn()
    });
    
    service.addToPrefetchQueue({
      id: 'medium-priority',
      priority: 2,
      requestFn: jest.fn()
    });

    expect(service.prefetchQueue[0].id).toBe('high-priority');
    expect(service.prefetchQueue[1].id).toBe('medium-priority');
    expect(service.prefetchQueue[2].id).toBe('low-priority');
  });

  test('should not duplicate items in queue', () => {
    const item = {
      id: 'duplicate-test',
      priority: 1,
      requestFn: jest.fn()
    };

    service.addToPrefetchQueue(item);
    service.addToPrefetchQueue(item);
    
    expect(service.prefetchQueue.length).toBe(1);
  });

  test('should update priority for existing items', () => {
    service.addToPrefetchQueue({
      id: 'priority-test',
      priority: 1,
      requestFn: jest.fn()
    });
    
    service.addToPrefetchQueue({
      id: 'priority-test',
      priority: 3,
      requestFn: jest.fn()
    });

    expect(service.prefetchQueue.length).toBe(1);
    expect(service.prefetchQueue[0].priority).toBe(3);
  });

  test('should process prefetch queue', async () => {
    const mockRequestFn = jest.fn().mockResolvedValue('success');
    
    service.addToPrefetchQueue({
      id: 'process-test',
      priority: 1,
      requestFn: mockRequestFn
    });

    expect(service.prefetchQueue.length).toBe(1);

    // Manually trigger processing
    await service.processPrefetchQueue();

    expect(mockRequestFn).toHaveBeenCalled();
    expect(service.prefetchQueue.length).toBe(0);
    expect(service.prefetchHistory.has('process-test')).toBe(true);
  });

  test('should respect max concurrent prefetches', async () => {
    const mockRequestFn = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    // Add more items than max concurrent
    for (let i = 0; i < 5; i++) {
      service.addToPrefetchQueue({
        id: `concurrent-test-${i}`,
        priority: 1,
        requestFn: mockRequestFn
      });
    }

    // Advance timers to start processing
    jest.advanceTimersByTime(100);
    
    // Should only process up to max concurrent
    expect(service.activePrefetches.size).toBeLessThanOrEqual(2);
  });

  test('should prefetch prompt details', async () => {
    mockApiClient.request.mockResolvedValue({ id: '123', title: 'Test Prompt' });
    
    await service.prefetchPromptDetails('123');
    
    expect(service.prefetchQueue.length).toBe(1);
    expect(service.prefetchQueue[0].type).toBe('promptDetails');
    expect(service.prefetchQueue[0].context.promptId).toBe('123');
  });

  test('should prefetch next page', async () => {
    mockApiClient.getPrompts.mockResolvedValue({ prompts: [], hasNext: false });
    
    const context = { currentPage: 1, filters: { tag: 'test' } };
    await service.prefetchNextPage(context);
    
    expect(service.prefetchQueue.length).toBe(1);
    expect(service.prefetchQueue[0].type).toBe('promptsPage');
    expect(service.prefetchQueue[0].context.page).toBe(2);
  });

  test('should prefetch tags', async () => {
    mockApiClient.getTags.mockResolvedValue([{ id: 1, name: 'test' }]);
    
    await service.prefetchTags();
    
    expect(service.prefetchQueue.length).toBe(1);
    expect(service.prefetchQueue[0].type).toBe('tags');
  });

  test('should prefetch for context using strategies', async () => {
    const context = {
      currentPage: 1,
      hasNextPage: true,
      hoveredPromptId: '123',
      alreadyLoaded: false
    };

    await service.prefetchForContext(context);
    
    // Should have added items for applicable strategies
    expect(service.prefetchQueue.length).toBeGreaterThan(0);
  });

  test('should provide accurate statistics', () => {
    service.addToPrefetchQueue({
      id: 'stats-test-1',
      priority: 1,
      requestFn: jest.fn()
    });
    
    service.addToPrefetchQueue({
      id: 'stats-test-2',
      priority: 2,
      requestFn: jest.fn()
    });
    
    service.recordUserBehavior('test', { id: 1 });
    
    const stats = service.getStats();
    
    expect(stats.queueLength).toBe(2);
    expect(stats.behaviorPatterns).toBe(1);
    expect(stats.strategies).toBeGreaterThan(0);
    expect(stats.maxConcurrentPrefetches).toBe(2);
  });

  test('should clear queue and history', () => {
    service.addToPrefetchQueue({
      id: 'clear-test',
      priority: 1,
      requestFn: jest.fn()
    });
    
    service.recordUserBehavior('test', {});
    service.prefetchHistory.set('test', Date.now());
    
    service.clear();
    
    expect(service.prefetchQueue.length).toBe(0);
    expect(service.prefetchHistory.size).toBe(0);
    expect(service.userBehaviorPatterns.size).toBe(0);
  });

  test('should handle prefetch errors gracefully', async () => {
    const mockRequestFn = jest.fn().mockRejectedValue(new Error('Prefetch failed'));
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    service.addToPrefetchQueue({
      id: 'error-test',
      priority: 1,
      requestFn: mockRequestFn
    });

    // Manually trigger processing
    await service.processPrefetchQueue();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Prefetch failed for error-test'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});

describe('PrefetchUtils', () => {
  let mockPrefetchService;

  beforeEach(() => {
    mockPrefetchService = {
      recordUserBehavior: jest.fn(),
      prefetchForContext: jest.fn()
    };
  });

  test('should create hover prefetch handlers', () => {
    const getContext = jest.fn().mockReturnValue({ promptId: '123' });
    const handlers = PrefetchUtils.createHoverPrefetch(mockPrefetchService, getContext);

    expect(handlers).toHaveProperty('onMouseEnter');
    expect(handlers).toHaveProperty('onMouseLeave');
    expect(typeof handlers.onMouseEnter).toBe('function');
    expect(typeof handlers.onMouseLeave).toBe('function');
  });

  test('should create scroll prefetch handler', () => {
    const getContext = jest.fn().mockReturnValue({ scrollPercentage: 80 });
    const handler = PrefetchUtils.createScrollPrefetch(mockPrefetchService, getContext);

    expect(typeof handler).toBe('function');
  });

  test('should create route prefetch handler', () => {
    const handler = PrefetchUtils.createRoutePrefetch(mockPrefetchService);

    handler('/prompts', { userId: '123' });

    expect(mockPrefetchService.recordUserBehavior).toHaveBeenCalledWith(
      'navigate',
      { route: '/prompts', userId: '123' }
    );
    expect(mockPrefetchService.prefetchForContext).toHaveBeenCalledWith({
      currentRoute: '/prompts',
      userId: '123'
    });
  });
});