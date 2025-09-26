const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  getWishlistCount
} = require("../controllers/wishlist.controller");

// All wishlist routes require authentication
router.use(verifyToken);

// GET /api/wishlist - Get user's wishlist
router.get("/", getWishlist);

// GET /api/wishlist/count - Get wishlist item count
router.get("/count", getWishlistCount);

// POST /api/wishlist/items - Add item to wishlist
router.post("/items", addToWishlist);

// DELETE /api/wishlist/items/:productId - Remove item from wishlist
router.delete("/items/:productId", removeFromWishlist);

// DELETE /api/wishlist - Clear entire wishlist
router.delete("/", clearWishlist);

module.exports = router;