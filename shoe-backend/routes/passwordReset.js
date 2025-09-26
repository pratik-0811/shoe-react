const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/user.model');
const PasswordReset = require('../models/passwordReset.model');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

const router = express.Router();

// Rate limiting for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 password reset requests per windowMs
  message: {
    error: 'Too many password reset requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset verification
const passwordResetVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 password reset verification attempts per windowMs
  message: {
    error: 'Too many password reset verification attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', 
  passwordResetLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Always return success message for security (don't reveal if email exists)
      const successMessage = 'If an account with that email exists, we have sent a password reset link.';
      
      if (!user) {
        logger.warn(`Password reset requested for non-existent email: ${email} from IP: ${ipAddress}`);
        return res.status(200).json({
          success: true,
          message: successMessage
        });
      }

      // Check if user account is active
      if (user.status === 'suspended' || user.status === 'deleted') {
        logger.warn(`Password reset requested for ${user.status} account: ${email} from IP: ${ipAddress}`);
        return res.status(200).json({
          success: true,
          message: successMessage
        });
      }

      // Invalidate any existing password reset tokens for this user
      await PasswordReset.invalidateUserTokens(user._id);

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Create password reset record
      const passwordReset = new PasswordReset({
        userId: user._id,
        email: user.email,
        token: resetToken,
        ipAddress,
        userAgent
      });

      await passwordReset.save();

      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name || user.firstName || 'User'
      );

      if (!emailSent) {
        logger.error(`Failed to send password reset email to ${user.email}`);
        // Don't reveal email sending failure to user for security
      }

      logger.info(`Password reset requested for ${user.email} from IP: ${ipAddress}`);
      
      res.status(200).json({
        success: true,
        message: successMessage
      });

    } catch (error) {
      logger.error('Error in forgot password request:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request. Please try again later.'
      });
    }
  }
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  passwordResetVerifyLimiter,
  [
    body('token')
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid reset token format'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'i')
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { token, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Find valid password reset token
      const passwordReset = await PasswordReset.findValidToken(token);
      
      if (!passwordReset) {
        logger.warn(`Invalid or expired password reset token attempted from IP: ${ipAddress}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        });
      }

      // Get the user
      const user = await User.findById(passwordReset.userId);
      if (!user) {
        logger.error(`User not found for password reset token: ${token}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token. Please request a new password reset.'
        });
      }

      // Check if user account is active
      if (user.status === 'suspended' || user.status === 'deleted') {
        logger.warn(`Password reset attempted for ${user.status} account: ${user.email}`);
        return res.status(400).json({
          success: false,
          message: 'Account is not active. Please contact support.'
        });
      }

      // Hash the new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      
      // Reset failed login attempts if any
      if (user.loginAttempts) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
      }

      await user.save();

      // Mark the reset token as used
      await passwordReset.markAsUsed();

      // Invalidate any other existing tokens for this user
      await PasswordReset.invalidateUserTokens(user._id);

      // Send confirmation email
      await emailService.sendPasswordResetConfirmation(
        user.email,
        user.name || user.firstName || 'User'
      );

      logger.info(`Password successfully reset for user: ${user.email} from IP: ${ipAddress}`);
      
      res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });

    } catch (error) {
      logger.error('Error in password reset:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while resetting your password. Please try again later.'
      });
    }
  }
);

/**
 * @route GET /api/auth/verify-reset-token/:token
 * @desc Verify if reset token is valid
 * @access Public
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Find valid password reset token
    const passwordReset = await PasswordReset.findValidToken(token);
    
    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if associated user exists and is active
    const user = await User.findById(passwordReset.userId);
    if (!user || user.status === 'suspended' || user.status === 'deleted') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: passwordReset.email,
        timeRemainingMinutes: passwordReset.timeRemainingMinutes
      }
    });

  } catch (error) {
    logger.error('Error verifying reset token:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while verifying the token'
    });
  }
});

/**
 * @route POST /api/auth/cancel-reset/:token
 * @desc Cancel a password reset request
 * @access Public
 */
router.post('/cancel-reset/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Find and invalidate the token
    const passwordReset = await PasswordReset.findOne({ token, used: false });
    
    if (passwordReset) {
      await passwordReset.markAsUsed();
      logger.info(`Password reset cancelled for token: ${token}`);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset request has been cancelled'
    });

  } catch (error) {
    logger.error('Error cancelling reset token:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling the reset request'
    });
  }
});

module.exports = router;