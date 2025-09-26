const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Production security and logging
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const logger = require('./config/logger');
const { 
  morganMiddleware, 
  responseTimeMiddleware, 
  requestIdMiddleware,
  performanceMonitoringMiddleware 
} = require('./middleware/logging.middleware');

// Import routes
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const paymentRoutes = require("./routes/payments");
const bannerRoutes = require("./routes/banners");
const abandonedCartRoutes = require("./routes/abandonedCarts");
const uploadRoutes = require("./routes/uploads");
const wishlistRoutes = require("./routes/wishlist");
const categoryRoutes = require("./routes/category.routes");
const reviewRoutes = require("./routes/review.routes");
const couponRoutes = require("./routes/coupon.routes");
const addressRoutes = require("./routes/address.routes");
const newsletterRoutes = require("./routes/newsletter.routes");
const recommendationRoutes = require("./routes/recommendations");
const docsRoutes = require("./routes/docs");
const healthRoutes = require("./routes/health");
const passwordResetRoutes = require("./routes/passwordReset");

// Import middleware
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { securityHeaders, sanitizeInput } = require('./middleware/security.middleware');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Add request ID and performance monitoring
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(performanceMonitoringMiddleware);

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
}

// Apply security headers and input sanitization globally
app.use(securityHeaders);
app.use(sanitizeInput);

// Add HTTP request logging
app.use(morganMiddleware);

// General rate limiting (more permissive for general API usage)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // Higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', generalLimiter);

// CORS configuration
const corsOptions = {
  origin:['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
//app.use(cors({origin:"*"}));






// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Also serve static files at /api/uploads for frontend compatibility
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Mongoose-specific settings
if (process.env.NODE_ENV === 'production') {
  mongoose.set('bufferCommands', false);
} else {
  mongoose.set('bufferCommands', process.env.DB_BUFFER_COMMANDS === 'true');
}
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production' && process.env.DB_AUTO_INDEX !== 'false');
mongoose.set('autoCreate', process.env.NODE_ENV !== 'production' && process.env.DB_AUTO_CREATE !== 'false');

// MongoDB connection options (MongoDB driver specific)
const mongoOptions = {
  // Connection Pool Settings (configurable via environment variables)
  maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || (process.env.NODE_ENV === 'production' ? 20 : 10),
  minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || (process.env.NODE_ENV === 'production' ? 5 : 2),
  maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME_MS) || 30000,
  waitQueueTimeoutMS: parseInt(process.env.DB_WAIT_QUEUE_TIMEOUT_MS) || 5000,
  
  // Connection Timeout Settings (configurable via environment variables)
  serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
  socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT_MS) || 45000,
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
  heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY_MS) || 10000,
  
  // Write Concern and Reliability
  retryWrites: process.env.DB_RETRY_WRITES !== 'false', // Default true, can be disabled
  retryReads: process.env.DB_RETRY_READS !== 'false',   // Default true, can be disabled
  w: process.env.DB_WRITE_CONCERN || 'majority',
  journal: process.env.NODE_ENV === 'production' ? (process.env.DB_JOURNAL !== 'false') : false,
  
  // Performance Optimizations
  maxStalenessSeconds: parseInt(process.env.DB_MAX_STALENESS_SECONDS) || 90,
  compressors: process.env.DB_COMPRESSORS ? process.env.DB_COMPRESSORS.split(',') : ['zlib'],
  zlibCompressionLevel: parseInt(process.env.DB_ZLIB_COMPRESSION_LEVEL) || 6
};

// Enhanced MongoDB connection with monitoring and error handling
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shoe-store", mongoOptions)
  .then(() => {
    console.log("MongoDB connection established successfully");
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Connection Pool - Max: ${mongoOptions.maxPoolSize}, Min: ${mongoOptions.minPoolSize}`);
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    console.log("⚠️  Running in demo mode without database - some features may be limited");
    logger.error('Failed to connect to MongoDB', { error: err.message, stack: err.stack });
    // Don't exit - continue running in demo mode
  });

// MongoDB connection event handlers for monitoring
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  logger.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongoose reconnected to MongoDB');
  logger.info('MongoDB connection restored');
});

// Monitor connection pool events
mongoose.connection.on('fullsetup', () => {
  logger.info('MongoDB replica set fully connected');
});

mongoose.connection.on('all', () => {
  logger.info('MongoDB replica set all servers connected');
});

mongoose.connection.on('close', () => {
  logger.info('MongoDB connection closed');
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/abandoned-carts", abandonedCartRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/auth", passwordResetRoutes);
app.use("/api", docsRoutes);
app.use("/", healthRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Solewaale API",
    version: "1.0.0",
    documentation: `${req.protocol}://${req.get('host')}/api`,
    health: `${req.protocol}://${req.get('host')}/api/health`
  });
});

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api`);
});

// Graceful shutdown handling with database cleanup
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  logger.info(`Graceful shutdown initiated by ${signal}`);
  
  try {
    // Close HTTP server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('HTTP server closed');
      logger.info('HTTP server closed successfully');
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    logger.info('MongoDB connection closed successfully');
    
    console.log('Graceful shutdown completed');
    logger.info('Application shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    logger.error('Error during graceful shutdown', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});
