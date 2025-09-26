const express = require("express");
const router = express.Router();
const abandonedCartController = require("../controllers/abandonedCart.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

// Public routes (for recovery)
router.get("/recover/:recoveryToken", abandonedCartController.recoverAbandonedCart);
router.post("/ignore/:recoveryToken", abandonedCartController.ignoreAbandonedCart);

// User routes
router.use(verifyToken);
router.post("/track", abandonedCartController.trackAbandonedCart);
router.get("/my-abandoned", abandonedCartController.getUserAbandonedCarts);

// Admin routes
router.use(isAdmin);
router.get("/admin/all", abandonedCartController.getAllAbandonedCarts);
router.post("/admin/send-reminder/:id", abandonedCartController.sendRecoveryReminder);
router.post("/admin/send-bulk-reminders", abandonedCartController.sendBulkReminders);
router.get("/admin/stats", abandonedCartController.getAbandonedCartStats);

module.exports = router;