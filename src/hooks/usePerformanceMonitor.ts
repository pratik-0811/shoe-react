import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../services/logger';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(Date.now());
  const updateCountRef = useRef<number>(0);
  const isFirstRenderRef = useRef<boolean>(true);

  // Track component mount time
  useEffect(() => {
    const mountTime = Date.now() - mountTimeRef.current;
    logger.trackPerformance(`${componentName} Mount`, mountTime, {
      componentName,
      type: 'mount'
    });

    return () => {
      // Track component unmount
      logger.trackPerformance(`${componentName} Unmount`, 0, {
        componentName,
        type: 'unmount',
        totalUpdates: updateCountRef.current
      });
    };
  }, [componentName]);

  // Track render performance
  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      logger.trackPerformance(`${componentName} First Render`, renderTime, {
        componentName,
        type: 'firstRender'
      });
    } else {
      updateCountRef.current += 1;
      logger.trackPerformance(`${componentName} Re-render`, renderTime, {
        componentName,
        type: 'rerender',
        updateCount: updateCountRef.current
      });
    }
  });

  // Start render timing
  renderStartRef.current = Date.now();

  // Track user interactions
  const trackUserInteraction = useCallback((action: string, details?: any) => {
    logger.trackUserAction(`${componentName}: ${action}`, {
      componentName,
      ...details
    });
  }, [componentName]);

  // Track API calls from component
  const trackApiCall = useCallback((method: string, url: string, startTime: number, status: number, details?: any) => {
    const duration = Date.now() - startTime;
    logger.trackApiCall(method, url, duration, status, {
      componentName,
      ...details
    });
  }, [componentName]);

  // Get performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return {
      componentName,
      renderTime: Date.now() - renderStartRef.current,
      mountTime: Date.now() - mountTimeRef.current,
      updateCount: updateCountRef.current
    };
  }, [componentName]);

  return {
    trackUserInteraction,
    trackApiCall,
    getMetrics
  };
};

// Hook for tracking page views
export const usePageView = (pageName: string) => {
  useEffect(() => {
    const startTime = Date.now();
    
    logger.info(`Page View: ${pageName}`, {
      pageName,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    });

    return () => {
      const timeOnPage = Date.now() - startTime;
      logger.trackPerformance(`Time on ${pageName}`, timeOnPage, {
        pageName,
        type: 'timeOnPage'
      });
    };
  }, [pageName]);
};

// Hook for tracking form interactions
export const useFormTracking = (formName: string) => {
  const trackFormStart = useCallback(() => {
    logger.trackUserAction(`Form Started: ${formName}`, {
      formName,
      timestamp: new Date().toISOString()
    });
  }, [formName]);

  const trackFormSubmit = useCallback((success: boolean, errors?: any) => {
    logger.trackUserAction(`Form Submitted: ${formName}`, {
      formName,
      success,
      errors,
      timestamp: new Date().toISOString()
    });
  }, [formName]);

  const trackFieldInteraction = useCallback((fieldName: string, action: string) => {
    logger.trackUserAction(`Form Field: ${formName}.${fieldName}`, {
      formName,
      fieldName,
      action,
      timestamp: new Date().toISOString()
    });
  }, [formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFieldInteraction
  };
};

// Hook for tracking search and filter interactions
export const useSearchTracking = () => {
  const trackSearch = useCallback((query: string, results: number, filters?: any) => {
    logger.trackUserAction('Search Performed', {
      query,
      results,
      filters,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackFilterChange = useCallback((filterType: string, filterValue: any, results: number) => {
    logger.trackUserAction('Filter Applied', {
      filterType,
      filterValue,
      results,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    trackSearch,
    trackFilterChange
  };
};

// Hook for tracking e-commerce events
export const useEcommerceTracking = () => {
  const trackProductView = useCallback((productId: string, productName: string, category?: string, price?: number) => {
    logger.trackUserAction('Product Viewed', {
      productId,
      productName,
      category,
      price,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackAddToCart = useCallback((productId: string, productName: string, quantity: number, price: number) => {
    logger.trackUserAction('Product Added to Cart', {
      productId,
      productName,
      quantity,
      price,
      value: price * quantity,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackRemoveFromCart = useCallback((productId: string, productName: string, quantity: number) => {
    logger.trackUserAction('Product Removed from Cart', {
      productId,
      productName,
      quantity,
      timestamp: new Date().toISOString()
    });
  }, []);

  const trackPurchase = useCallback((orderId: string, total: number, items: any[]) => {
    logger.trackUserAction('Purchase Completed', {
      orderId,
      total,
      items,
      itemCount: items.length,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackPurchase
  };
};