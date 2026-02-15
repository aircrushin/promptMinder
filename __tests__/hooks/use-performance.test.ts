/**
 * Tests for performance monitoring infrastructure
 */

import { performanceMetrics, METRICS, THRESHOLDS } from '../../lib/performance/metrics';
import { getPerformanceConfig, isFeatureEnabled } from '../../lib/performance/config';

// Mock performance API
const mockPerformance = {
  memory: {
    usedJSHeapSize: 1024 * 1024 * 10, // 10MB
    totalJSHeapSize: 1024 * 1024 * 20, // 20MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
  },
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  mark: jest.fn(),
  measure: jest.fn(),
};

// Mock PerformanceObserver
const MockPerformanceObserver = jest.fn().mockImplementation((callback: any) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
})) as any;
MockPerformanceObserver.supportedEntryTypes = ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'];
global.PerformanceObserver = MockPerformanceObserver;

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Performance Monitoring Infrastructure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Performance Metrics', () => {
    it('should have defined metrics constants', () => {
      expect(METRICS.FCP).toBe('first-contentful-paint');
      expect(METRICS.LCP).toBe('largest-contentful-paint');
      expect(METRICS.FID).toBe('first-input-delay');
      expect(METRICS.CLS).toBe('cumulative-layout-shift');
    });

    it('should have defined thresholds', () => {
      expect(THRESHOLDS[METRICS.FCP]).toBeDefined();
      expect(THRESHOLDS[METRICS.LCP]).toBeDefined();
      expect(THRESHOLDS[METRICS.FID]).toBeDefined();
      expect(THRESHOLDS[METRICS.CLS]).toBeDefined();
    });

    it('should record custom metrics', () => {
      const testMetric = 'test-metric';
      const testValue = 100;
      
      performanceMetrics.recordMetric(testMetric, testValue);
      const recorded = performanceMetrics.getMetric(testMetric);
      
      expect(recorded).toBeDefined();
      expect(recorded.value).toBe(testValue);
      expect(recorded.name).toBe(testMetric);
    });

    it('should get memory usage when available', () => {
      const memoryUsage = performanceMetrics.getMemoryUsage();
      
      expect(memoryUsage).toEqual({
        usedJSHeapSize: 1024 * 1024 * 10,
        totalJSHeapSize: 1024 * 1024 * 20,
        jsHeapSizeLimit: 1024 * 1024 * 100,
        timestamp: expect.any(Number),
      });
    });

    it('should return null for memory usage when not available', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;

      const memoryUsage = performanceMetrics.getMemoryUsage();
      expect(memoryUsage).toBeNull();

      // Restore
      (performance as any).memory = originalMemory;
    });
  });

  describe('Performance Configuration', () => {
    it('should return configuration object', () => {
      const config = getPerformanceConfig();
      
      expect(config).toBeDefined();
      expect(config.thresholds).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should check if features are enabled', () => {
      const memoryMonitoring = isFeatureEnabled('memoryMonitoring');
      const bundleAnalysis = isFeatureEnabled('bundleAnalysis');
      
      expect(typeof memoryMonitoring).toBe('boolean');
      expect(typeof bundleAnalysis).toBe('boolean');
    });
  });

  describe('Performance Rating', () => {
    it('should rate metrics correctly', () => {
      // Test good rating
      const goodFCP = performanceMetrics.getRating(METRICS.FCP, 1000);
      expect(goodFCP).toBe('good');
      
      // Test poor rating
      const poorFCP = performanceMetrics.getRating(METRICS.FCP, 5000);
      expect(poorFCP).toBe('poor');
      
      // Test needs improvement rating
      const needsImprovementFCP = performanceMetrics.getRating(METRICS.FCP, 2500);
      expect(needsImprovementFCP).toBe('needs-improvement');
    });
  });
});