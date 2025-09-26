const mongoose = require("mongoose");

const abandonedCartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true }
});

const abandonedCartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"]
  },
  items: [abandonedCartItemSchema],
  total: { type: Number, required: true, min: [0, "Total cannot be negative"] },
  abandonedAt: { type: Date, default: Date.now },
  lastReminderSent: { type: Date },
  reminderCount: { type: Number, default: 0, min: [0, "Reminder count cannot be negative"] },
  maxReminders: { type: Number, default: 3, min: [0, "Max reminders cannot be negative"] },
  status: {
    type: String,
    enum: ['active', 'recovered', 'expired', 'ignored'],
    default: 'active'
  },
  recoveredAt: { type: Date },
  recoveredOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  sessionId: { type: String },
  deviceInfo: {
    userAgent: { type: String },
    ip: { type: String },
    platform: { type: String }
  },
  recoveryToken: { type: String, unique: true },
  expiresAt: { 
    type: Date, 
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
abandonedCartSchema.index({ user: 1, status: 1 });
abandonedCartSchema.index({ abandonedAt: 1 });
abandonedCartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate recovery token before saving
abandonedCartSchema.pre('save', function(next) {
  if (!this.recoveryToken) {
    this.recoveryToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

const AbandonedCart = mongoose.model("AbandonedCart", abandonedCartSchema);

module.exports = AbandonedCart;