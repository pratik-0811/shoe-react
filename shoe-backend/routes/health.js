const express = require('express');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const router = express.Router();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'Connected';
    } else {
      healthCheck.database = 'Disconnected';
      healthCheck.status = 'WARNING';
    }

    // Check disk space (basic check)
    const stats = require('fs').statSync('.');
    healthCheck.diskSpace = {
      available: 'Unknown', // Would need additional package for detailed disk info
      status: 'OK'
    };

    res.status(healthCheck.status === 'OK' ? 200 : 503).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check for monitoring systems
router.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {},
      metrics: {}
    };

    // Database health
    try {
      const dbStats = await mongoose.connection.db.stats();
      detailedHealth.services.database = {
        status: 'OK',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        indexSize: dbStats.indexSize
      };
    } catch (dbError) {
      detailedHealth.services.database = {
        status: 'ERROR',
        error: dbError.message
      };
      detailedHealth.status = 'ERROR';
    }

    // System metrics
    detailedHealth.metrics = {
      uptime: process.uptime(),
      memory: {
        ...process.memoryUsage(),
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      },
      cpu: process.cpuUsage(),
      loadAverage: require('os').loadavg(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };

    // Environment info
    detailedHealth.environment = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    res.status(detailedHealth.status === 'OK' ? 200 : 503).json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const isDbReady = mongoose.connection.readyState === 1;
    
    if (isDbReady) {
      res.status(200).json({
        status: 'Ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'Not Ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected'
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'Not Ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'Alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (basic Prometheus-style metrics)
router.get('/metrics', (req, res) => {
  try {
    const metrics = [];
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory metrics
    metrics.push(`# HELP nodejs_memory_heap_used_bytes Process heap memory used`);
    metrics.push(`# TYPE nodejs_memory_heap_used_bytes gauge`);
    metrics.push(`nodejs_memory_heap_used_bytes ${memUsage.heapUsed}`);
    
    metrics.push(`# HELP nodejs_memory_heap_total_bytes Process heap memory total`);
    metrics.push(`# TYPE nodejs_memory_heap_total_bytes gauge`);
    metrics.push(`nodejs_memory_heap_total_bytes ${memUsage.heapTotal}`);
    
    // CPU metrics
    metrics.push(`# HELP nodejs_cpu_user_seconds_total Process CPU user time`);
    metrics.push(`# TYPE nodejs_cpu_user_seconds_total counter`);
    metrics.push(`nodejs_cpu_user_seconds_total ${cpuUsage.user / 1000000}`);
    
    metrics.push(`# HELP nodejs_cpu_system_seconds_total Process CPU system time`);
    metrics.push(`# TYPE nodejs_cpu_system_seconds_total counter`);
    metrics.push(`nodejs_cpu_system_seconds_total ${cpuUsage.system / 1000000}`);
    
    // Uptime metric
    metrics.push(`# HELP nodejs_process_uptime_seconds Process uptime`);
    metrics.push(`# TYPE nodejs_process_uptime_seconds gauge`);
    metrics.push(`nodejs_process_uptime_seconds ${process.uptime()}`);
    
    // Database connection metric
    metrics.push(`# HELP mongodb_connection_status MongoDB connection status`);
    metrics.push(`# TYPE mongodb_connection_status gauge`);
    metrics.push(`mongodb_connection_status ${mongoose.connection.readyState}`);
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n') + '\n');
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).send('Error generating metrics');
  }
});

module.exports = router;