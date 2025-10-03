const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { getFilenameFromUrl, deleteFile } = require("../config/multer.config");
const { handleFailedLogin, handleSuccessfulLogin, blacklistToken } = require("../middleware/security.middleware");
const path = require('path');

// SMS service using MSG91
const smsService = require('../services/smsService');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Additional security: Rate limiting should be handled by middleware
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Will be hashed by pre-save middleware
      avatar: req.body.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random`,
      orderCount: 0,
      joinDate: new Date().toISOString().split("T")[0],
      isAdmin: false // Never allow admin creation through registration
    });

    const savedUser = await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: savedUser._id, isAdmin: savedUser.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data without password
    const { password: _, ...userData } = savedUser._doc;
    res.status(201).json({ 
      success: true,
      user: userData, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error registering user", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      // Use same error message to prevent email enumeration
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Handle failed login attempt
      await handleFailedLogin(normalizedEmail);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Handle successful login
    await handleSuccessfulLogin(user._id);

    // Generate JWT token with more secure options
    // Extend expiration if remember me is enabled
    const tokenExpiration = rememberMe ? "30d" : "7d";
    const token = jwt.sign(
      { 
        id: user._id, 
        isAdmin: user.isAdmin,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: tokenExpiration,
        issuer: 'shoe-store-api',
        audience: 'shoe-store-client'
      }
    );

    // Return user data without password
    const { password: _, ...userData } = user._doc;
    res.status(200).json({ 
      success: true,
      user: userData, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error logging in", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Don't allow password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    // Get existing user to handle avatar cleanup
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = { ...req.body };

    // Handle avatar update
    if (updateData.avatar && updateData.avatar !== existingUser.avatar) {
      // Delete old avatar if it's an uploaded file (not default UI avatar)
      if (existingUser.avatar && 
          existingUser.avatar.includes('/uploads/avatars/') && 
          !existingUser.avatar.includes('ui-avatars.com')) {
        const filename = getFilenameFromUrl(existingUser.avatar);
        const filePath = path.join(__dirname, '..', 'uploads', 'avatars', filename);
        deleteFile(filePath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: "Error updating profile", error: error.message });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete avatar file if it's an uploaded file
    if (user.avatar && 
        user.avatar.includes('/uploads/avatars/') && 
        !user.avatar.includes('ui-avatars.com')) {
      const filename = getFilenameFromUrl(user.avatar);
      const filePath = path.join(__dirname, '..', 'uploads', 'avatars', filename);
      deleteFile(filePath);
    }

    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
};

// Logout user (blacklist token)
exports.logout = async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (token) {
      blacklistToken(token);
    }
    
    res.status(200).json({ 
      success: true,
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error logging out", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set reset token and expiry (10 minutes)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    
    // In production, send email with reset link
    // For now, return the token (remove this in production)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    

    
    res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      // Remove this in production
      ...(process.env.NODE_ENV !== 'production' && { resetUrl })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: "Error processing password reset request",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }
    
    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }
    
    // Update password
    user.password = password; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Change password (for authenticated users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    // Update password
    user.password = newPassword; // Will be hashed by pre-save middleware
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// Send OTP for phone verification
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }
    
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    
    // Find or create user with this phone number
    let user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      // Create a temporary user record for OTP verification
      user = new User({
        phone: normalizedPhone,
        name: 'OTP User', // Temporary name
        email: `temp_${Date.now()}@otp.temp`, // Temporary email
        password: 'temp_password_' + Date.now() // Temporary password
      });
    }
    
    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Send OTP via SMS using MSG91
    const otpSent = await smsService.sendOTP(normalizedPhone, otp);
    
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again."
      });
    }
    
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiresIn: 600 // 10 minutes in seconds
    });
    
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
};

// Verify OTP and login
exports.verifyOTPLogin = async (req, res) => {
  try {
    const { phone, otp, rememberMe } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required"
      });
    }
    
    // Normalize phone number
    const normalizedPhone = phone.replace(/[^+\d]/g, '');
    
    // Find user by phone
    const user = await User.findOne({ phone: normalizedPhone });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Verify OTP
    const isOTPValid = user.verifyOTP(otp);
    
    if (!isOTPValid) {
      user.incrementOTPAttempts();
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }
    
    // Clear OTP after successful verification
    user.clearOTP();
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    // Extend expiration if remember me is enabled
    const tokenExpiration = rememberMe ? "30d" : "7d";
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiration }
    );
    
    // Return user data without password
    const { password: _, otp: __, otpExpiry: ___, otpAttempts: ____, ...userData } = user._doc;
    
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });
    
  } catch (error) {
    console.error("Verify OTP login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// Get user statistics (orders, wishlist, reviews counts)
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Import models
    const Order = require('../models/order.model');
    const Wishlist = require('../models/wishlist.model');
    const Review = require('../models/review.model');
    
    // Get counts in parallel for better performance
    const [orderCount, wishlistCount, reviewCount] = await Promise.all([
      Order.countDocuments({ user: userId }),
      Wishlist.countDocuments({ user: userId }),
      Review.countDocuments({ userId: userId })
    ]);
    
    res.status(200).json({
      success: true,
      message: "User stats fetched successfully",
      data: {
        orderCount,
        wishlistCount,
        reviewCount
      }
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching user statistics",
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};
