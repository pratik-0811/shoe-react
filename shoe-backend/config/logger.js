const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = process.env.LOG_FILE_PATH || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create transports array
const transports = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    })
  );
} else {
  // Console transport for production (less verbose)
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: process.env.LOG_LEVEL || 'info'
    })
  );
}

// File transports for all environments
transports.push(
  // Error logs
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    zippedArchive: true
  }),
  
  // Combined logs
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    zippedArchive: true
  }),
  
  // Access logs
  new DailyRotateFile({
    filename: path.join(logDir, 'access-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: logFormat,
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: process.env.LOG_MAX_FILES || '7d',
    zippedArchive: true
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test'
});

// Add custom log levels for HTTP requests
logger.add(new winston.transports.Console({
  level: 'http',
  format: consoleFormat
}));

// Create stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper functions for structured logging
logger.logError = (error, req = null, additionalInfo = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...additionalInfo
  };
  
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    };
  }
  
  logger.error(errorInfo);
};

logger.logRequest = (req, res, responseTime) => {
  logger.http({
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
};

logger.logAuth = (action, userId, ip, success = true, additionalInfo = {}) => {
  logger.info({
    action,
    userId,
    ip,
    success,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  });
};

logger.logDatabase = (operation, collection, query = {}, result = {}) => {
  logger.debug({
    type: 'database',
    operation,
    collection,
    query,
    result: {
      count: result.length || result.modifiedCount || result.deletedCount || 0,
      executionTime: result.executionTime
    }
  });
};

module.exports = logger;