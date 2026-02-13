/**
 * Performance monitoring configuration
 */

export const PERFORMANCE_CONFIG = {
  // Enable/disable performance monitoring
  enabled: process.env.NODE_ENV === 'development' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  
  // Metrics collection intervals (in milliseconds)
  intervals: {
    memory: 5000,
    metrics: 1000,
    bundle: 10000,
  },
  
  // Performance thresholds
  thresholds: {
    // Core Web Vitals (in milliseconds)
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
    inp: { good: 200, poor: 500 },
    
    // Custom metrics
    renderTime: { good: 16, poor: 50 }, // 60fps = 16ms per frame
    apiResponse: { good: 500, poor: 2000 },
    bundleSize: {
      initial: 500 * 1024, // 500KB
      total: 2 * 1024 * 1024, // 2MB
    },
    memoryUsage: {
      warning: 50 * 1024 * 1024, // 50MB
      critical: 100 * 1024 * 1024, // 100MB
    },
  },
  
  // Sampling rates (0-1, where 1 = 100% of events)
  sampling: {
    coreWebVitals: 1.0,
    customMetrics: 0.1,
    errors: 1.0,
    userInteractions: 0.5,
  },
  
  // Analytics integration
  analytics: {
    // Google Analytics 4
    ga4: {
      enabled: process.env.NEXT_PUBLIC_GA_ID !== undefined,
      measurementId: process.env.NEXT_PUBLIC_GA_ID,
    },
    
    // Custom analytics endpoint
    custom: {
      enabled: process.env.PERFORMANCE_ANALYTICS_ENDPOINT !== undefined,
      endpoint: process.env.PERFORMANCE_ANALYTICS_ENDPOINT,
      apiKey: process.env.PERFORMANCE_ANALYTICS_API_KEY,
    },
  },
  
  // Development tools
  development: {
    consoleLogging: true,
    performanceMonitor: true,
    bundleAnalyzer: false,
  },
  
  // Production settings
  production: {
    consoleLogging: false,
    performanceMonitor: false,
    errorReporting: true,
  },
  
  // Feature flags
  features: {
    memoryMonitoring: true,
    bundleAnalysis: true,
    userInteractionTracking: true,
    apiPerformanceTracking: true,
    renderPerformanceTracking: true,
    errorBoundaryTracking: true,
  },
  
  // Alert thresholds
  alerts: {
    memoryLeak: {
      enabled: true,
      threshold: 10 * 1024 * 1024, // 10MB increase
      timeWindow: 60000, // 1 minute
    },
    slowRender: {
      enabled: true,
      threshold: 100, // 100ms
      consecutiveCount: 3,
    },
    apiTimeout: {
      enabled: true,
      threshold: 5000, // 5 seconds
    },
  },
};

/**
 * Get configuration for current environment
 */
export function getPerformanceConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...PERFORMANCE_CONFIG,
    ...(isProduction ? PERFORMANCE_CONFIG.production : PERFORMANCE_CONFIG.development),
  };
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature) {
  return PERFORMANCE_CONFIG.features[feature] === true;
}

/**
 * Get threshold for a metric
 */
export function getThreshold(metric) {
  return PERFORMANCE_CONFIG.thresholds[metric];
}

/**
 * Get sampling rate for a metric type
 */
export function getSamplingRate(metricType) {
  return PERFORMANCE_CONFIG.sampling[metricType] || 1.0;
}

/**
 * Check if metric should be sampled
 */
export function shouldSample(metricType) {
  const rate = getSamplingRate(metricType);
  return Math.random() < rate;
}