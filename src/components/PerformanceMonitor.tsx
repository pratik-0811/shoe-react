import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { logger } from '../services/logger';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  useEffect(() => {
    if (!enabled || import.meta.env.MODE !== 'production') {
      return;
    }

    const sendToAnalytics = (metric: Metric) => {
      // Log performance metrics
      logger.trackPerformance(metric.name, metric.value, {
        id: metric.id,
        delta: metric.delta,
        rating: metric.rating,
        navigationType: metric.navigationType
      });

      // Send to analytics service if available
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };

    // Track Core Web Vitals
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics); // INP replaced FID in web-vitals v5
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    // Track custom performance metrics
    const trackCustomMetrics = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // DOM Content Loaded
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
          logger.trackPerformance('DOM_CONTENT_LOADED', domContentLoaded, {
            type: 'custom_metric'
          });

          // Page Load Time
          const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
          logger.trackPerformance('PAGE_LOAD_TIME', pageLoadTime, {
            type: 'custom_metric'
          });

          // DNS Lookup Time
          const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
          logger.trackPerformance('DNS_LOOKUP_TIME', dnsTime, {
            type: 'custom_metric'
          });

          // Server Response Time
          const serverResponseTime = navigation.responseEnd - navigation.requestStart;
          logger.trackPerformance('SERVER_RESPONSE_TIME', serverResponseTime, {
            type: 'custom_metric'
          });
        }
      }
    };

    // Track metrics after page load
    if (document.readyState === 'complete') {
      trackCustomMetrics();
    } else {
      window.addEventListener('load', trackCustomMetrics);
    }

    // Track resource loading performance
    const trackResourceMetrics = () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      resources.forEach((resource) => {
        if (resource.duration > 1000) { // Only track slow resources
          logger.trackPerformance('SLOW_RESOURCE', resource.duration, {
            type: 'resource_timing',
            name: resource.name,
            initiatorType: resource.initiatorType,
            transferSize: resource.transferSize
          });
        }
      });
    };

    setTimeout(trackResourceMetrics, 5000); // Track after 5 seconds

    // Track memory usage if available
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        logger.trackPerformance('MEMORY_USAGE', memory.usedJSHeapSize, {
          type: 'memory_metric',
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    // Track memory usage periodically
    const memoryInterval = setInterval(trackMemoryUsage, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryInterval);
      window.removeEventListener('load', trackCustomMetrics);
    };
  }, [enabled]);

  return null;
};

export default PerformanceMonitor;

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}