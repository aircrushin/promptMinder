/**
 * React hooks for API cache management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestCache, CacheInvalidationStrategies } from '../lib/api-cache';

/**
 * Hook for managing API cache operations
 */
interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
  totalAccessCount: number;
  averageAccessCount: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  hitCount?: number;
  missCount?: number;
}

interface CachedRequestOptions {
  ttl?: number;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (err: any) => void;
  cacheKey?: string;
}

interface DebouncedSearchOptions {
  wait?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
  deduplication?: boolean;
}

interface DebouncedFilterOptions {
  wait?: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export function useApiCache() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  
  const updateStats = useCallback(() => {
    setStats(requestCache.getStats());
  }, []);
  
  useEffect(() => {
    updateStats();
    
    // Update stats periodically
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [updateStats]);
  
  const invalidate = useCallback((pattern: string | RegExp) => {
    requestCache.invalidate(pattern);
    updateStats();
  }, [updateStats]);
  
  const invalidateByEndpoint = useCallback((endpoint: string) => {
    requestCache.invalidateByEndpoint(endpoint);
    updateStats();
  }, [updateStats]);
  
  const clear = useCallback(() => {
    requestCache.clear();
    updateStats();
  }, [updateStats]);
  
  const cleanup = useCallback(() => {
    const cleaned = requestCache.cleanup();
    updateStats();
    return cleaned;
  }, [updateStats]);
  
  return {
    stats,
    invalidate,
    invalidateByEndpoint,
    clear,
    cleanup,
    updateStats
  };
}

/**
 * Hook for cached API requests with automatic cache management
 */
export function useCachedRequest(requestFn: (...args: any[]) => Promise<any>, dependencies: any[] = [], options: CachedRequestOptions = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cacheHit, setCacheHit] = useState(false);
  
  const {
    ttl = 300000, // 5 minutes
    enabled = true,
    onSuccess,
    onError,
    cacheKey
  } = options;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const executeRequest = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const currentRequestId = ++requestIdRef.current;
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    setCacheHit(false);
    
    try {
      // Generate cache key
      const key = cacheKey || requestCache.generateKey(
        requestFn.toString(),
        { dependencies }
      );
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedData = requestCache.get(key);
        if (cachedData !== null) {
          // Only update if this is still the current request
          if (currentRequestId === requestIdRef.current) {
            setData(cachedData);
            setLoading(false);
            setCacheHit(true);
            onSuccess?.(cachedData);
          }
          return cachedData;
        }
      }
      
      // Execute request
      const result = await requestFn(abortControllerRef.current.signal);
      
      // Only update if this is still the current request
      if (currentRequestId === requestIdRef.current) {
        // Cache the result
        requestCache.set(key, result, ttl);
        
        setData(result);
        setLoading(false);
        onSuccess?.(result);
      }
      
      return result;
    } catch (err: any) {
      // Only update if this is still the current request and not aborted
      if (currentRequestId === requestIdRef.current && err.name !== 'AbortError') {
        setError(err);
        setLoading(false);
        onError?.(err);
      }
      throw err;
    }
  }, [requestFn, dependencies, enabled, ttl, onSuccess, onError, cacheKey]);
  
  const refresh = useCallback(() => {
    return executeRequest(true);
  }, [executeRequest]);
  
  const invalidateCache = useCallback(() => {
    const key = cacheKey || requestCache.generateKey(
      requestFn.toString(),
      { dependencies }
    );
    requestCache.invalidate(key);
  }, [requestFn, dependencies, cacheKey]);
  
  // Execute request when dependencies change
  useEffect(() => {
    executeRequest();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);
  
  return {
    data,
    loading,
    error,
    cacheHit,
    refresh,
    invalidateCache,
    execute: executeRequest
  };
}

/**
 * Hook for cache invalidation strategies
 */
export function useCacheInvalidation() {
  const onPromptMutation = useCallback(() => {
    CacheInvalidationStrategies.onPromptMutation(requestCache);
  }, []);
  
  const onPromptUpdate = useCallback((promptId: string) => {
    CacheInvalidationStrategies.onPromptUpdate(requestCache, promptId);
  }, []);
  
  const onTagMutation = useCallback(() => {
    CacheInvalidationStrategies.onTagMutation(requestCache);
  }, []);
  
  const onGlobalRefresh = useCallback(() => {
    CacheInvalidationStrategies.onGlobalRefresh(requestCache);
  }, []);
  
  return {
    onPromptMutation,
    onPromptUpdate,
    onTagMutation,
    onGlobalRefresh
  };
}

/**
 * Hook for cache warming (preloading data)
 */
export function useCacheWarming() {
  const warmCache = useCallback(async (requests: Array<{ requestFn: (...args: any[]) => Promise<any>; key?: string; ttl?: number }>) => {
    const promises = requests.map(async ({ requestFn, key, ttl }) => {
      try {
        const cacheKey = key || requestCache.generateKey(requestFn.toString());
        
        // Only warm if not already cached
        if (!requestCache.has(cacheKey)) {
          const data = await requestFn();
          requestCache.set(cacheKey, data, ttl);
        }
      } catch (error) {
        console.warn('Cache warming failed for request:', error);
      }
    });
    
    await Promise.allSettled(promises);
  }, []);
  
  return { warmCache };
}

/**
 * Hook for monitoring cache performance
 */
export function useCacheMonitoring() {
  const [metrics, setMetrics] = useState({
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    cacheSize: 0
  });
  
  const updateMetrics = useCallback(() => {
    const stats = requestCache.getStats();
    setMetrics({
      hitRate: stats.hitRate,
      missRate: stats.missRate,
      totalRequests: stats.totalAccessCount,
      cacheSize: stats.activeEntries
    });
  }, []);
  
  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [updateMetrics]);
  
  return metrics;
}

export function usePrefetching() {
  const [stats, setStats] = useState({
    queueLength: 0,
    activePrefetches: 0,
    totalPrefetched: 0
  });

  const updateStats = useCallback(() => {
    // Import here to avoid circular dependencies
    import('../lib/data-prefetching').then(({ dataPrefetchingService }) => {
      setStats(dataPrefetchingService.getStats());
    });
  }, []);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const prefetchForContext = useCallback(async (context: any) => {
    const { dataPrefetchingService } = await import('../lib/data-prefetching');
    await dataPrefetchingService.prefetchForContext(context);
    updateStats();
  }, [updateStats]);

  const recordUserBehavior = useCallback(async (action: string, context: any) => {
    const { dataPrefetchingService } = await import('../lib/data-prefetching');
    dataPrefetchingService.recordUserBehavior(action, context);
  }, []);

  const prefetchPromptDetails = useCallback(async (promptId: string) => {
    const { dataPrefetchingService } = await import('../lib/data-prefetching');
    await dataPrefetchingService.prefetchPromptDetails(promptId);
    updateStats();
  }, [updateStats]);

  const prefetchNextPage = useCallback(async (context: any) => {
    const { dataPrefetchingService } = await import('../lib/data-prefetching');
    await dataPrefetchingService.prefetchNextPage(context);
    updateStats();
  }, [updateStats]);

  return {
    stats,
    prefetchForContext,
    recordUserBehavior,
    prefetchPromptDetails,
    prefetchNextPage
  };
}

/**
 * Hook for hover-based prefetching
 */
export function useHoverPrefetch(getContext: (event: any) => any) {
  const { recordUserBehavior, prefetchForContext } = usePrefetching();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback((event: any) => {
    hoverTimeoutRef.current = setTimeout(async () => {
      const context = getContext(event);
      await recordUserBehavior('hover', context);
      await prefetchForContext(context);
    }, 200);
  }, [getContext, recordUserBehavior, prefetchForContext]);

  const onMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook for scroll-based prefetching
 */
export function useScrollPrefetch(getContext: (event: any) => any) {
  const { recordUserBehavior, prefetchForContext } = usePrefetching();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useCallback((event: any) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(async () => {
      const context = getContext(event);
      await recordUserBehavior('scroll', context);
      await prefetchForContext(context);
    }, 300);
  }, [getContext, recordUserBehavior, prefetchForContext]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { onScroll };
}/**
 *
 Hook for debounced search operations
 */
export function useDebouncedSearch(searchFn: (...args: any[]) => Promise<any>, options: DebouncedSearchOptions = {}) {
  const {
    wait = 300,
    maxWait = 1000,
    leading = false,
    trailing = true,
    deduplication = true
  } = options;

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchError, setSearchError] = useState(null);
  
  const debouncedSearchRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create debounced search function
  useEffect(() => {
    const { createDebouncedApiSearch } = require('../lib/debounce-utils');

    debouncedSearchRef.current = createDebouncedApiSearch(
      async (query: any, filters: any, options: any) => {
        setIsSearching(true);
        setSearchError(null);
        
        try {
          const result = await searchFn(query, filters, options);
          setSearchResults(result);
          return result;
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            setSearchError(error);
          }
          throw error;
        } finally {
          setIsSearching(false);
        }
      },
      { wait, maxWait, leading, trailing, deduplication }
    );

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current.cleanup();
      }
    };
  }, [searchFn, wait, maxWait, leading, trailing, deduplication]);

  const search = useCallback(async (query: any, filters: any = {}) => {
    if (!debouncedSearchRef.current) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      return await debouncedSearchRef.current(query, filters, {
        signal: abortControllerRef.current.signal
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
      }
    }
  }, []);

  const cancelSearch = useCallback(() => {
    if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsSearching(false);
  }, []);

  const flushSearch = useCallback(() => {
    if (debouncedSearchRef.current) {
      return debouncedSearchRef.current.flush();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSearch();
    };
  }, [cancelSearch]);

  return {
    search,
    cancelSearch,
    flushSearch,
    isSearching,
    searchResults,
    searchError,
    isPending: debouncedSearchRef.current?.pending() || false
  };
}

/**
 * Hook for debounced filtering operations
 */
export function useDebouncedFilter(filterFn: (...args: any[]) => Promise<any>, options: DebouncedFilterOptions = {}) {
  const {
    wait = 200,
    maxWait = 800,
    leading = false,
    trailing = true
  } = options;

  const [isFiltering, setIsFiltering] = useState(false);
  const [filterResults, setFilterResults] = useState(null);
  const [filterError, setFilterError] = useState(null);
  
  const debouncedFilterRef = useRef<any>(null);

  // Create debounced filter function
  useEffect(() => {
    const { createDebouncedTagFilter } = require('../lib/debounce-utils');

    debouncedFilterRef.current = createDebouncedTagFilter(
      async (filters: any) => {
        setIsFiltering(true);
        setFilterError(null);
        
        try {
          const result = await filterFn(filters);
          setFilterResults(result);
          return result;
        } catch (error) {
          setFilterError(error);
          throw error;
        } finally {
          setIsFiltering(false);
        }
      },
      { wait, maxWait, leading, trailing }
    );

    return () => {
      if (debouncedFilterRef.current) {
        debouncedFilterRef.current.cancel();
      }
    };
  }, [filterFn, wait, maxWait, leading, trailing]);

  const filter = useCallback(async (filters: any) => {
    if (!debouncedFilterRef.current) return;
    
    try {
      return await debouncedFilterRef.current(filters);
    } catch (error) {
      console.error('Filter error:', error);
    }
  }, []);

  const cancelFilter = useCallback(() => {
    if (debouncedFilterRef.current) {
      debouncedFilterRef.current.cancel();
    }
    setIsFiltering(false);
  }, []);

  const flushFilter = useCallback(() => {
    if (debouncedFilterRef.current) {
      return debouncedFilterRef.current.flush();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelFilter();
    };
  }, [cancelFilter]);

  return {
    filter,
    cancelFilter,
    flushFilter,
    isFiltering,
    filterResults,
    filterError,
    isPending: debouncedFilterRef.current?.pending() || false
  };
}

/**
 * Hook for debounced state updates
 */
export function useDebouncedState<T>(initialValue: T, wait = 300) {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  const debouncedSetterRef = useRef<any>(null);

  useEffect(() => {
    const { DebounceUtils } = require('../lib/debounce-utils');
    debouncedSetterRef.current = DebounceUtils.createDebouncedStateSetter(
      setDebouncedValue,
      wait
    );

    return () => {
      if (debouncedSetterRef.current) {
        debouncedSetterRef.current.cancel();
      }
    };
  }, [wait]);

  useEffect(() => {
    if (debouncedSetterRef.current) {
      debouncedSetterRef.current(value);
    }
  }, [value]);

  const cancel = useCallback(() => {
    if (debouncedSetterRef.current) {
      debouncedSetterRef.current.cancel();
    }
  }, []);

  const flush = useCallback(() => {
    if (debouncedSetterRef.current) {
      debouncedSetterRef.current.flush();
    }
  }, []);

  return [value, setValue, debouncedValue, { cancel, flush }];
}