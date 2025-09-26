const rateLimit = require('express-rate-limit');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Enhanced rate limiting for different endpoints
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Strict rate limiting for authentication endpoints
exports.authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'production' ? 5 : 100, // 5 attempts in production, 100 in development
  'Too many authentication attempts, please try again later'
);

// Rate limiting for password reset
exports.passwordResetRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts
  'Too many password reset attempts, please try again later'
);

// Rate limiting for file uploads
exports.uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads
  'Too many upload attempts, please try again later'
);

// Account lockout mechanism
exports.handleFailedLogin = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return;

    // Increment login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    // Lock account after 5 failed attempts for 30 minutes
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      user.loginAttempts = 0; // Reset attempts after lock
    }

    await user.save();
  } catch (error) {
    console.error('Error handling failed login:', error);
  }
};

// Reset login attempts on successful login
exports.handleSuccessfulLogin = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $unset: { loginAttempts: 1, lockUntil: 1 },
      lastLogin: new Date()
    });
  } catch (error) {
    console.error('Error handling successful login:', error);
  }
};

// Check if account is locked
exports.checkAccountLock = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next();

    const user = await User.findOne({ email });
    if (!user) return next();

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`,
        lockUntil: user.lockUntil
      });
    }

    // Clear expired lock
    if (user.lockUntil && user.lockUntil <= new Date()) {
      await User.findByIdAndUpdate(user._id, {
        $unset: { lockUntil: 1, loginAttempts: 1 }
      });
    }

    next();
  } catch (error) {
    console.error('Error checking account lock:', error);
    next();
  }
};

// Password strength validation
exports.validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) return next();

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors
    });
  }

  next();
};

// JWT token blacklist (in-memory for demo, use Redis in production)
const tokenBlacklist = new Set();

// Add token to blacklist
exports.blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens periodically
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 24 * 60 * 60 * 1000); // 24 hours
};

// Check if token is blacklisted
exports.checkTokenBlacklist = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  
  if (token && tokenBlacklist.has(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token has been revoked'
    });
  }
  
  next();
};

// Security headers middleware
exports.securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'");
  
  next();
};

// Input sanitization
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS patterns
        obj[key] = obj[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

// API key validation for admin operations
exports.validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  const validApiKey = process.env.ADMIN_API_KEY;
  
  if (!validApiKey) {
    console.warn('ADMIN_API_KEY not configured');
    return next();
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing API key'
    });
  }
  
  next();
};

// Session timeout check
exports.checkSessionTimeout = (req, res, next) => {
  if (!req.user) return next();
  
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  const lastActivity = req.user.lastLogin || req.user.createdAt;
  
  if (new Date() - new Date(lastActivity) > sessionTimeout) {
    return res.status(401).json({
      success: false,
      message: 'Session has expired, please login again'
    });
  }
  
  next();
};

module.exports = exports;