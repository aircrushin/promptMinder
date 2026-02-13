/**
 * Performance monitoring component
 * Provides real-time performance metrics display for development
 */

import { useState, useEffect } from 'react';
import { usePerformanceMetrics, useMemoryMonitor, useBundleMetrics } from '../../hooks/use-performance';

export default function PerformanceMonitor({ enabled = process.env.NODE_ENV === 'development' }) {
  const [isVisible, setIsVisible] = useState(false);
  const metrics = usePerformanceMetrics();
  const memoryUsage = useMemoryMonitor(2000);
  const bundleMetrics = useBundleMetrics();

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Toggle with Ctrl+Shift+P
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    if (enabled) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [enabled]);

  if (!enabled || !isVisible) {
    return null;
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    if (!ms) return '0ms';
    return Math.round(ms) + 'ms';
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg shadow-lg max-w-sm z-50 font-mono text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      {/* Core Web Vitals */}
      <div className="mb-3">
        <h4 className="font-semibold mb-1">Core Web Vitals</h4>
        <div className="space-y-1">
          {metrics['first-contentful-paint'] && (
            <div className="flex justify-between">
              <span>FCP:</span>
              <span className={getRatingColor(metrics['first-contentful-paint'].rating)}>
                {formatTime(metrics['first-contentful-paint'].value)}
              </span>
            </div>
          )}
          {metrics['largest-contentful-paint'] && (
            <div className="flex justify-between">
              <span>LCP:</span>
              <span className={getRatingColor(metrics['largest-contentful-paint'].rating)}>
                {formatTime(metrics['largest-contentful-paint'].value)}
              </span>
            </div>
          )}
          {metrics['first-input-delay'] && (
            <div className="flex justify-between">
              <span>FID:</span>
              <span className={getRatingColor(metrics['first-input-delay'].rating)}>
                {formatTime(metrics['first-input-delay'].value)}
              </span>
            </div>
          )}
          {metrics['cumulative-layout-shift'] && (
            <div className="flex justify-between">
              <span>CLS:</span>
              <span className={getRatingColor(metrics['cumulative-layout-shift'].rating)}>
                {metrics['cumulative-layout-shift'].value.toFixed(3)}
              </span>
            </div>
          )}
        </div>
      </div>
      {/* Memory Usage */}
      {memoryUsage && (
        <div className="mb-3">
          <h4 className="font-semibold mb-1">Memory Usage</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Used:</span>
              <span>{formatBytes(memoryUsage.usedJSHeapSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total:</span>
              <span>{formatBytes(memoryUsage.totalJSHeapSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Limit:</span>
              <span>{formatBytes(memoryUsage.jsHeapSizeLimit)}</span>
            </div>
          </div>
        </div>
      )}
      {/* Bundle Metrics */}
      {bundleMetrics && (
        <div className="mb-3">
          <h4 className="font-semibold mb-1">Bundle Size</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>JS:</span>
              <span>{formatBytes(bundleMetrics.totalJSSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>CSS:</span>
              <span>{formatBytes(bundleMetrics.totalCSSSize)}</span>
            </div>
            <div className="flex justify-between">
              <span>Resources:</span>
              <span>{bundleMetrics.resourceCount}</span>
            </div>
          </div>
        </div>
      )}
      {/* Custom Metrics */}
      <div className="mb-3">
        <h4 className="font-semibold mb-1">Custom Metrics</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {Object.entries(metrics)
            .filter(([key]) => key.startsWith('custom-') || key.startsWith('render-') || key.startsWith('api-'))
            .slice(-5) // Show last 5 custom metrics
            .map(([key, metric]: [string, any]) => (
              <div key={key} className="flex justify-between">
                <span className="truncate mr-2">{key.replace(/^(custom-|render-|api-)/, '')}:</span>
                <span>{formatTime(metric.value)}</span>
              </div>
            ))}
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-2">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

/**
 * Performance metrics display component for production monitoring
 */
export function PerformanceMetricsDisplay({ metrics }) {
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No performance metrics available
      </div>
    );
  }

  const formatTime = (ms) => Math.round(ms) + 'ms';
  
  const getRatingColor = (rating) => {
    switch (rating) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Object.entries(metrics).map(([key, metric]: [string, any]) => (
        <div key={key} className="bg-white p-3 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {key.replace(/-/g, ' ').toUpperCase()}
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {formatTime(metric.value)}
          </div>
          <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(metric.rating)}`}>
            {metric.rating}
          </div>
        </div>
      ))}
    </div>
  );
}