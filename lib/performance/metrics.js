/**
 * Performance metrics collection utilities
 * Implements Core Web Vitals and custom performance metrics
 */

// Core Web Vitals metrics
export const METRICS = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte',
  INP: 'interaction-to-next-paint'
};

// Performance thresholds (in milliseconds)
export const THRESHOLDS = {
  [METRICS.FCP]: { good: 1800, poor: 3000 },
  [METRICS.LCP]: { good: 2500, poor: 4000 },
  [METRICS.FID]: { good: 100, poor: 300 },
  [METRICS.CLS]: { good: 0.1, poor: 0.25 },
  [METRICS.TTFB]: { good: 800, poor: 1800 },
  [METRICS.INP]: { good: 200, poor: 500 }
};

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;
    
    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  initializeObservers() {
    // Performance Observer for navigation and paint metrics
    if ('PerformanceObserver' in window) {
      try {
        // Observe paint metrics (FCP)
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric(METRICS.FCP, entry.startTime);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);

        // Observe LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric(METRICS.LCP, lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // Observe CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric(METRICS.CLS, clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);

        // Observe FID
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(METRICS.FID, entry.processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

      } catch (error) {
        console.warn('Performance Observer initialization failed:', error);
      }
    }

    // Measure TTFB
    if (window.performance && window.performance.timing) {
      const ttfb = window.performance.timing.responseStart - window.performance.timing.requestStart;
      this.recordMetric(METRICS.TTFB, ttfb);
    }
  }

  recordMetric(name, value, metadata = {}) {
    const timestamp = Date.now();
    const metric = {
      name,
      value,
      timestamp,
      metadata,
      rating: this.getRating(name, value)
    };

    this.metrics.set(name, metric);
    this.reportMetric(metric);
  }

  getRating(metricName, value) {
    const threshold = THRESHOLDS[metricName];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  reportMetric(metric) {
    // Send to analytics service (can be customized)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: { metric_rating: metric.rating }
      });
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric: ${metric.name}`, {
        value: `${Math.round(metric.value)}ms`,
        rating: metric.rating,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Custom timing measurements
  startTiming(label) {
    if (this.isSupported) {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label) {
    if (this.isSupported) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        this.recordMetric(`custom-${label}`, measure.duration);
      }
    }
  }

  // Memory usage tracking
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }

  // Bundle size tracking
  getBundleMetrics() {
    if (!this.isSupported) return null;

    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));

    return {
      totalJSSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalCSSSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      resourceCount: resources.length,
      jsResourceCount: jsResources.length,
      cssResourceCount: cssResources.length,
      timestamp: Date.now()
    };
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetrics();

// Utility functions
export function measureAsync(label, asyncFn) {
  return async (...args) => {
    performanceMetrics.startTiming(label);
    try {
      const result = await asyncFn(...args);
      performanceMetrics.endTiming(label);
      return result;
    } catch (error) {
      performanceMetrics.endTiming(label);
      throw error;
    }
  };
}

export function measureSync(label, syncFn) {
  return (...args) => {
    performanceMetrics.startTiming(label);
    try {
      const result = syncFn(...args);
      performanceMetrics.endTiming(label);
      return result;
    } catch (error) {
      performanceMetrics.endTiming(label);
      throw error;
    }
  };
}