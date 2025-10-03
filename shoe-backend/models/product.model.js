const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true, trim: true },
  userAvatar: { type: String },
  rating: { type: Number, required: true, min: [1, "Rating must be at least 1"], max: [5, "Rating cannot exceed 5"] },
  comment: { type: String, required: true, trim: true, maxlength: [1000, "Comment cannot exceed 1000 characters"] },
  date: { type: String, required: true },
  helpful: { type: Number, default: 0, min: [0, "Helpful count cannot be negative"] },
  verified: { type: Boolean, default: false }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: [200, "Product name cannot exceed 200 characters"] },
  price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
  discounted_price: { type: Number, default: null, min: [0, "Discounted price cannot be negative"] },
  originalPrice: { type: Number, default: null, min: [0, "Original price cannot be negative"] },
  image: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true, trim: true },
  rating: { type: Number, default: 0, min: [0, "Rating cannot be negative"], max: [5, "Rating cannot exceed 5"] },
  totalReviews: { type: Number, default: 0, min: [0, "Total reviews cannot be negative"] },
  reviews: [reviewSchema],
  description: { type: String, required: true, trim: true, maxlength: [2000, "Description cannot exceed 2000 characters"] },
  features: [{ type: String, trim: true }],
  images: [{ type: String }],
  
  // Shoe-specific fields
  sizes: [{ 
    size: { type: String, required: true }, // e.g., "7", "8.5", "9"
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] }
  }],
  colors: [{
    name: { type: String, required: true }, // e.g., "Black", "White", "Red"
    hexCode: { type: String, required: true }, // e.g., "#000000"
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] }
  }],
  material: { type: String, trim: true }, // e.g., "Leather", "Canvas", "Synthetic"
  gender: { 
    type: String, 
    required: true, 
    enum: ["Men", "Women", "Unisex", "Kids"], 
    default: "Unisex" 
  },
  style: { type: String, trim: true }, // e.g., "Sneakers", "Boots", "Sandals"
  season: { type: String, enum: ["Spring", "Summer", "Fall", "Winter", "All Season"], default: "All Season" },
  
  inStock: { type: Boolean, default: true },
  countInStock: { type: Number, default: 0, min: [0, "Stock count cannot be negative"] },
  isFeatured: { type: Boolean, default: false },
  badge: { type: String, trim: true }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' }); // Text search
productSchema.index({ category: 1 }); // Category filtering
productSchema.index({ price: 1 }); // Price sorting/filtering
productSchema.index({ rating: -1 }); // Rating sorting
productSchema.index({ isFeatured: 1 }); // Featured products
productSchema.index({ inStock: 1 }); // Stock filtering
productSchema.index({ gender: 1 }); // Gender filtering
productSchema.index({ createdAt: -1 }); // New arrivals
productSchema.index({ brand: 1, category: 1 }); // Compound index for brand + category
productSchema.index({ price: 1, category: 1 }); // Compound index for price + category

// Static method to update product rating from approved reviews
productSchema.statics.updateProductRating = async function(productId) {
  const Review = require('./review.model');
  
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);
    
    let averageRating = 0;
    let totalReviews = 0;
    
    if (stats.length > 0) {
      averageRating = Math.round(stats[0].averageRating * 10) / 10;
      totalReviews = stats[0].totalReviews;
    }
    
    // Update the product with new rating
    await this.findByIdAndUpdate(productId, {
      rating: averageRating,
      totalReviews: totalReviews
    });
    
    return { averageRating, totalReviews };
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// Virtual for average rating calculation (kept for backward compatibility)
productSchema.virtual('averageRating').get(function() {
  return this.rating || 0;
});

// Virtual for total stock calculation
productSchema.virtual('totalStock').get(function() {
  if (this.sizes && this.sizes.length > 0) {
    return this.sizes.reduce((acc, size) => acc + size.stock, 0);
  }
  return this.countInStock;
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
