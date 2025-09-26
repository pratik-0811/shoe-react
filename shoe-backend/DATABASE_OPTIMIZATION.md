# Database Optimization and Connection Pooling

This document outlines the comprehensive database optimization and connection pooling configurations implemented in the Shoe Store Backend API.

## Overview

The application uses MongoDB with Mongoose ODM and implements advanced connection pooling, monitoring, and optimization features for production-ready performance.

## Connection Pool Configuration

### Pool Size Settings
- **maxPoolSize**: Maximum number of connections in the pool
  - Development: 10 connections
  - Production: 20 connections (configurable via `DB_MAX_POOL_SIZE`)
- **minPoolSize**: Minimum number of connections maintained
  - Development: 2 connections
  - Production: 5 connections (configurable via `DB_MIN_POOL_SIZE`)

### Connection Timeout Settings
- **serverSelectionTimeoutMS**: 5000ms - Time to wait for server selection
- **socketTimeoutMS**: 45000ms - Socket inactivity timeout
- **connectTimeoutMS**: 10000ms - Initial connection timeout
- **heartbeatFrequencyMS**: 10000ms - Server health check frequency
- **maxIdleTimeMS**: 30000ms - Connection idle timeout
- **waitQueueTimeoutMS**: 5000ms - Queue wait timeout

## Write Concern and Reliability

### Write Operations
- **retryWrites**: Enabled - Automatically retry failed writes
- **retryReads**: Enabled - Automatically retry failed reads
- **w**: 'majority' - Wait for majority acknowledgment
- **j**: true (production) - Wait for journal acknowledgment

### Data Consistency
- Ensures data durability through journal acknowledgment
- Provides consistency through majority write concern
- Automatic retry mechanisms for transient failures

## Performance Optimizations

### Network Compression
- **compressors**: ['zlib'] - Enable network traffic compression
- **zlibCompressionLevel**: 6 - Balanced compression level (1-9 scale)
- Reduces bandwidth usage and improves performance over slow networks

### Read Preferences
- **maxStalenessSeconds**: 90 - Allow reading from secondaries up to 90 seconds behind
- Improves read performance in replica set environments

### Buffer Management
- **bufferMaxEntries**: 0 (production) - Disable mongoose buffering
- **bufferCommands**: false (production) - Disable command buffering
- Prevents memory issues and ensures immediate error feedback

## Production Settings

### Schema Management
- **autoIndex**: Disabled in production - Prevents automatic index creation
- **autoCreate**: Disabled in production - Prevents automatic collection creation
- Improves startup performance and prevents unintended schema changes

### Environment-Based Configuration
All settings are configurable via environment variables:

```env
# Connection Pool
DB_MAX_POOL_SIZE=20
DB_MIN_POOL_SIZE=5
DB_WAIT_QUEUE_TIMEOUT_MS=5000

# Timeouts
DB_SERVER_SELECTION_TIMEOUT_MS=5000
DB_SOCKET_TIMEOUT_MS=45000
DB_CONNECT_TIMEOUT_MS=10000
DB_HEARTBEAT_FREQUENCY_MS=10000

# Reliability
DB_RETRY_WRITES=true
DB_RETRY_READS=true
DB_WRITE_CONCERN=majority
DB_JOURNAL=true

# Performance
DB_MAX_STALENESS_SECONDS=90
DB_COMPRESSORS=zlib
DB_ZLIB_COMPRESSION_LEVEL=6

# Buffers (Production)
DB_BUFFER_MAX_ENTRIES=0
DB_BUFFER_COMMANDS=false

# Schema (Production)
DB_AUTO_INDEX=false
DB_AUTO_CREATE=false
```

## Connection Monitoring

### Event Handlers
The application monitors various connection events:

- **connected**: Initial connection established
- **error**: Connection errors
- **disconnected**: Connection lost
- **reconnected**: Connection restored
- **fullsetup**: Replica set fully connected
- **all**: All replica set servers connected
- **close**: Connection closed

### Logging Integration
All connection events are logged using Winston logger with appropriate log levels:
- Info: Normal operations (connect, reconnect)
- Warn: Connection issues (disconnect)
- Error: Critical problems (connection errors)

## Graceful Shutdown

### Shutdown Process
1. Receive shutdown signal (SIGTERM, SIGINT)
2. Stop accepting new connections
3. Close HTTP server
4. Close MongoDB connections
5. Exit process

### Error Handling
- Uncaught exceptions trigger graceful shutdown
- Unhandled promise rejections are logged and handled
- All shutdown steps are logged for debugging

## Best Practices Implemented

### Connection Management
- ✅ Connection pooling with appropriate limits
- ✅ Connection timeout configurations
- ✅ Automatic retry mechanisms
- ✅ Graceful connection handling

### Performance
- ✅ Network compression enabled
- ✅ Buffer management optimized for production
- ✅ Read preference optimization
- ✅ Schema operation control

### Monitoring
- ✅ Comprehensive event logging
- ✅ Connection state monitoring
- ✅ Error tracking and reporting
- ✅ Performance metrics logging

### Production Readiness
- ✅ Environment-based configuration
- ✅ Graceful shutdown handling
- ✅ Error recovery mechanisms
- ✅ Security-conscious defaults

## Monitoring and Maintenance

### Key Metrics to Monitor
1. **Connection Pool Usage**: Monitor active vs available connections
2. **Connection Errors**: Track connection failures and retries
3. **Response Times**: Monitor database operation latency
4. **Memory Usage**: Watch for connection pool memory consumption

### Maintenance Tasks
1. **Regular Index Optimization**: Review and optimize database indexes
2. **Connection Pool Tuning**: Adjust pool sizes based on usage patterns
3. **Log Analysis**: Review connection logs for patterns and issues
4. **Performance Testing**: Regular load testing of database operations

## Troubleshooting

### Common Issues
1. **Connection Pool Exhaustion**: Increase `maxPoolSize` or investigate connection leaks
2. **Timeout Errors**: Adjust timeout values based on network conditions
3. **Memory Issues**: Review buffer settings and connection pool size
4. **Performance Degradation**: Check compression settings and read preferences

### Debug Configuration
For debugging connection issues, enable detailed logging:

```env
DEBUG=mongoose:*
LOG_LEVEL=debug
```

This configuration provides comprehensive database optimization for production environments while maintaining flexibility for development and testing scenarios.