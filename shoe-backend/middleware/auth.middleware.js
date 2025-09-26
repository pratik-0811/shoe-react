const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided" });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found" });
    }
    
    // Add full user object to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token format" });
    }
    return res.status(401).json({ message: "Token verification failed", error: error.message });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required" });
  }
  next();
};

// Optional authentication middleware
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware for user ownership verification
exports.verifyOwnership = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Admin can access any resource, users can only access their own
  if (!req.user.isAdmin && req.user._id.toString() !== resourceUserId) {
    return res.status(403).json({ message: "Access denied. You can only access your own resources" });
  }
  
  next();
};
