const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: [100, "Title cannot exceed 100 characters"] },
  subtitle: { type: String, trim: true, maxlength: [150, "Subtitle cannot exceed 150 characters"] },
  description: { type: String, trim: true, maxlength: [500, "Description cannot exceed 500 characters"] },
  image: { type: String, required: true },
  buttonText: { type: String, trim: true, maxlength: [50, "Button text cannot exceed 50 characters"] },
  buttonLink: { type: String, trim: true },
  position: {
    type: String,
    enum: ['hero', 'secondary', 'promotional'],
    default: 'hero'
  },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0, min: [0, "Priority cannot be negative"] }, // Higher number = higher priority
  startDate: { type: Date },
  endDate: { type: Date },
  backgroundColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#000000' },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'returning_users', 'premium_users'],
    default: 'all'
  },
  clickCount: { type: Number, default: 0, min: [0, "Click count cannot be negative"] },
  impressionCount: { type: Number, default: 0, min: [0, "Impression count cannot be negative"] }
}, {
  timestamps: true
});

// Index for efficient querying
bannerSchema.index({ isActive: 1, priority: -1 });
bannerSchema.index({ position: 1, isActive: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;