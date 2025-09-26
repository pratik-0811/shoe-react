const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: [2, "Name must be at least 2 characters long"], maxlength: [50, "Name cannot exceed 50 characters"] },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
  },
  phone: { 
    type: String, 
    sparse: true, 
    trim: true,
    match: [/^[+]?[1-9]\d{1,14}$/, "Please enter a valid phone number"]
  },
  password: { type: String, required: true, minlength: [6, "Password must be at least 6 characters long"] },
  avatar: { type: String, default: "https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=100" },
  orders: { type: Number, default: 0 },
  joinDate: { type: String, default: new Date().toISOString().split("T")[0] },
  isAdmin: { type: Boolean, default: false },
  // OTP fields
  otp: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for better performance
// email already has unique index, no need for separate index
userSchema.index({ isAdmin: 1 }); // Admin filtering
userSchema.index({ createdAt: -1 }); // Registration date sorting

// Add lastLogin field for security tracking
userSchema.add({
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
});

// Method to generate and save OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  this.otpAttempts = 0;
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(candidateOTP) {
  if (!this.otp || !this.otpExpiry) {
    return false;
  }
  
  if (this.otpExpiry < new Date()) {
    return false; // OTP expired
  }
  
  if (this.otpAttempts >= 3) {
    return false; // Too many attempts
  }
  
  return this.otp === candidateOTP;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
  this.otpExpiry = undefined;
  this.otpAttempts = 0;
};

// Method to increment OTP attempts
userSchema.methods.incrementOTPAttempts = function() {
  this.otpAttempts = (this.otpAttempts || 0) + 1;
};

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual for user addresses
userSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'user'
});

// Method to get user's default address
userSchema.methods.getDefaultAddress = async function() {
  const Address = require('./address.model');
  return await Address.getDefaultAddress(this._id);
};

// Method to get all user addresses
userSchema.methods.getAddresses = async function(activeOnly = true) {
  const Address = require('./address.model');
  return await Address.getUserAddresses(this._id, activeOnly);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
