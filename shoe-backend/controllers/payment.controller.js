const Razorpay = require('razorpay');
const crypto = require('crypto');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const Coupon = require('../models/coupon.model');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --------------------
// Create Razorpay Order
// --------------------
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount provided.' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: 'Payment service not configured. Missing Razorpay credentials.',
      });
    }

    const options = {
      amount: Math.round(amount),
      currency,
      receipt: `order_rcptid_${Date.now()}`,
      notes: {
        userId: req.user?.id || 'guest',
        amount,
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// --------------------------
// Verify Payment & Create Order
// --------------------------
exports.verifyPayment = async (req, res) => {
  console.log('User Detail:', req.user);

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      appliedCoupons = [],
      notes,
    } = req.body;

    const errors = [];
    if (!razorpay_order_id) errors.push({ field: 'razorpay_order_id', message: 'Razorpay order ID is required' });
    if (!razorpay_payment_id) errors.push({ field: 'razorpay_payment_id', message: 'Razorpay payment ID is required' });
    if (!razorpay_signature) errors.push({ field: 'razorpay_signature', message: 'Razorpay signature is required' });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Verify Razorpay Signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature. Payment could not be verified.' });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured') {
      return res.status(400).json({ message: `Payment not captured. Status is "${payment.status}"` });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty. Cannot proceed with order.' });
    }

    for (const item of cart.items) {
      if (!item.product || !item.product.inStock) {
        return res.status(400).json({
          message: `Product "${item.product?.name || 'Unknown'}" is out of stock or invalid.`,
        });
      }
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.product.price * item.quantity;
    }

    const shippingCost = 0;
    const tax = 0;

    // Apply Coupons
    let totalDiscount = 0;
    const processedCoupons = [];

    for (const appliedCoupon of appliedCoupons) {
      const rawCoupon = appliedCoupon?.coupon;

      const code = rawCoupon?.code || appliedCoupon?.code;
      if (!code) continue;

      const coupon = await Coupon.findOne({ code, isActive: true });
      if (!coupon) continue;

      const now = new Date();
      if (coupon.expiryDate && new Date(coupon.expiryDate) < now) continue;
      if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) continue;
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) continue;

      const userCouponUsage = await Order.countDocuments({
        user: req.user._id,
        'appliedCoupons.code': coupon.code,
      });
      if (coupon.userUsageLimit && userCouponUsage >= coupon.userUsageLimit) continue;

      // Calculate Discount
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = subtotal * (coupon.value / 100);
        if (coupon.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'fixed') {
        discountAmount = coupon.value;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      totalDiscount += discountAmount;

      // Only push coupons with required fields to avoid schema validation errors
      if (coupon?.type && coupon?.value != null) {
        processedCoupons.push({
          coupon: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount,
        });

        console.log('Valid coupon applied:', {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount,
        });
      } else {
        console.warn('Skipped coupon due to missing fields:', coupon);
      }
    }

    const total = Math.max(0, subtotal + shippingCost + tax - totalDiscount);
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const finalTotalWithGst = total + gstAmount;

    const calculatedAmount = Math.round(finalTotalWithGst * 100); // in paise
    const razorpayAmount = payment.amount;

    if (Math.abs(calculatedAmount - razorpayAmount) > 1) {
      return res.status(400).json({
        message: 'Payment amount mismatch. Razorpay and calculated totals do not match.',
        debug: {
          razorpayAmount,
          calculatedAmount,
          gstAmount,
          finalTotalWithGst,
        },
      });
    }

    // Build order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
      image: item.product.image,
    }));

    const orderNumber = `ORD-${Date.now()}`;

    // Shipping Address Validation
    const shippingErrors = [];
    const address = shippingAddress?.street || shippingAddress?.address || '';
    if (!address || address.length < 5 || address.length > 200) {
      shippingErrors.push({ field: 'shippingAddress.street', message: 'Street address must be between 5 and 200 characters' });
    }

    if (!shippingAddress?.city || shippingAddress.city.length < 2 || shippingAddress.city.length > 100) {
      shippingErrors.push({ field: 'shippingAddress.city', message: 'City must be between 2 and 100 characters' });
    }

    if (!shippingAddress?.state || shippingAddress.state.length < 2 || shippingAddress.state.length > 100) {
      shippingErrors.push({ field: 'shippingAddress.state', message: 'State must be between 2 and 100 characters' });
    }

    if (!shippingAddress?.zipCode || shippingAddress.zipCode.length < 3 || shippingAddress.zipCode.length > 20) {
      shippingErrors.push({ field: 'shippingAddress.zipCode', message: 'Zip code must be between 3 and 20 characters' });
    }

    if (!shippingAddress?.country || shippingAddress.country.length < 2 || shippingAddress.country.length > 100) {
      shippingErrors.push({ field: 'shippingAddress.country', message: 'Country must be between 2 and 100 characters' });
    }

    if (shippingErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: shippingErrors,
      });
    }

    // Create Order
    const newOrder = new Order({
      user: req.user._id,
      orderNumber,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName || req.user.name || 'Guest User',
        address: address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      },
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      subtotal,
      shippingCost,
      tax: gstAmount,
      total: finalTotalWithGst,
      totalDiscount,
      appliedCoupons: processedCoupons,
      notes,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        paidAt: new Date(payment.created_at * 1000),
      },
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await newOrder.save();

    // Clear cart
    await Cart.findByIdAndUpdate(cart._id, { items: [], total: 0 });

    // Increment user order count
    await User.findByIdAndUpdate(req.user._id, { $inc: { orders: 1 } });

    await newOrder.populate('user', 'name email');

    return res.status(201).json({
      message: 'Payment verified and order created successfully',
      order: newOrder,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      message: 'Error verifying payment or creating order',
      error: error.message,
    });
  }
};



