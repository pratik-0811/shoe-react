const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes
router.get("/", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/categories", productController.getCategories);
router.get("/category/:category", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

// Review routes
router.post("/:id/reviews", verifyToken, productController.addReview);

// Admin routes
router.use(verifyToken, isAdmin);

router.get("/admin/stats", productController.getProductStats);
router.post("/", productController.createProduct);
router.put("/bulk/update", productController.bulkUpdateProducts);
router.delete("/bulk/delete", productController.bulkDeleteProducts);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
