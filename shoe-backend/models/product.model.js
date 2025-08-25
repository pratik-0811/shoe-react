const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: String, required: true },
  helpful: { type: Number, default: 0 },
  verified: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  category: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: [reviewSchema],
  description: { type: String, required: true },
  features: [{ type: String }],
  images: [{ type: String }],
  inStock: { type: Boolean, default: true },
  badge: { type: String }
}, {
  timestamps: true
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
