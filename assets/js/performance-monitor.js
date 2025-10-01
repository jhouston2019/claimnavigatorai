// Performance monitoring and optimization
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: 0,
      apiCalls: [],
      userInteractions: [],
      errors: [],
      memoryUsage: []
    };
    
    this.startTime = performance.now();
    this.initializeMonitoring();
  }

  initializeMonitoring() {
    // Monitor page load time
    window.addEventListener('load', () => {
      this.metrics.pageLoad = performance.now() - this.startTime;
      this.logMetric('pageLoad', this.metrics.pageLoad);
    });

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage.push({
          timestamp: Date.now(),
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }

    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor API performance
    this.monitorApiPerformance();
  }

  monitorUserInteractions() {
    const interactions = ['click', 'scroll', 'keydown', 'mousemove'];
    
    interactions.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        this.metrics.userInteractions.push({
          type: eventType,
          timestamp: Date.now(),
          target: event.target.tagName,
          x: event.clientX,
          y: event.clientY
        });
      }, { passive: true });
    });
  }

  monitorApiPerformance() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        
        self.metrics.apiCalls.push({
          url: url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          timestamp: Date.now(),
          success: response.ok
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        
        self.metrics.apiCalls.push({
          url: url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          timestamp: Date.now(),
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  }

  logMetric(name, value) {
    console.log(`Performance Metric - ${name}:`, value);
    
    // Send to analytics if available
    if (window.gtag) {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: value
      });
    }
  }

  getPerformanceReport() {
    const apiCalls = this.metrics.apiCalls;
    const successfulCalls = apiCalls.filter(call => call.success);
    const failedCalls = apiCalls.filter(call => !call.success);
    
    const avgApiTime = successfulCalls.length > 0 
      ? successfulCalls.reduce((sum, call) => sum + call.duration, 0) / successfulCalls.length 
      : 0;
    
    const slowestApiCall = apiCalls.reduce((slowest, call) => 
      call.duration > slowest.duration ? call : slowest, 
      { duration: 0 }
    );
    
    return {
      pageLoadTime: this.metrics.pageLoad,
      totalApiCalls: apiCalls.length,
      successfulApiCalls: successfulCalls.length,
      failedApiCalls: failedCalls.length,
      averageApiTime: Math.round(avgApiTime),
      slowestApiCall: slowestApiCall,
      userInteractions: this.metrics.userInteractions.length,
      memoryUsage: this.getMemoryUsage(),
      recommendations: this.getRecommendations()
    };
  }

  getMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return null;
    
    const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    return {
      used: Math.round(latest.used / 1024 / 1024), // MB
      total: Math.round(latest.total / 1024 / 1024), // MB
      limit: Math.round(latest.limit / 1024 / 1024), // MB
      percentage: Math.round((latest.used / latest.limit) * 100)
    };
  }

  getRecommendations() {
    const recommendations = [];
    const report = this.getPerformanceReport();
    
    if (report.pageLoadTime > 3000) {
      recommendations.push('Page load time is slow. Consider optimizing images and scripts.');
    }
    
    if (report.averageApiTime > 2000) {
      recommendations.push('API calls are slow. Consider implementing caching.');
    }
    
    if (report.failedApiCalls > report.successfulApiCalls * 0.1) {
      recommendations.push('High API failure rate. Check network connectivity and server status.');
    }
    
    if (report.memoryUsage && report.memoryUsage.percentage > 80) {
      recommendations.push('High memory usage. Consider optimizing data structures.');
    }
    
    return recommendations;
  }

  optimizePerformance() {
    // Clear old metrics to prevent memory leaks
    if (this.metrics.userInteractions.length > 1000) {
      this.metrics.userInteractions = this.metrics.userInteractions.slice(-500);
    }
    
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls = this.metrics.apiCalls.slice(-50);
    }
    
    // Clear cache if memory usage is high
    if (this.metrics.memoryUsage.length > 0) {
      const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      if (latest.used / latest.limit > 0.8) {
        if (window.apiClient) {
          window.apiClient.clearCache();
        }
      }
    }
  }

  // Auto-optimize every 5 minutes
  startAutoOptimization() {
    setInterval(() => {
      this.optimizePerformance();
    }, 300000); // 5 minutes
  }
}

// Initialize performance monitoring
window.performanceMonitor = new PerformanceMonitor();
window.performanceMonitor.startAutoOptimization();

// Export for debugging
window.getPerformanceReport = () => window.performanceMonitor.getPerformanceReport();
