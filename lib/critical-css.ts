// @ts-nocheck
/**
 * Critical CSS utilities for performance optimization
 */

// Critical CSS for above-the-fold content
export const CRITICAL_CSS = `
  /* Critical styles for initial page load */
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-display: swap;
    margin: 0;
    padding: 0;
  }
  
  /* Header styles */
  .header-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  /* Loading states */
  .loading-spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Skeleton loading */
  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Component-specific CSS modules
export const componentStyles = {
  promptCard: {
    container: 'transform transition-all duration-300 hover:scale-105 hover:shadow-lg',
    content: 'p-4 space-y-3',
    title: 'text-lg font-semibold line-clamp-2',
    description: 'text-sm text-gray-600 line-clamp-3',
    tags: 'flex flex-wrap gap-2 mt-2',
    tag: 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full',
  },
  
  chatInterface: {
    container: 'flex flex-col h-full',
    messages: 'flex-1 overflow-y-auto p-4 space-y-4',
    input: 'border-t p-4 flex gap-2',
    message: 'max-w-[80%] p-3 rounded-lg',
    userMessage: 'ml-auto bg-blue-500 text-white',
    assistantMessage: 'mr-auto bg-gray-100 text-gray-900',
  },
  
  navigation: {
    container: 'flex items-center justify-between p-4',
    logo: 'text-xl font-bold',
    menu: 'hidden md:flex items-center space-x-6',
    mobileMenu: 'md:hidden',
    link: 'text-gray-700 hover:text-blue-600 transition-colors',
  },
};

/**
 * Injects critical CSS into the document head
 */
export function injectCriticalCSS() {
  if (typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = CRITICAL_CSS;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);
}

/**
 * Preloads CSS for a specific route
 */
export function preloadRouteCSS(route) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = `/_next/static/css/${route}.css`;
  document.head.appendChild(link);
}

/**
 * Generates component-specific CSS classes
 */
export function generateComponentCSS(componentName, styles) {
  return Object.entries(styles).reduce((acc, [key, value]) => {
    acc[`${componentName}__${key}`] = value;
    return acc;
  }, {});
}

/**
 * CSS-in-JS utility for dynamic styles
 */
export function createStyleSheet(styles) {
  if (typeof document === 'undefined') return;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = Object.entries(styles)
    .map(([selector, rules]) => {
      const ruleString = Object.entries(rules)
        .map(([property, value]) => `${property}: ${value};`)
        .join(' ');
      return `.${selector} { ${ruleString} }`;
    })
    .join('\n');
  
  document.head.appendChild(styleSheet);
  return styleSheet;
}

/**
 * Removes non-critical CSS after page load
 */
export function deferNonCriticalCSS() {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('load', () => {
    const nonCriticalLinks = document.querySelectorAll('link[rel="preload"][as="style"]');
    nonCriticalLinks.forEach(link => {
      link.rel = 'stylesheet';
    });
  });
}

export default {
  CRITICAL_CSS,
  componentStyles,
  injectCriticalCSS,
  preloadRouteCSS,
  generateComponentCSS,
  createStyleSheet,
  deferNonCriticalCSS,
};