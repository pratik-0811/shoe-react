const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { validateCoupon } = require('../middleware/validation.middleware');

// Admin routes - require admin authentication
router.use('/admin', verifyToken, isAdmin);

// Admin: Get all coupons with filtering and pagination
router.get('/admin', couponController.getAllCoupons);

// Admin: Get coupon statistics
router.get('/admin/stats', couponController.getCouponStats);

// Admin: Get single coupon by ID
router.get('/admin/:id', couponController.getCouponById);

// Admin: Create new coupon
router.post('/admin', validateCoupon, couponController.createCoupon);

// Admin: Update coupon
router.put('/admin/:id', validateCoupon, couponController.updateCoupon);

// Admin: Toggle coupon status (active/inactive)
router.patch('/admin/:id/toggle-status', couponController.toggleCouponStatus);

// Admin: Delete coupon
router.delete('/admin/:id', couponController.deleteCoupon);

// Public: Get active coupons (no authentication required for browsing)
router.get('/active', couponController.getAvailableCoupons);

// Public: Get all coupons with pagination (for general listing)
router.get('/', couponController.getAllCoupons);

// Public: Get single coupon by ID (no authentication required)
router.get('/:id', couponController.getCouponById);

// User routes - require user authentication
router.use(verifyToken);

// User: Validate coupon code
router.post('/validate', couponController.validateCoupon);

// User: Get available coupons for user
router.get('/available', couponController.getAvailableCoupons);

// User: Get user's coupon usage history
router.get('/my-usage', couponController.getUserCouponUsage);

module.exports = router;