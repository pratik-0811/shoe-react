const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validateUserRegistration, validateUserLogin, handleValidationErrors } = require("../middleware/validation.middleware");
const { asyncHandler } = require("../middleware/error.middleware");
const {
  authRateLimit,
  passwordResetRateLimit,
  checkAccountLock,
  validatePasswordStrength,
  checkTokenBlacklist,
  sanitizeInput,
  checkSessionTimeout
} = require("../middleware/security.middleware");

// Public routes with enhanced security
router.post("/register", 
  authRateLimit,
  sanitizeInput,
  validateUserRegistration,
  validatePasswordStrength,
  handleValidationErrors,
  asyncHandler(userController.register)
);

router.post("/login", 
  authRateLimit,
  sanitizeInput,
  checkAccountLock,
  validateUserLogin,
  handleValidationErrors,
  asyncHandler(userController.login)
);

router.post("/logout",
  verifyToken,
  asyncHandler(userController.logout)
);

router.post("/forgot-password",
  passwordResetRateLimit,
  sanitizeInput,
  asyncHandler(userController.forgotPassword)
);

router.post("/reset-password",
  passwordResetRateLimit,
  sanitizeInput,
  validatePasswordStrength,
  asyncHandler(userController.resetPassword)
);

// OTP routes
router.post("/send-otp",
  authRateLimit,
  sanitizeInput,
  asyncHandler(userController.sendOTP)
);

router.post("/verify-otp-login",
  authRateLimit,
  sanitizeInput,
  checkAccountLock,
  asyncHandler(userController.verifyOTPLogin)
);

// Protected routes with enhanced security
router.get("/profile", 
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  asyncHandler(userController.getProfile)
);

router.put("/profile", 
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  sanitizeInput,
  asyncHandler(userController.updateProfile)
);

router.get("/me", 
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  asyncHandler(userController.getProfile)
);

router.put("/me", 
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  sanitizeInput,
  asyncHandler(userController.updateProfile)
);

router.put("/change-password",
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  sanitizeInput,
  validatePasswordStrength,
  asyncHandler(userController.changePassword)
);

router.get("/stats",
  checkTokenBlacklist,
  verifyToken,
  checkSessionTimeout,
  asyncHandler(userController.getUserStats)
);

module.exports = router;
