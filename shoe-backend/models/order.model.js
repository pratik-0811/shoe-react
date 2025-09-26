const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  size: { type: String, required: true, trim: true },
  color: { type: String, required: true, trim: true }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: [100, "Full name cannot exceed 100 characters"] },
  address: { type: String, required: true, trim: true, maxlength: [200, "Address cannot exceed 200 characters"] },
  city: { type: String, required: true, trim: true, maxlength: [50, "City cannot exceed 50 characters"] },
  postalCode: { type: String, required: true, trim: true, maxlength: [20, "Postal code cannot exceed 20 characters"] },
  country: { type: String, required: true, trim: true, maxlength: [50, "Country cannot exceed 50 characters"] },
  phone: { type: String, trim: true, maxlength: [20, "Phone number cannot exceed 20 characters"] }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'razorpay']
  },
  paymentDetails: {
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    amount: { type: Number },
    currency: { type: String },
    method: { type: String },
    paidAt: { type: Date }
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  subtotal: { type: Number, required: true, min: [0, "Subtotal cannot be negative"] },
  shippingCost: { type: Number, default: 0, min: [0, "Shipping cost cannot be negative"] },
  tax: { type: Number, default: 0, min: [0, "Tax cannot be negative"] },
  // Coupon and discount fields
  appliedCoupons: [{
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    code: { type: String, required: true },
    type: { type: String, required: true, enum: ['flat', 'percentage'] },
    value: { type: Number, required: true },
    discountAmount: { type: Number, required: true, min: [0, "Discount amount cannot be negative"] },
    appliedAt: { type: Date, default: Date.now }
  }],
  totalDiscount: { type: Number, default: 0, min: [0, "Total discount cannot be negative"] },
  total: { type: Number, required: true, min: [0, "Total cannot be negative"] },
  notes: { type: String, trim: true, maxlength: [500, "Notes cannot exceed 500 characters"] },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
orderSchema.index({ user: 1 }); // User orders lookup
// orderNumber already has unique index, no need for separate index
orderSchema.index({ orderStatus: 1 }); // Status filtering
orderSchema.index({ paymentStatus: 1 }); // Payment status filtering
orderSchema.index({ createdAt: -1 }); // Date sorting
orderSchema.index({ user: 1, createdAt: -1 }); // Compound index for user orders by date
orderSchema.index({ orderStatus: 1, createdAt: -1 }); // Compound index for status + date

// Virtual for order age in days
orderSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for can cancel status
orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.orderStatus) && 
         this.paymentStatus !== 'paid';
});

// Virtual for final amount after discounts
orderSchema.virtual('finalAmount').get(function() {
  return this.subtotal + this.shippingCost + this.tax - this.totalDiscount;
});

// Method to calculate total discount from applied coupons
orderSchema.methods.calculateTotalDiscount = function() {
  return this.appliedCoupons.reduce((total, coupon) => total + coupon.discountAmount, 0);
};

// Method to apply coupon
orderSchema.methods.applyCoupon = async function(couponCode, userId) {
  const Coupon = require('./coupon.model');
  
  // Find the coupon
  const coupon = await Coupon.findOne({ 
    code: couponCode.toUpperCase(), 
    isActive: true 
  });
  
  if (!coupon) {
    throw new Error('Invalid coupon code');
  }
  
  // Check if coupon is already applied
  const alreadyApplied = this.appliedCoupons.some(ac => ac.code === coupon.code);
  if (alreadyApplied) {
    throw new Error('Coupon already applied');
  }
  
  // Check if coupon is applicable
  const applicabilityCheck = coupon.isApplicableToOrder(this.subtotal, userId, this.items);
  if (!applicabilityCheck.valid) {
    throw new Error(applicabilityCheck.message);
  }
  
  // Calculate discount amount
  const discountAmount = coupon.calculateDiscount(this.subtotal - this.totalDiscount);
  
  // Add coupon to applied coupons
  this.appliedCoupons.push({
    coupon: coupon._id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discountAmount: discountAmount
  });
  
  // Update total discount
  this.totalDiscount = this.calculateTotalDiscount();
  
  // Update final total
  this.total = Math.max(0, this.subtotal + this.shippingCost + this.tax - this.totalDiscount);
  
  return { success: true, discountAmount, message: 'Coupon applied successfully' };
};

// Method to remove coupon
orderSchema.methods.removeCoupon = function(couponCode) {
  const couponIndex = this.appliedCoupons.findIndex(ac => ac.code === couponCode);
  
  if (couponIndex === -1) {
    throw new Error('Coupon not found in applied coupons');
  }
  
  // Remove the coupon
  this.appliedCoupons.splice(couponIndex, 1);
  
  // Recalculate total discount
  this.totalDiscount = this.calculateTotalDiscount();
  
  // Update final total
  this.total = Math.max(0, this.subtotal + this.shippingCost + this.tax - this.totalDiscount);
  
  return { success: true, message: 'Coupon removed successfully' };
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;