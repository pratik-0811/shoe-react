const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const { validateProduct, validatePagination, validateSearch, validateObjectId, handleValidationErrors } = require("../middleware/validation.middleware");
const { asyncHandler } = require("../middleware/error.middleware");

// Public routes
router.get("/", validatePagination, handleValidationErrors, asyncHandler(productController.getAllProducts));
router.get("/search", validateSearch, validatePagination, handleValidationErrors, asyncHandler(productController.searchProducts));
router.get("/featured", validatePagination, handleValidationErrors, asyncHandler(productController.getFeaturedProducts));
router.get("/new-arrivals", validatePagination, handleValidationErrors, asyncHandler(productController.getNewArrivals));
router.get("/categories", asyncHandler(productController.getCategories));
router.get("/category/:category", validatePagination, handleValidationErrors, asyncHandler(productController.getProductsByCategory));
// This route must come last among GET routes to avoid conflicts with specific routes above
router.get("/:id", validateObjectId('id'), handleValidationErrors, asyncHandler(productController.getProductById));

// Review routes
router.post("/:id/reviews", validateObjectId('id'), verifyToken, handleValidationErrors, asyncHandler(productController.addReview));

// Admin routes
router.use(verifyToken, isAdmin);

router.get("/admin/stats", asyncHandler(productController.getProductStats));
router.post("/", validateProduct, handleValidationErrors, asyncHandler(productController.createProduct));
router.put("/bulk/update", handleValidationErrors, asyncHandler(productController.bulkUpdateProducts));
router.delete("/bulk/delete", handleValidationErrors, asyncHandler(productController.bulkDeleteProducts));
router.put("/:id", validateObjectId('id'), validateProduct, handleValidationErrors, asyncHandler(productController.updateProduct));
router.delete("/:id", validateObjectId('id'), handleValidationErrors, asyncHandler(productController.deleteProduct));

module.exports = router;
