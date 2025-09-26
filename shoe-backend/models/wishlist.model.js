const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // Each user can have only one wishlist
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure no duplicate products in the same wishlist
wishlistSchema.index({ user: 1, "items.product": 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;