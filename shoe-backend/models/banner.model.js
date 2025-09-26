const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  image: { type: String, required: true },
  buttonText: { type: String },
  buttonLink: { type: String },
  position: {
    type: String,
    enum: ['hero', 'secondary', 'promotional'],
    default: 'hero'
  },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }, // Higher number = higher priority
  startDate: { type: Date },
  endDate: { type: Date },
  backgroundColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#000000' },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'returning_users', 'premium_users'],
    default: 'all'
  },
  clickCount: { type: Number, default: 0 },
  impressionCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for efficient querying
bannerSchema.index({ isActive: 1, priority: -1 });
bannerSchema.index({ position: 1, isActive: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;