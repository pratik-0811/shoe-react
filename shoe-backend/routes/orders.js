const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// All order routes require authentication
router.use(verifyToken);

// Admin routes (must come before generic routes)
router.get("/admin/all", isAdmin, orderController.getAllOrders);
router.get("/admin/stats", isAdmin, orderController.getOrderStats);
router.put("/:id/status", isAdmin, orderController.updateOrderStatus);

// User routes
router.post("/", orderController.createOrder);
router.get("/my-orders", orderController.getUserOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id/cancel", orderController.cancelOrder);

module.exports = router;