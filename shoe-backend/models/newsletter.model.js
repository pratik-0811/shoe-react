const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    default: 'website',
    enum: ['website', 'mobile', 'social']
  },
  preferences: {
    newArrivals: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    styleUpdates: {
      type: Boolean,
      default: true
    }
  },
  unsubscribedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ subscribedAt: -1 });
newsletterSchema.index({ isActive: 1 });

// Virtual for subscription status
newsletterSchema.virtual('subscriptionStatus').get(function() {
  return this.isActive ? 'active' : 'unsubscribed';
});

// Method to unsubscribe
newsletterSchema.methods.unsubscribe = function() {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

// Method to resubscribe
newsletterSchema.methods.resubscribe = function() {
  this.isActive = true;
  this.unsubscribedAt = null;
  return this.save();
};

// Static method to get active subscribers count
newsletterSchema.statics.getActiveSubscribersCount = function() {
  return this.countDocuments({ isActive: true });
};

// Static method to get recent subscribers
newsletterSchema.statics.getRecentSubscribers = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    subscribedAt: { $gte: startDate },
    isActive: true
  }).sort({ subscribedAt: -1 });
};

module.exports = mongoose.model('Newsletter', newsletterSchema);