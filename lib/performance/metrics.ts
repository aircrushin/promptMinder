/**
 * Performance metrics collection utilities
 * Implements Core Web Vitals and custom performance metrics
 */

// Core Web Vitals metrics
export const METRICS: Record<string, string> = {
  FCP: 'first-contentful-paint',
  LCP: 'largest-contentful-paint',
  FID: 'first-input-delay',
  CLS: 'cumulative-layout-shift',
  TTFB: 'time-to-first-byte',
  INP: 'interaction-to-next-paint'
};

// Performance thresholds (in milliseconds)
export const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  [METRICS.FCP]: { good: 1800, poor: 3000 },
  [METRICS.LCP]: { good: 2500, poor: 4000 },
  [METRICS.FID]: { good: 100, poor: 300 },
  [METRICS.CLS]: { good: 0.1, poor: 0.25 },
  [METRICS.TTFB]: { good: 800, poor: 1800 },
  [METRICS.INP]: { good: 200, poor: 500 }
};

class PerformanceMetrics {
  metrics: Map<string, any>;
  observers: Map<string, any>;
  isSupported: boolean;

  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isSupported = typeof window !== 'undefined' && 'performance' in window;

    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  initializeObservers() {
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric(METRICS.FCP, entry.startTime);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);

        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric(METRICS.LCP, lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric(METRICS.CLS, clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);

        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric(METRICS.FID, (entry as any).processingStart - entry.startTime);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

      } catch (error) {
        console.warn('Performance Observer initialization failed:', error);
      }
    }

    if (window.performance && (window.performance as any).timing) {
      const timing = (window.performance as any).timing;
      const ttfb = timing.responseStart - timing.requestStart;
      this.recordMetric(METRICS.TTFB, ttfb);
    }
  }

  recordMetric(name: string, value: number, metadata: any = {}) {
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

  getRating(metricName: string, value: number) {
    const threshold = THRESHOLDS[metricName];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  reportMetric(metric: any) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_map: { metric_rating: metric.rating }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance Metric: ${metric.name}`, {
        value: `${Math.round(metric.value)}ms`,
        rating: metric.rating,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    }
  }

  getMetric(name: string) {
    return this.metrics.get(name);
  }

  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  startTiming(label: string) {
    if (this.isSupported) {
      performance.mark(`${label}-start`);
    }
  }

  endTiming(label: string) {
    if (this.isSupported) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);

      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        this.recordMetric(`custom-${label}`, measure.duration);
      }
    }
  }

  getMemoryUsage() {
    if ((performance as any).memory) {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }
    return null;
  }

  getBundleMetrics() {
    if (!this.isSupported) return null;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
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

  disconnect() {
    this.observers.forEach((observer: any) => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const performanceMetrics = new PerformanceMetrics();

// Utility functions
export function measureAsync(label: string, asyncFn: (...args: any[]) => Promise<any>) {
  return async (...args: any[]) => {
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

export function measureSync(label: string, syncFn: (...args: any[]) => any) {
  return (...args: any[]) => {
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
