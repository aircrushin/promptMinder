#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');

/**
 * CSS Optimization Script
 * Analyzes and purges unused CSS from the application
 */

const CSS_OPTIMIZATION_CONFIG = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './contexts/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  css: ['./app/globals.css'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  safelist: [
    // Tailwind CSS classes that might be dynamically generated
    /^(bg|text|border|ring|shadow|hover|focus|active|disabled|group-hover|group-focus)-/,
    // Animation classes
    /^animate-/,
    // Dark mode classes
    /^dark:/,
    // Responsive classes
    /^(sm|md|lg|xl|2xl):/,
    // State classes
    /^(hover|focus|active|disabled|group-hover|group-focus):/,
    // Component-specific classes
    'typing-effect',
    'animate-fade-in-up',
    'animate-fade-in',
    'masonry-container',
    'masonry-item',
    'smooth-scroll',
    'gpu-accelerated',
    'optimized-image',
    'aspect-ratio-container',
    'aspect-ratio-content',
  ],
  blocklist: [
    // Remove unused utility classes
    /^(space-y-|space-x-|divide-y-|divide-x-)/,
  ],
};

async function analyzeCSSUsage() {
  console.log('🔍 Analyzing CSS usage...');
  
  try {
    const purgeCSSResult = await new PurgeCSS().purge(CSS_OPTIMIZATION_CONFIG);
    
    const originalSize = fs.statSync('./app/globals.css').size;
    const purgedSize = Buffer.byteLength(purgeCSSResult[0].css, 'utf8');
    const savings = ((originalSize - purgedSize) / originalSize * 100).toFixed(2);
    
    console.log(`📊 CSS Analysis Results:`);
    console.log(`   Original size: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   Purged size: ${(purgedSize / 1024).toFixed(2)} KB`);
    console.log(`   Savings: ${savings}%`);
    
    // Write purged CSS to a temporary file for analysis
    fs.writeFileSync('./app/globals.purged.css', purgeCSSResult[0].css);
    console.log('✅ Purged CSS written to globals.purged.css for analysis');
    
    return {
      originalSize,
      purgedSize,
      savings: parseFloat(savings),
      purgedCSS: purgeCSSResult[0].css
    };
  } catch (error) {
    console.error('❌ Error analyzing CSS:', error);
    throw error;
  }
}

async function generateCSSReport() {
  console.log('📋 Generating CSS optimization report...');
  
  const analysis = await analyzeCSSUsage();
  
  const report = {
    timestamp: new Date().toISOString(),
    analysis,
    recommendations: [
      'Consider using CSS-in-JS for component-specific styles',
      'Implement critical CSS inlining for above-the-fold content',
      'Use CSS containment for better rendering performance',
      'Consider splitting CSS by route for better caching',
    ],
    optimizations: [
      'Enabled JIT mode in Tailwind CSS',
      'Configured content paths for better purging',
      'Disabled unused Tailwind core plugins',
      'Added hardware acceleration for animations',
      'Implemented CSS containment for layout optimization',
    ]
  };
  
  fs.writeFileSync('./css-optimization-report.json', JSON.stringify(report, null, 2));
  console.log('✅ CSS optimization report generated: css-optimization-report.json');
  
  return report;
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  generateCSSReport()
    .then(() => {
      console.log('🎉 CSS optimization analysis complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 CSS optimization failed:', error);
      process.exit(1);
    });
}

module.exports = {
  analyzeCSSUsage,
  generateCSSReport,
  CSS_OPTIMIZATION_CONFIG
};