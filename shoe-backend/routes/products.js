const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// Protected routes (admin only)
router.post("/", verifyToken, isAdmin, productController.createProduct);
router.put("/:id", verifyToken, isAdmin, productController.updateProduct);
router.delete("/:id", verifyToken, isAdmin, productController.deleteProduct);

// Review routes
router.post("/:id/reviews", verifyToken, productController.addReview);

module.exports = router;
