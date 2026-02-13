/**
 * React hooks for performance monitoring
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { performanceMetrics, measureAsync, measureSync } from '../lib/performance/metrics';

/**
 * Hook to monitor component render performance
 */
export function useRenderPerformance(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (renderCount.current > 1) {
      performanceMetrics.recordMetric(
        `render-${componentName}`,
        timeSinceLastRender,
        { renderCount: renderCount.current }
      );
    }
    
    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
}

/**
 * Hook to measure async operations
 */
export function useAsyncPerformance() {
  const measureAsyncOperation = useCallback((label, asyncFn) => {
    return measureAsync(label, asyncFn);
  }, []);

  return { measureAsyncOperation };
}

/**
 * Hook to measure synchronous operations
 */
export function useSyncPerformance() {
  const measureSyncOperation = useCallback((label, syncFn) => {
    return measureSync(label, syncFn);
  }, []);

  return { measureSyncOperation };
}

/**
 * Hook to track memory usage
 */
export function useMemoryMonitor(interval = 5000) {
  const [memoryUsage, setMemoryUsage] = useState(null);

  useEffect(() => {
    const updateMemoryUsage = () => {
      const usage = performanceMetrics.getMemoryUsage();
      if (usage) {
        setMemoryUsage(usage);
      }
    };

    updateMemoryUsage();
    const intervalId = setInterval(updateMemoryUsage, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryUsage;
}

/**
 * Hook to track bundle metrics
 */
export function useBundleMetrics() {
  const [bundleMetrics, setBundleMetrics] = useState(null);

  useEffect(() => {
    const updateBundleMetrics = () => {
      const metrics = performanceMetrics.getBundleMetrics();
      if (metrics) {
        setBundleMetrics(metrics);
      }
    };

    // Wait for resources to load
    if (document.readyState === 'complete') {
      updateBundleMetrics();
    } else {
      window.addEventListener('load', updateBundleMetrics);
      return () => window.removeEventListener('load', updateBundleMetrics);
    }
  }, []);

  return bundleMetrics;
}

/**
 * Hook to get all performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMetrics.getAllMetrics());
    };

    updateMetrics();
    
    // Update metrics periodically
    const intervalId = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return metrics;
}

/**
 * Hook to measure component mount/unmount performance
 */
export function useMountPerformance(componentName) {
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    performanceMetrics.recordMetric(
      `mount-${componentName}`,
      mountDuration,
      { type: 'mount' }
    );

    return () => {
      const unmountTime = Date.now();
      const totalLifetime = unmountTime - mountTime.current;
      performanceMetrics.recordMetric(
        `unmount-${componentName}`,
        totalLifetime,
        { type: 'lifetime' }
      );
    };
  }, [componentName]);
}

/**
 * Hook to measure API request performance
 */
export function useApiPerformance() {
  const measureApiCall = useCallback(async (endpoint, requestFn) => {
    const startTime = Date.now();
    
    try {
      const result = await requestFn();
      const duration = Date.now() - startTime;
      
      performanceMetrics.recordMetric(
        `api-${endpoint}`,
        duration,
        { 
          type: 'api-success',
          endpoint,
          status: 'success'
        }
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      performanceMetrics.recordMetric(
        `api-${endpoint}-error`,
        duration,
        { 
          type: 'api-error',
          endpoint,
          status: 'error',
          error: error.message
        }
      );
      
      throw error;
    }
  }, []);

  return { measureApiCall };
}

/**
 * Hook to track user interactions performance
 */
export function useInteractionPerformance() {
  const measureInteraction = useCallback((interactionType, handler) => {
    return async (event) => {
      const startTime = Date.now();
      
      try {
        const result = await handler(event);
        const duration = Date.now() - startTime;
        
        performanceMetrics.recordMetric(
          `interaction-${interactionType}`,
          duration,
          { 
            type: 'user-interaction',
            interactionType
          }
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        performanceMetrics.recordMetric(
          `interaction-${interactionType}-error`,
          duration,
          { 
            type: 'user-interaction-error',
            interactionType,
            error: error.message
          }
        );
        
        throw error;
      }
    };
  }, []);

  return { measureInteraction };
}