#!/usr/bin/env node

/**
 * Performance testing script
 * Runs automated performance tests and generates reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance thresholds
const THRESHOLDS = {
  bundleSize: {
    initial: 500 * 1024, // 500KB
    total: 2 * 1024 * 1024, // 2MB
  },
  buildTime: 60000, // 60 seconds
};

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleAnalysis: null,
      buildMetrics: null,
      recommendations: [],
    };
  }

  async runTests() {
    console.log('🚀 Starting performance tests...\n');

    try {
      await this.testBuildPerformance();
      await this.analyzeBundleSize();
      await this.generateRecommendations();
      await this.saveResults();
      
      console.log('✅ Performance tests completed successfully!');
      this.printSummary();
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      process.exit(1);
    }
  }

  async testBuildPerformance() {
    console.log('📦 Testing build performance...');
    
    const startTime = Date.now();
    
    try {
      // Clean previous build
      if (fs.existsSync('.next')) {
        execSync('rm -rf .next', { stdio: 'pipe' });
      }
      
      // Run production build
      execSync('npm run build', { stdio: 'pipe' });
      
      const buildTime = Date.now() - startTime;
      
      this.results.buildMetrics = {
        buildTime,
        passed: buildTime < THRESHOLDS.buildTime,
        threshold: THRESHOLDS.buildTime,
      };
      
      console.log(`   Build time: ${buildTime}ms`);
      console.log(`   Threshold: ${THRESHOLDS.buildTime}ms`);
      console.log(`   Status: ${buildTime < THRESHOLDS.buildTime ? '✅ PASS' : '❌ FAIL'}\n`);
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async analyzeBundleSize() {
    console.log('📊 Analyzing bundle size...');
    
    try {
      const buildManifest = this.readBuildManifest();
      const bundleAnalysis = this.analyzeBuildManifest(buildManifest);
      
      this.results.bundleAnalysis = bundleAnalysis;
      
      console.log(`   Initial bundle size: ${this.formatBytes(bundleAnalysis.initialSize)}`);
      console.log(`   Total bundle size: ${this.formatBytes(bundleAnalysis.totalSize)}`);
      console.log(`   Number of chunks: ${bundleAnalysis.chunkCount}`);
      console.log(`   Largest chunk: ${this.formatBytes(bundleAnalysis.largestChunk.size)} (${bundleAnalysis.largestChunk.name})`);
      
      const initialPassed = bundleAnalysis.initialSize < THRESHOLDS.bundleSize.initial;
      const totalPassed = bundleAnalysis.totalSize < THRESHOLDS.bundleSize.total;
      
      console.log(`   Initial size status: ${initialPassed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Total size status: ${totalPassed ? '✅ PASS' : '❌ FAIL'}\n`);
      
    } catch (error) {
      console.warn(`   Warning: Could not analyze bundle size: ${error.message}\n`);
    }
  }

  readBuildManifest() {
    const manifestPath = path.join('.next', 'build-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Build manifest not found. Make sure to run build first.');
    }
    
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  analyzeBuildManifest(manifest) {
    const staticDir = path.join('.next', 'static');
    let totalSize = 0;
    let initialSize = 0;
    let chunkCount = 0;
    let largestChunk = { name: '', size: 0 };
    
    // Analyze JavaScript chunks
    const allFiles = manifest.pages['/'] || [];
    
    for (const file of allFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(staticDir, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const size = stats.size;
          
          totalSize += size;
          chunkCount++;
          
          if (file.includes('main') || file.includes('_app')) {
            initialSize += size;
          }
          
          if (size > largestChunk.size) {
            largestChunk = { name: file, size };
          }
        }
      }
    }
    
    return {
      totalSize,
      initialSize,
      chunkCount,
      largestChunk,
      passed: {
        initial: initialSize < THRESHOLDS.bundleSize.initial,
        total: totalSize < THRESHOLDS.bundleSize.total,
      },
    };
  }

  async generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Bundle size recommendations
    if (this.results.bundleAnalysis) {
      const { bundleAnalysis } = this.results;
      
      if (!bundleAnalysis.passed.initial) {
        recommendations.push({
          type: 'bundle-size',
          severity: 'high',
          message: 'Initial bundle size exceeds threshold',
          suggestion: 'Consider implementing code splitting and dynamic imports',
        });
      }
      
      if (!bundleAnalysis.passed.total) {
        recommendations.push({
          type: 'bundle-size',
          severity: 'medium',
          message: 'Total bundle size is large',
          suggestion: 'Review dependencies and remove unused code',
        });
      }
      
      if (bundleAnalysis.largestChunk.size > 200 * 1024) {
        recommendations.push({
          type: 'chunk-size',
          severity: 'medium',
          message: `Large chunk detected: ${bundleAnalysis.largestChunk.name}`,
          suggestion: 'Consider splitting this chunk further',
        });
      }
    }
    
    // Build time recommendations
    if (this.results.buildMetrics && !this.results.buildMetrics.passed) {
      recommendations.push({
        type: 'build-time',
        severity: 'medium',
        message: 'Build time exceeds threshold',
        suggestion: 'Consider optimizing webpack configuration and reducing dependencies',
      });
    }
    
    this.results.recommendations = recommendations;
    
    if (recommendations.length === 0) {
      console.log('   ✅ No performance issues detected!\n');
    } else {
      console.log(`   Found ${recommendations.length} recommendations:\n`);
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.severity.toUpperCase()}] ${rec.message}`);
        console.log(`      💡 ${rec.suggestion}\n`);
      });
    }
  }

  async saveResults() {
    const resultsDir = path.join('performance-reports');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(resultsDir, `performance-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`📄 Performance report saved to: ${reportPath}`);
  }

  printSummary() {
    console.log('\n📋 Performance Test Summary');
    console.log('================================');
    
    if (this.results.buildMetrics) {
      console.log(`Build Time: ${this.results.buildMetrics.buildTime}ms ${this.results.buildMetrics.passed ? '✅' : '❌'}`);
    }
    
    if (this.results.bundleAnalysis) {
      const { bundleAnalysis } = this.results;
      console.log(`Initial Bundle: ${this.formatBytes(bundleAnalysis.initialSize)} ${bundleAnalysis.passed.initial ? '✅' : '❌'}`);
      console.log(`Total Bundle: ${this.formatBytes(bundleAnalysis.totalSize)} ${bundleAnalysis.passed.total ? '✅' : '❌'}`);
    }
    
    const highSeverityIssues = this.results.recommendations.filter(r => r.severity === 'high').length;
    const mediumSeverityIssues = this.results.recommendations.filter(r => r.severity === 'medium').length;
    
    console.log(`High Priority Issues: ${highSeverityIssues}`);
    console.log(`Medium Priority Issues: ${mediumSeverityIssues}`);
    
    if (highSeverityIssues > 0) {
      console.log('\n⚠️  High priority performance issues detected!');
      process.exit(1);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Run the performance tests
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runTests().catch(console.error);
}

module.exports = PerformanceTester;