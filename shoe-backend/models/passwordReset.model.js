const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index to auto-delete expired documents
  },
  used: {
    type: Boolean,
    default: false,
    index: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  usedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  collection: 'passwordresets'
});

// Compound index for efficient queries
passwordResetSchema.index({ email: 1, used: 1, expiresAt: 1 });
passwordResetSchema.index({ token: 1, used: 1, expiresAt: 1 });

// Instance method to check if token is valid
passwordResetSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

// Instance method to mark token as used
passwordResetSchema.methods.markAsUsed = function() {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

// Static method to find valid token
passwordResetSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token: token,
    used: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId', 'email name');
};

// Static method to cleanup expired tokens (optional, as TTL index handles this)
passwordResetSchema.statics.cleanupExpiredTokens = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { used: true, usedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Remove used tokens older than 24 hours
    ]
  });
};

// Static method to invalidate all existing tokens for a user
passwordResetSchema.statics.invalidateUserTokens = function(userId) {
  return this.updateMany(
    { userId: userId, used: false },
    { used: true, usedAt: new Date() }
  );
};

// Pre-save middleware to ensure token uniqueness
passwordResetSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate a unique token if not provided
    if (!this.token) {
      const crypto = require('crypto');
      this.token = crypto.randomBytes(32).toString('hex');
    }
    
    // Ensure token is unique
    const existingToken = await this.constructor.findOne({ token: this.token });
    if (existingToken) {
      const crypto = require('crypto');
      this.token = crypto.randomBytes(32).toString('hex');
    }
  }
  next();
});

// Virtual for time remaining
passwordResetSchema.virtual('timeRemaining').get(function() {
  if (this.used || this.expiresAt <= new Date()) {
    return 0;
  }
  return Math.max(0, this.expiresAt.getTime() - Date.now());
});

// Virtual for time remaining in minutes
passwordResetSchema.virtual('timeRemainingMinutes').get(function() {
  return Math.ceil(this.timeRemaining / (1000 * 60));
});

// Ensure virtuals are included in JSON output
passwordResetSchema.set('toJSON', { virtuals: true });
passwordResetSchema.set('toObject', { virtuals: true });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;