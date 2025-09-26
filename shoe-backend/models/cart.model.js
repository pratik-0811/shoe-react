const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, default: 1, min: [1, "Quantity must be at least 1"] },
  size: { type: String },
  color: { type: String }
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: String }, // For guest users
  items: [cartItemSchema],
  total: { type: Number, default: 0, min: [0, "Total cannot be negative"] },
  expiresAt: { type: Date, default: Date.now } // 30 days TTL
}, {
  timestamps: true
});

// Validation: Either user or sessionId must be present
cartSchema.pre('save', function(next) {
  if (!this.user && !this.sessionId) {
    return next(new Error('Either user or sessionId must be provided'));
  }
  next();
});

// Indexes for better performance
cartSchema.index({ user: 1 }, { unique: true, sparse: true }); // Unique user carts
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true }); // Unique session carts
cartSchema.index({ updatedAt: -1 }); // Recently updated carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for item count
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate total
cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
