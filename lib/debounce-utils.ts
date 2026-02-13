// @ts-nocheck
/**
 * Enhanced Debouncing Utilities for API Optimization
 * Provides advanced debouncing with cancellation, immediate execution, and cleanup
 */

import { requestDeduplicationService } from './request-deduplication';
import { cachedApiClient } from './cached-api-client';

class DebouncedFunction {
  private func: Function;
  private wait: number;
  private options: any;
  private timeout: ReturnType<typeof setTimeout> | null;
  private maxTimeout: ReturnType<typeof setTimeout> | null;
  private lastCallTime: number | null;
  private lastInvokeTime: number;
  private lastArgs: any[] | null;
  private lastThis: any;
  private result: any;
  private cancelled: boolean;

  constructor(func: Function, wait: number, options: any = {}) {
    this.func = func;
    this.wait = wait;
    this.options = {
      leading: false,
      trailing: true,
      maxWait: null,
      ...options
    };

    this.timeout = null;
    this.maxTimeout = null;
    this.lastCallTime = null;
    this.lastInvokeTime = 0;
    this.lastArgs = null;
    this.lastThis = null;
    this.result = null;
    this.cancelled = false;
  }

  /**
   * Execute the debounced function
   */
  execute(...args: any[]) {
    if (this.cancelled) return this.result;

    const now = Date.now();
    const isInvoking = this.shouldInvoke(now);

    this.lastArgs = args;
    this.lastThis = this;
    this.lastCallTime = now;

    if (isInvoking) {
      if (this.timeout === null) {
        return this.leadingEdge(now);
      }
      if (this.options.maxWait) {
        // Handle maxWait timer
        this.timeout = setTimeout(() => this.timerExpired(), this.wait);
        this.maxTimeout = setTimeout(() => this.maxTimerExpired(), this.options.maxWait);
        return this.invokeFunc(now);
      }
    }

    if (this.timeout === null) {
      this.timeout = setTimeout(() => this.timerExpired(), this.wait);
    }

    return this.result;
  }

  /**
   * Check if function should be invoked
   */
  shouldInvoke(time: number) {
    const timeSinceLastCall = time - (this.lastCallTime || 0);
    const timeSinceLastInvoke = time - this.lastInvokeTime;

    return (
      this.lastCallTime === null ||
      timeSinceLastCall >= this.wait ||
      timeSinceLastCall < 0 ||
      (this.options.maxWait && timeSinceLastInvoke >= this.options.maxWait)
    );
  }

  /**
   * Handle leading edge execution
   */
  leadingEdge(time: number) {
    this.lastInvokeTime = time;
    this.timeout = setTimeout(() => this.timerExpired(), this.wait);
    return this.options.leading ? this.invokeFunc(time) : this.result;
  }

  /**
   * Handle timer expiration
   */
  timerExpired() {
    const time = Date.now();
    if (this.shouldInvoke(time)) {
      return this.trailingEdge(time);
    }
    this.timeout = setTimeout(() => this.timerExpired(), this.remainingWait(time));
  }

  /**
   * Handle max timer expiration
   */
  maxTimerExpired() {
    this.trailingEdge(Date.now());
  }

  /**
   * Handle trailing edge execution
   */
  trailingEdge(time: number) {
    this.timeout = null;
    if (this.options.trailing && this.lastArgs) {
      return this.invokeFunc(time);
    }
    this.lastArgs = null;
    return this.result;
  }

  /**
   * Calculate remaining wait time
   */
  remainingWait(time: number) {
    const timeSinceLastCall = time - (this.lastCallTime || 0);
    const timeSinceLastInvoke = time - this.lastInvokeTime;
    const timeWaiting = this.wait - timeSinceLastCall;

    return this.options.maxWait
      ? Math.min(timeWaiting, this.options.maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  /**
   * Invoke the function
   */
  invokeFunc(time: number) {
    const args = this.lastArgs;
    const thisArg = this.lastThis;

    this.lastArgs = null;
    this.lastThis = null;
    this.lastInvokeTime = time;
    this.result = this.func.apply(thisArg, args);
    return this.result;
  }

  /**
   * Cancel the debounced function
   */
  cancel() {
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.maxTimeout !== null) {
      clearTimeout(this.maxTimeout);
      this.maxTimeout = null;
    }
    this.lastInvokeTime = 0;
    this.lastArgs = null;
    this.lastThis = null;
    this.cancelled = true;
  }

  /**
   * Flush the debounced function (execute immediately)
   */
  flush() {
    if (this.timeout === null) {
      return this.result;
    }
    return this.trailingEdge(Date.now());
  }

  /**
   * Check if function is pending
   */
  pending() {
    return this.timeout !== null;
  }
}

/**
 * Enhanced debounce function with advanced options
 */
export function debounce(func: Function, wait: number, options: any = {}) {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }

  const {
    leading = false,
    trailing = true,
    maxWait = null
  } = options;

  let timeout = null;
  let maxTimeout = null;
  let lastCallTime = null;
  let lastInvokeTime = 0;
  let lastArgs = null;
  let lastThis = null;
  let result = null;

  function shouldInvoke(time) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait && timeSinceLastInvoke >= maxWait)
    );
  }

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timeout = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = null;
    return result;
  }

  function cancel() {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (maxTimeout !== null) {
      clearTimeout(maxTimeout);
      maxTimeout = null;
    }
    lastInvokeTime = 0;
    lastArgs = null;
    lastThis = null;
  }

  function flush() {
    if (timeout === null) {
      return result;
    }
    return trailingEdge(Date.now());
  }

  function pending() {
    return timeout !== null;
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(time);
      }
      if (maxWait) {
        timeout = setTimeout(timerExpired, wait);
        maxTimeout = setTimeout(trailingEdge, maxWait, time);
        return invokeFunc(time);
      }
    }

    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Create a debounced API search function
 */
export function createDebouncedApiSearch(searchFn: Function, options: any = {}) {
  const {
    wait = 300,
    maxWait = 1000,
    leading = false,
    trailing = true,
    deduplication = true,
    caching = true
  } = options;

  let currentRequestKey = null;

  const debouncedSearch = debounce(async (query, ...args) => {
    // Cancel previous request if deduplication is enabled
    if (deduplication && currentRequestKey) {
      requestDeduplicationService.cancel(currentRequestKey);
    }

    // Generate request key for deduplication
    if (deduplication) {
      currentRequestKey = requestDeduplicationService.generateKey(
        searchFn.toString(),
        { query, args }
      );
    }

    try {
      let result;
      
      if (deduplication) {
        result = await requestDeduplicationService.dedupe(
          currentRequestKey,
          (signal) => searchFn(query, ...args, { signal })
        );
      } else {
        result = await searchFn(query, ...args);
      }

      return result;
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }, wait, { leading, trailing, maxWait });

  // Add cleanup method
  debouncedSearch.cleanup = () => {
    debouncedSearch.cancel();
    if (currentRequestKey) {
      requestDeduplicationService.cancel(currentRequestKey);
      currentRequestKey = null;
    }
  };

  return debouncedSearch;
}

/**
 * Create a debounced filter function for tags
 */
export function createDebouncedTagFilter(filterFn: Function, options: any = {}) {
  const {
    wait = 200,
    maxWait = 800,
    leading = false,
    trailing = true
  } = options;

  return debounce(filterFn, wait, { leading, trailing, maxWait });
}

/**
 * Debounced API client methods
 */
export class DebouncedApiClient {
  apiClient: any;
  defaultOptions: any;
  debouncedSearchPrompts: any;
  debouncedFilterByTags: any;
  activeOperations: Set<string>;

  constructor(apiClient: any = cachedApiClient, defaultOptions: any = {}) {
    this.apiClient = apiClient;
    this.defaultOptions = {
      searchWait: 300,
      filterWait: 200,
      maxWait: 1000,
      deduplication: true,
      ...defaultOptions
    };

    // Create debounced methods
    this.debouncedSearchPrompts = this.createDebouncedSearch();
    this.debouncedFilterByTags = this.createDebouncedTagFilter();
    
    // Track active debounced operations
    this.activeOperations = new Set();
  }

  /**
   * Create debounced search method
   */
  createDebouncedSearch() {
    return createDebouncedApiSearch(
      async (query, filters = {}, options = {}) => {
        return this.apiClient.getPrompts({
          search: query,
          ...filters
        }, options);
      },
      {
        wait: this.defaultOptions.searchWait,
        maxWait: this.defaultOptions.maxWait,
        deduplication: this.defaultOptions.deduplication
      }
    );
  }

  /**
   * Create debounced tag filter method
   */
  createDebouncedTagFilter() {
    return createDebouncedTagFilter(
      async (tags, filters = {}) => {
        return this.apiClient.getPrompts({
          tags,
          ...filters
        });
      },
      {
        wait: this.defaultOptions.filterWait,
        maxWait: this.defaultOptions.maxWait
      }
    );
  }

  /**
   * Search prompts with debouncing
   */
  async searchPrompts(query, filters = {}) {
    const operationId = `search-${Date.now()}`;
    this.activeOperations.add(operationId);

    try {
      const result = await this.debouncedSearchPrompts(query, filters);
      return result;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Filter prompts by tags with debouncing
   */
  async filterByTags(tags, filters = {}) {
    const operationId = `filter-${Date.now()}`;
    this.activeOperations.add(operationId);

    try {
      const result = await this.debouncedFilterByTags(tags, filters);
      return result;
    } finally {
      this.activeOperations.delete(operationId);
    }
  }

  /**
   * Cancel all pending operations
   */
  cancelAll() {
    this.debouncedSearchPrompts.cancel();
    this.debouncedFilterByTags.cancel();
    
    // Cleanup deduplication
    if (this.debouncedSearchPrompts.cleanup) {
      this.debouncedSearchPrompts.cleanup();
    }
    
    this.activeOperations.clear();
  }

  /**
   * Get statistics about debounced operations
   */
  getStats() {
    return {
      activeOperations: this.activeOperations.size,
      searchPending: this.debouncedSearchPrompts.pending(),
      filterPending: this.debouncedFilterByTags.pending()
    };
  }
}

// Utility functions for React components
export const DebounceUtils = {
  /**
   * Create a cleanup function for component unmount
   */
  createCleanup: (debouncedFunctions) => {
    return () => {
      debouncedFunctions.forEach(fn => {
        if (fn && typeof fn.cancel === 'function') {
          fn.cancel();
        }
        if (fn && typeof fn.cleanup === 'function') {
          fn.cleanup();
        }
      });
    };
  },

  /**
   * Create a debounced state setter
   */
  createDebouncedStateSetter: (setState, wait = 300) => {
    return debounce((value) => setState(value), wait);
  }
};

// Create singleton debounced API client
export const debouncedApiClient = new DebouncedApiClient();

export { DebouncedFunction };