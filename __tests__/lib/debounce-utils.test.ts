// @ts-nocheck
/**
 * Tests for Enhanced Debouncing Utilities
 */

import { 
  debounce, 
  createDebouncedApiSearch, 
  createDebouncedTagFilter,
  DebouncedApiClient,
  DebouncedFunction,
  DebounceUtils
} from '../../lib/debounce-utils';

// Mock the dependencies
jest.mock('../../lib/request-deduplication', () => ({
  requestDeduplicationService: {
    generateKey: jest.fn().mockReturnValue('mock-key'),
    dedupe: jest.fn(),
    cancel: jest.fn()
  }
}));

jest.mock('../../lib/cached-api-client', () => ({
  cachedApiClient: {
    getPrompts: jest.fn()
  }
}));

describe('DebouncedFunction', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create debounced function with correct properties', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100);

    expect(debouncedFn.func).toBe(mockFn);
    expect(debouncedFn.wait).toBe(100);
    expect(debouncedFn.timeout).toBeNull();
  });

  test('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100);

    debouncedFn.execute('test');
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('should cancel pending execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100);

    debouncedFn.execute('test');
    debouncedFn.cancel();

    jest.advanceTimersByTime(100);
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('should flush pending execution immediately', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100);

    debouncedFn.execute('test');
    debouncedFn.flush();

    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('should handle leading edge execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100, { leading: true });

    debouncedFn.execute('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  test('should handle maxWait option', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100, { maxWait: 200 });

    debouncedFn.execute('test1');
    jest.advanceTimersByTime(50);
    debouncedFn.execute('test2');
    jest.advanceTimersByTime(50);
    debouncedFn.execute('test3');
    jest.advanceTimersByTime(50);
    debouncedFn.execute('test4');

    // Should execute due to maxWait
    jest.advanceTimersByTime(50);
    expect(mockFn).toHaveBeenCalledWith('test4');
  });

  test('should report pending status correctly', () => {
    const mockFn = jest.fn();
    const debouncedFn = new DebouncedFunction(mockFn, 100);

    expect(debouncedFn.pending()).toBe(false);

    debouncedFn.execute('test');
    expect(debouncedFn.pending()).toBe(true);

    jest.advanceTimersByTime(100);
    expect(debouncedFn.pending()).toBe(false);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create debounced function', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    expect(typeof debouncedFn).toBe('function');
    expect(typeof debouncedFn.cancel).toBe('function');
    expect(typeof debouncedFn.flush).toBe('function');
    expect(typeof debouncedFn.pending).toBe('function');
  });

  test('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('test1');
    debouncedFn('test2');
    debouncedFn('test3');

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('test3');
  });

  test('should throw error for non-function input', () => {
    expect(() => debounce('not a function', 100)).toThrow(TypeError);
  });
});

describe('createDebouncedApiSearch', () => {
  let mockSearchFn;
  let mockDeduplicationService;

  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchFn = jest.fn().mockResolvedValue({ results: [] });
    
    const { requestDeduplicationService } = require('../../lib/request-deduplication');
    mockDeduplicationService = requestDeduplicationService;
    mockDeduplicationService.dedupe.mockImplementation((key, fn) => fn());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create debounced search function', () => {
    const debouncedSearch = createDebouncedApiSearch(mockSearchFn);

    expect(typeof debouncedSearch).toBe('function');
    expect(typeof debouncedSearch.cancel).toBe('function');
    expect(typeof debouncedSearch.cleanup).toBe('function');
  });

  test('should debounce search calls', async () => {
    const debouncedSearch = createDebouncedApiSearch(mockSearchFn, { wait: 100 });

    debouncedSearch('query1');
    debouncedSearch('query2');
    debouncedSearch('query3');

    expect(mockSearchFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    await Promise.resolve(); // Wait for async execution

    expect(mockSearchFn).toHaveBeenCalledTimes(1);
    expect(mockSearchFn).toHaveBeenCalledWith('query3', expect.any(Object));
  });

  test('should use deduplication when enabled', async () => {
    const debouncedSearch = createDebouncedApiSearch(mockSearchFn, { 
      wait: 100,
      deduplication: true 
    });

    debouncedSearch('query');
    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockDeduplicationService.dedupe).toHaveBeenCalled();
  });

  test('should cleanup properly', () => {
    const debouncedSearch = createDebouncedApiSearch(mockSearchFn);
    
    debouncedSearch('query');
    
    expect(typeof debouncedSearch.cleanup).toBe('function');
    
    // Cleanup should cancel the debounced function
    debouncedSearch.cleanup();
    expect(debouncedSearch.pending()).toBe(false);
  });
});

describe('createDebouncedTagFilter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create debounced filter function', () => {
    const mockFilterFn = jest.fn();
    const debouncedFilter = createDebouncedTagFilter(mockFilterFn);

    expect(typeof debouncedFilter).toBe('function');
    expect(typeof debouncedFilter.cancel).toBe('function');
  });

  test('should debounce filter calls', () => {
    const mockFilterFn = jest.fn();
    const debouncedFilter = createDebouncedTagFilter(mockFilterFn, { wait: 100 });

    debouncedFilter(['tag1']);
    debouncedFilter(['tag1', 'tag2']);
    debouncedFilter(['tag1', 'tag2', 'tag3']);

    expect(mockFilterFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFilterFn).toHaveBeenCalledTimes(1);
    expect(mockFilterFn).toHaveBeenCalledWith(['tag1', 'tag2', 'tag3']);
  });
});

describe('DebouncedApiClient', () => {
  let mockApiClient;
  let debouncedClient;

  beforeEach(() => {
    jest.useFakeTimers();
    
    const { cachedApiClient } = require('../../lib/cached-api-client');
    mockApiClient = cachedApiClient;
    mockApiClient.getPrompts.mockResolvedValue({ prompts: [] });
    
    debouncedClient = new DebouncedApiClient(mockApiClient, {
      searchWait: 100,
      filterWait: 50
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create debounced API client', () => {
    expect(debouncedClient).toBeInstanceOf(DebouncedApiClient);
    expect(typeof debouncedClient.searchPrompts).toBe('function');
    expect(typeof debouncedClient.filterByTags).toBe('function');
  });

  test('should debounce search prompts', async () => {
    debouncedClient.searchPrompts('query1');
    debouncedClient.searchPrompts('query2');
    debouncedClient.searchPrompts('query3');

    expect(mockApiClient.getPrompts).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockApiClient.getPrompts).toHaveBeenCalledTimes(1);
    expect(mockApiClient.getPrompts).toHaveBeenCalledWith({
      search: 'query3'
    }, expect.any(Object));
  });

  test('should debounce filter by tags', async () => {
    // Clear any previous calls
    mockApiClient.getPrompts.mockClear();
    
    debouncedClient.filterByTags(['tag1']);
    debouncedClient.filterByTags(['tag1', 'tag2']);

    expect(mockApiClient.getPrompts).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);
    await Promise.resolve();

    expect(mockApiClient.getPrompts).toHaveBeenCalledTimes(1);
    expect(mockApiClient.getPrompts).toHaveBeenCalledWith({
      tags: ['tag1', 'tag2']
    });
  });

  test('should cancel all operations', () => {
    debouncedClient.searchPrompts('query');
    debouncedClient.filterByTags(['tag']);

    expect(debouncedClient.getStats().searchPending).toBe(true);
    expect(debouncedClient.getStats().filterPending).toBe(true);

    debouncedClient.cancelAll();

    expect(debouncedClient.getStats().searchPending).toBe(false);
    expect(debouncedClient.getStats().filterPending).toBe(false);
  });

  test('should provide accurate statistics', () => {
    const stats = debouncedClient.getStats();

    expect(stats).toHaveProperty('activeOperations');
    expect(stats).toHaveProperty('searchPending');
    expect(stats).toHaveProperty('filterPending');
    expect(typeof stats.activeOperations).toBe('number');
    expect(typeof stats.searchPending).toBe('boolean');
    expect(typeof stats.filterPending).toBe('boolean');
  });
});

describe('DebounceUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create cleanup function', () => {
    const mockFn1 = { cancel: jest.fn(), cleanup: jest.fn() };
    const mockFn2 = { cancel: jest.fn() };
    
    const cleanup = DebounceUtils.createCleanup([mockFn1, mockFn2]);
    cleanup();

    expect(mockFn1.cancel).toHaveBeenCalled();
    expect(mockFn1.cleanup).toHaveBeenCalled();
    expect(mockFn2.cancel).toHaveBeenCalled();
  });

  test('should create debounced state setter', () => {
    const mockSetState = jest.fn();
    const debouncedSetter = DebounceUtils.createDebouncedStateSetter(mockSetState, 100);

    debouncedSetter('value1');
    debouncedSetter('value2');
    debouncedSetter('value3');

    expect(mockSetState).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockSetState).toHaveBeenCalledTimes(1);
    expect(mockSetState).toHaveBeenCalledWith('value3');
  });
});