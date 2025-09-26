const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const { validateOrder, validatePagination, validateObjectId, handleValidationErrors } = require("../middleware/validation.middleware");
const { asyncHandler } = require("../middleware/error.middleware");
const Order = require('../models/order.model');

// All order routes require authentication
router.use(verifyToken);

// Admin routes (must come before generic routes)
router.get("/admin/all", isAdmin, validatePagination, handleValidationErrors, asyncHandler(orderController.getAllOrders));
router.get("/admin/stats", isAdmin, asyncHandler(orderController.getOrderStats));
router.put("/:id/status", validateObjectId('id'), isAdmin, handleValidationErrors, asyncHandler(orderController.updateOrderStatus));

// User routes
router.post("/", validateOrder, handleValidationErrors, asyncHandler(orderController.createOrder));
router.post("/from-cart", validateOrder, handleValidationErrors, asyncHandler(orderController.createOrderFromCart));
router.post("/clear-cart", asyncHandler(orderController.clearCart));
router.get("/my-orders", validatePagination, handleValidationErrors, asyncHandler(orderController.getUserOrders));
router.get("/:id", validateObjectId('id'), handleValidationErrors, asyncHandler(orderController.getOrderById));
router.put("/:id/cancel", validateObjectId('id'), handleValidationErrors, asyncHandler(orderController.cancelOrder));

// Coupon management routes for orders
router.post("/:id/apply-coupon", validateObjectId('id'), handleValidationErrors, asyncHandler(orderController.applyCouponToOrder));
router.post("/:id/remove-coupon", validateObjectId('id'), handleValidationErrors, asyncHandler(orderController.removeCouponFromOrder));

// Download invoice
router.get('/:orderId/invoice', validateObjectId('orderId'), handleValidationErrors, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      user: userId 
    }).populate('items.product', 'name image images price description brand');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Generate invoice data
    const invoiceData = {
      orderId: order._id,
      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      date: order.createdAt,
      customerName: order.shippingAddress?.fullName || 'Customer',
      customerEmail: order.userEmail || 'customer@example.com',
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      })),
      subtotal: order.subtotal || 0,
      shippingCost: order.shippingCost || 0,
      discount: order.totalDiscount || 0,
      totalAmount: order.total || 0,
      paymentMethod: order.paymentMethod,
      status: order.status
    };

    res.json({
      success: true,
      invoice: invoiceData
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
});

module.exports = router;