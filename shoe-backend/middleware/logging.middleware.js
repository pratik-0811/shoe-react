const morgan = require('morgan');
const logger = require('../config/logger');

// Custom Morgan token for response time
morgan.token('response-time-ms', (req, res) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom Morgan token for user ID
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

// Custom Morgan token for request ID (if you implement request tracking)
morgan.token('request-id', (req) => {
  return req.requestId || '-';
});

// Define custom format for Morgan
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms'
  : ':method :url :status :response-time ms - :res[content-length]';

// Create Morgan middleware
const morganMiddleware = morgan(morganFormat, {
  stream: logger.stream,
  skip: (req, res) => {
    // Skip logging for health checks and static files in production
    if (process.env.NODE_ENV === 'production') {
      return req.url === '/health' || 
             req.url === '/favicon.ico' || 
             req.url.startsWith('/uploads/');
    }
    return false;
  }
});

// Response time middleware
const responseTimeMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to calculate response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Only set header if headers haven't been sent yet
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', responseTime);
    }
    
    // Log slow requests
    if (responseTime > 1000) {
      logger.warn({
        message: 'Slow request detected',
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Request ID middleware for tracking
const requestIdMiddleware = (req, res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  if (!res.headersSent) {
    res.setHeader('X-Request-ID', req.requestId);
  }
  next();
};

// Error logging middleware
const errorLoggingMiddleware = (err, req, res, next) => {
  // Log the error with context
  logger.logError(err, req, {
    requestId: req.requestId,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
};

// Success logging middleware for important operations
const successLoggingMiddleware = (operation) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logger.info({
          message: `${operation} successful`,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          userId: req.user?.id,
          ip: req.ip,
          requestId: req.requestId
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Database operation logging
const logDatabaseOperation = (operation, model, query = {}) => {
  const startTime = Date.now();
  
  return {
    success: (result) => {
      const executionTime = Date.now() - startTime;
      logger.logDatabase(operation, model, query, {
        ...result,
        executionTime: `${executionTime}ms`
      });
    },
    error: (error) => {
      const executionTime = Date.now() - startTime;
      logger.error({
        message: `Database ${operation} failed`,
        model,
        query,
        error: error.message,
        executionTime: `${executionTime}ms`
      });
    }
  };
};

// Authentication logging
const logAuthEvent = (event, req, success = true, additionalInfo = {}) => {
  logger.logAuth(event, req.user?.id || req.body?.email, req.ip, success, {
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    ...additionalInfo
  });
};

// Security event logging
const logSecurityEvent = (event, req, severity = 'warn', additionalInfo = {}) => {
  logger[severity]({
    message: `Security event: ${event}`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  });
};

// Performance monitoring middleware
const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    if (duration > 500) { // Log requests taking more than 500ms
      logger.warn({
        message: 'Performance warning',
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage(),
        requestId: req.requestId
      });
    }
  });
  
  next();
};

module.exports = {
  morganMiddleware,
  responseTimeMiddleware,
  requestIdMiddleware,
  errorLoggingMiddleware,
  successLoggingMiddleware,
  logDatabaseOperation,
  logAuthEvent,
  logSecurityEvent,
  performanceMonitoringMiddleware
};