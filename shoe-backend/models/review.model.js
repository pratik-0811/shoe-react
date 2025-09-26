const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  userName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [100, "User name cannot exceed 100 characters"]
  },
  userEmail: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"]
  },
  userAvatar: { 
    type: String,
    default: null
  },
  userJoinDate: {
    type: String,
    default: null
  },
  userOrderCount: {
    type: Number,
    default: 0,
    min: [0, "Order count cannot be negative"]
  },
  userIsVerified: {
    type: Boolean,
    default: false
  },
  rating: { 
    type: Number, 
    required: true, 
    min: [1, "Rating must be at least 1"], 
    max: [5, "Rating cannot exceed 5"],
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, "Review title cannot exceed 200 characters"]
  },
  comment: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: [10, "Comment must be at least 10 characters"],
    maxlength: [2000, "Comment cannot exceed 2000 characters"] 
  },
  images: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [200, "Image alt text cannot exceed 200 characters"]
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [300, "Image caption cannot exceed 300 characters"]
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    size: {
      type: Number,
      min: [0, "File size cannot be negative"]
    },
    mimeType: {
      type: String,
      trim: true
    }
  }],
  helpful: { 
    type: Number, 
    default: 0, 
    min: [0, "Helpful count cannot be negative"] 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
    index: true
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatorNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Moderator notes cannot exceed 500 characters"]
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  // For tracking review edits
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousComment: String,
    previousRating: Number,
    reason: String
  }],
  // Additional metadata
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ productId: 1, status: 1 }); // For fetching approved reviews by product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ status: 1, createdAt: -1 }); // For admin review management
reviewSchema.index({ rating: 1, status: 1 }); // For rating-based queries
reviewSchema.index({ createdAt: -1 }); // For recent reviews

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for time ago
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Pre-save middleware to update approval/rejection timestamps
reviewSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'approved' && !this.approvedAt) {
      this.approvedAt = new Date();
      this.rejectedAt = null;
    } else if (this.status === 'rejected' && !this.rejectedAt) {
      this.rejectedAt = new Date();
      this.approvedAt = null;
    } else if (this.status === 'pending') {
      this.approvedAt = null;
      this.rejectedAt = null;
    }
  }
  next();
});

// Static method to get average rating for a product
reviewSchema.statics.getAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews
  } : {
    averageRating: 0,
    totalReviews: 0
  };
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = async function(productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), status: 'approved' } },
    { $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach(item => {
    distribution[item._id] = item.count;
  });
  
  return distribution;
};

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;