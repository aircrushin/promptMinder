# Performance Monitoring Infrastructure

This directory contains the performance monitoring and measurement infrastructure for the application.

## Overview

The performance monitoring system provides comprehensive tracking of:
- Core Web Vitals (FCP, LCP, FID, CLS, TTFB)
- Custom performance metrics
- Memory usage monitoring
- Bundle size analysis
- API response times
- Component render performance

## Components

### Core Files

- **`metrics.js`** - Core performance metrics collection and reporting
- **`config.js`** - Configuration settings and thresholds
- **`README.md`** - This documentation file

### React Integration

- **`hooks/use-performance.js`** - React hooks for performance monitoring
- **`contexts/PerformanceContext.js`** - React context provider
- **`components/performance/`** - Performance monitoring UI components

### Build Tools

- **`scripts/performance-test.js`** - Automated performance testing
- **`next.config.js`** - Bundle analyzer configuration

## Usage

### Basic Setup

1. Wrap your app with the PerformanceProvider:

```jsx
import { PerformanceProvider } from './contexts/PerformanceContext';

function App() {
  return (
    <PerformanceProvider>
      <YourApp />
    </PerformanceProvider>
  );
}
```

2. Use performance hooks in components:

```jsx
import { useRenderPerformance, useMemoryMonitor } from './hooks/use-performance';

function MyComponent() {
  useRenderPerformance('MyComponent');
  const memoryUsage = useMemoryMonitor();
  
  return <div>Component content</div>;
}
```

### Performance Monitoring

Enable the development performance monitor by pressing `Ctrl+Shift+P` in development mode.

### Bundle Analysis

Run bundle analysis:

```bash
npm run analyze
```

### Performance Testing

Run automated performance tests:

```bash
npm run performance:test
```

## Configuration

Performance monitoring can be configured in `lib/performance/config.js`:

```javascript
export const PERFORMANCE_CONFIG = {
  enabled: true,
  thresholds: {
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    // ... other thresholds
  },
  // ... other settings
};
```

## Metrics Collected

### Core Web Vitals

- **First Contentful Paint (FCP)** - Time to first content render
- **Largest Contentful Paint (LCP)** - Time to largest content render
- **First Input Delay (FID)** - Time from first user interaction to response
- **Cumulative Layout Shift (CLS)** - Visual stability metric
- **Time to First Byte (TTFB)** - Server response time

### Custom Metrics

- Component render times
- API response times
- Memory usage
- Bundle sizes
- User interaction performance

## Performance Thresholds

Metrics are rated as:
- **Good** - Meets performance targets
- **Needs Improvement** - Below targets but acceptable
- **Poor** - Significantly below targets

## Development Tools

### Performance Monitor

A real-time performance monitor is available in development mode. Toggle with `Ctrl+Shift+P`.

### Performance Dashboard

A comprehensive dashboard showing all metrics is available at `/performance` (when implemented).

### Bundle Analyzer

Visual bundle analysis reports are generated in `.next/analyze/` when running `npm run analyze`.

## Testing

Performance monitoring includes automated tests:

```bash
npm test -- __tests__/hooks/use-performance.test.js
```

## Scripts

- `npm run analyze` - Generate bundle analysis reports
- `npm run performance:test` - Run performance tests
- `npm run build:analyze` - Build with analysis

## Environment Variables

- `ENABLE_PERFORMANCE_MONITORING` - Enable monitoring in production
- `PERFORMANCE_ANALYTICS_ENDPOINT` - Custom analytics endpoint
- `PERFORMANCE_ANALYTICS_API_KEY` - Analytics API key

## Browser Support

Performance monitoring uses modern browser APIs:
- Performance Observer API
- Performance Memory API
- Performance Navigation Timing API

Graceful degradation is implemented for unsupported browsers.

## Best Practices

1. Use performance hooks sparingly in production
2. Configure appropriate sampling rates for high-traffic applications
3. Monitor Core Web Vitals regularly
4. Set up alerts for performance regressions
5. Use bundle analysis to identify optimization opportunities

## Troubleshooting

### Common Issues

1. **Performance Observer not supported** - Gracefully degrades, no action needed
2. **Memory API unavailable** - Normal in some browsers, monitoring continues
3. **Bundle analysis fails** - Ensure build completes successfully first

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` or enabling console logging in config.

## Contributing

When adding new performance metrics:

1. Add metric definition to `METRICS` constant
2. Set appropriate thresholds in `THRESHOLDS`
3. Implement collection logic in `PerformanceMetrics` class
4. Add tests for new functionality
5. Update documentation