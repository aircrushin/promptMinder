/**
 * Performance monitoring context
 * Provides performance monitoring capabilities throughout the app
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { performanceMetrics } from '../lib/performance/metrics';
import { getPerformanceConfig } from '../lib/performance/config';

const PerformanceContext = createContext({});

export function PerformanceProvider({ children }) {
  const [config] = useState(getPerformanceConfig());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (config.enabled && !isInitialized) {
      // Initialize performance monitoring
      console.log('🚀 Performance monitoring initialized');
      setIsInitialized(true);
      
      // Set up global error handling for performance issues
      const handleError = (error) => {
        performanceMetrics.recordMetric('error-boundary', Date.now(), {
          error: error.message,
          stack: error.stack,
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', (event) => {
        handleError(new Error(event.reason));
      });

      return () => {
        window.removeEventListener('error', handleError);
        performanceMetrics.disconnect();
      };
    }
  }, [config.enabled, isInitialized]);

  const value = {
    config,
    isInitialized,
    performanceMetrics,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}