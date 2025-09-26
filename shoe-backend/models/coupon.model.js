const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, "Coupon code must be at least 3 characters long"],
    maxlength: [20, "Coupon code cannot exceed 20 characters"],
    match: [/^[A-Z0-9]+$/, "Coupon code can only contain uppercase letters and numbers"]
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Coupon name cannot exceed 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  type: {
    type: String,
    required: true,
    enum: ['flat', 'percentage'],
    lowercase: true
  },
  value: {
    type: Number,
    required: true,
    min: [0, "Coupon value cannot be negative"]
  },
  // Conditions
  minPurchaseAmount: {
    type: Number,
    default: 0,
    min: [0, "Minimum purchase amount cannot be negative"]
  },
  maxDiscountAmount: {
    type: Number,
    default: null, // Only for percentage coupons
    min: [0, "Maximum discount amount cannot be negative"]
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: "Expiry date must be in the future"
    }
  },
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
    min: [1, "Usage limit must be at least 1"]
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, "Usage count cannot be negative"]
  },
  userUsageLimit: {
    type: Number,
    default: 1, // How many times a single user can use this coupon
    min: [1, "User usage limit must be at least 1"]
  },
  // Status and visibility
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true // If false, coupon is only for specific users
  },
  // Applicable categories/products (optional)
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  // User restrictions
  restrictedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // Admin who created the coupon
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
couponSchema.index({ code: 1 }); // Unique index already exists
couponSchema.index({ isActive: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ type: 1 });
couponSchema.index({ createdBy: 1 });
couponSchema.index({ isActive: 1, expiryDate: 1 }); // Compound index for active and non-expired coupons

// Virtual for checking if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Virtual for checking if coupon is available (not expired, active, and within usage limit)
couponSchema.virtual('isAvailable').get(function() {
  const notExpired = this.expiryDate > new Date();
  const isActive = this.isActive;
  const withinUsageLimit = this.usageLimit === null || this.usageCount < this.usageLimit;
  
  return notExpired && isActive && withinUsageLimit;
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (this.usageLimit === null) return 'Unlimited';
  return Math.max(0, this.usageLimit - this.usageCount);
});

// Method to check if coupon is applicable to a specific order
couponSchema.methods.isApplicableToOrder = function(orderAmount, userId, cartItems = []) {
  // Check if coupon is available
  if (!this.isAvailable) {
    return { valid: false, message: 'Coupon is not available' };
  }
  
  // Check minimum purchase amount
  if (orderAmount < this.minPurchaseAmount) {
    return { 
      valid: false, 
      message: `Minimum purchase amount of ₹${this.minPurchaseAmount} required` 
    };
  }
  
  // Check user restrictions
  if (this.restrictedUsers.includes(userId)) {
    return { valid: false, message: 'You are not eligible for this coupon' };
  }
  
  // Check if coupon is for specific users only
  if (!this.isPublic && this.allowedUsers.length > 0 && !this.allowedUsers.includes(userId)) {
    return { valid: false, message: 'This coupon is not available for your account' };
  }
  
  return { valid: true, message: 'Coupon is applicable' };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;
  
  if (this.type === 'flat') {
    discountAmount = this.value;
  } else if (this.type === 'percentage') {
    discountAmount = (orderAmount * this.value) / 100;
    
    // Apply maximum discount limit for percentage coupons
    if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
      discountAmount = this.maxDiscountAmount;
    }
  }
  
  // Ensure discount doesn't exceed order amount
  return Math.min(discountAmount, orderAmount);
};

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;