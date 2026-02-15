/**
 * Performance dashboard component
 * Displays comprehensive performance metrics and analytics
 */

import { useState, useEffect } from 'react';
import { usePerformanceMetrics, useMemoryMonitor, useBundleMetrics } from '../../hooks/use-performance';
import { Card } from '../ui/card';

export default function PerformanceDashboard() {
  const metrics = usePerformanceMetrics();
  const memoryUsage = useMemoryMonitor(1000);
  const bundleMetrics = useBundleMetrics();
  const [refreshInterval, setRefreshInterval] = useState(1000);

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
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const coreWebVitals = [
    { key: 'first-contentful-paint', label: 'First Contentful Paint (FCP)', unit: 'ms' },
    { key: 'largest-contentful-paint', label: 'Largest Contentful Paint (LCP)', unit: 'ms' },
    { key: 'first-input-delay', label: 'First Input Delay (FID)', unit: 'ms' },
    { key: 'cumulative-layout-shift', label: 'Cumulative Layout Shift (CLS)', unit: '', precision: 3 },
    { key: 'time-to-first-byte', label: 'Time to First Byte (TTFB)', unit: 'ms' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">
            Refresh Interval:
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={500}>500ms</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
            </select>
          </label>
        </div>
      </div>
      {/* Core Web Vitals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreWebVitals.map(({ key, label, unit, precision = 0 }) => {
            const metric = metrics[key];
            return (
              <Card key={key} className={`p-4 ${metric ? getRatingColor(metric.rating) : 'border-gray-200'}`}>
                <div className="text-sm font-medium text-gray-900 mb-1">{label}</div>
                <div className="text-2xl font-bold mb-1">
                  {metric ? 
                    (precision > 0 ? metric.value.toFixed(precision) : formatTime(metric.value)) : 
                    'N/A'
                  }
                  {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
                </div>
                {metric && (
                  <div className="text-xs font-medium uppercase">
                    {metric.rating.replace('-', ' ')}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      {/* Memory Usage */}
      {memoryUsage && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Used Heap Size</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(memoryUsage.usedJSHeapSize)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((memoryUsage.usedJSHeapSize / memoryUsage.totalJSHeapSize) * 100).toFixed(1)}% of total
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Total Heap Size</div>
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(memoryUsage.totalJSHeapSize)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Heap Size Limit</div>
              <div className="text-2xl font-bold text-gray-600">
                {formatBytes(memoryUsage.jsHeapSizeLimit)}
              </div>
            </Card>
          </div>
        </div>
      )}
      {/* Bundle Metrics */}
      {bundleMetrics && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bundle Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">JavaScript Size</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(bundleMetrics.totalJSSize)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {bundleMetrics.jsResourceCount} files
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">CSS Size</div>
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(bundleMetrics.totalCSSSize)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {bundleMetrics.cssResourceCount} files
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Total Resources</div>
              <div className="text-2xl font-bold text-purple-600">
                {bundleMetrics.resourceCount}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-1">Total Size</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatBytes(bundleMetrics.totalJSSize + bundleMetrics.totalCSSSize)}
              </div>
            </Card>
          </div>
        </div>
      )}
      {/* Custom Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Metrics</h2>
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(metrics)
                  .filter(([key]) => !coreWebVitals.some(cwv => cwv.key === key))
                  .slice(-10) // Show last 10 custom metrics
                  .map(([key, metric]: [string, any]) => (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {key.replace(/^(custom-|render-|api-|interaction-)/, '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTime(metric.value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(metric.rating)}`}>
                          {metric.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}