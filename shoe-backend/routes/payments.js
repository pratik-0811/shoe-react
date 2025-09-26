const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validatePayment, handleValidationErrors } = require("../middleware/validation.middleware");
const { body } = require('express-validator');
const { asyncHandler } = require("../middleware/error.middleware");

// All payment routes require authentication
router.use(verifyToken);

// Create Razorpay order
router.post("/create-order", [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Currency must be INR, USD, or EUR'),
  handleValidationErrors
], asyncHandler(paymentController.createRazorpayOrder));

// Verify payment and create order
router.post("/verify", [
  validatePayment,
  handleValidationErrors
], asyncHandler(paymentController.verifyPayment));

// Get payment status
router.get("/status/:paymentId", asyncHandler(paymentController.getPaymentStatus));

module.exports = router;