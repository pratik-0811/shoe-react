const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");

// Guest cart routes (public)
router.post("/guest", asyncHandler(cartController.getGuestCart));
router.post("/guest/items", asyncHandler(cartController.addToGuestCart));
router.delete("/guest", asyncHandler(cartController.clearGuestCart));

// All other cart routes are protected
router.use(verifyToken);

router.get("/", asyncHandler(cartController.getCart));
router.post("/items", asyncHandler(cartController.addToCart));
router.put("/items/:itemId", asyncHandler(cartController.updateCartItem));
router.delete("/items/:itemId", asyncHandler(cartController.removeFromCart));
router.delete("/", asyncHandler(cartController.clearCart));

module.exports = router;
