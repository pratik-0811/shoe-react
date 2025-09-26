const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const Coupon = require("../models/coupon.model");

// Create a new order directly from checkout data
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes, subtotal, shipping, tax, total, coupons } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }
    
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({ message: "Complete shipping address is required" });
    }
    
    // Validate all products exist and are available
    const orderItems = [];
    let calculatedSubtotal = 0;
    
    for (let item of items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) {
        return res.status(400).json({ 
          message: `Product not found: ${item.product.name || item.product}` 
        });
      }
      
      if (!product.inStock) {
        return res.status(400).json({ 
          message: `Product ${product.name} is out of stock` 
        });
      }
      
      const itemTotal = product.price * item.quantity;
      calculatedSubtotal += itemTotal;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        image: product.image,
        size: item.size,
        color: item.color
      });
    }
    
    // Apply coupons if provided
    let appliedCoupons = [];
    let totalDiscount = 0;
    
    if (coupons && Array.isArray(coupons) && coupons.length > 0) {
      for (let couponCode of coupons) {
        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (!coupon) {
          return res.status(400).json({ message: `Invalid coupon code: ${couponCode}` });
        }
        
        // Check if coupon is applicable
        const applicabilityCheck = await coupon.isApplicableToOrder({
          subtotal: calculatedSubtotal,
          user: req.user.id,
          items: orderItems
        });
        
        if (!applicabilityCheck.applicable) {
          return res.status(400).json({ message: applicabilityCheck.reason });
        }
        
        const discount = coupon.calculateDiscount(calculatedSubtotal);
        totalDiscount += discount;
        
        appliedCoupons.push({
          coupon: coupon._id,
          code: coupon.code,
          discountAmount: discount,
          appliedAt: new Date()
        });
      }
    }
    
    // Validate totals match frontend calculation
    const expectedShipping = calculatedSubtotal > 1000 ? 0 : 50;
    const expectedTax = calculatedSubtotal * 0.18;
    const expectedTotal = calculatedSubtotal + expectedShipping + expectedTax - totalDiscount;
    
    // Allow small rounding differences (within 1 rupee)
    if (Math.abs(total - expectedTotal) > 1) {
      return res.status(400).json({ 
        message: "Amount mismatch with cart total",
        expected: expectedTotal,
        received: total
      });
    }
    
    // Create order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal: calculatedSubtotal,
      shippingCost: expectedShipping,
      tax: expectedTax,
      total: expectedTotal,
      appliedCoupons,
      totalDiscount,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await order.save();
    
    // Update user order count
    await User.findByIdAndUpdate(req.user.id, { $inc: { orders: 1 } });
    
    await order.populate('user', 'name email');
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error creating order", error: error.message });
  }
};

// Create order from cart (legacy method)
exports.createOrderFromCart = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes, coupons } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: 'items.product',
      match: { _id: { $ne: null } }
    });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    
    // Validate all products are still available
    for (let item of cart.items) {
      if (!item.product.inStock) {
        return res.status(400).json({ 
          message: `Product ${item.product.name} is out of stock` 
        });
      }
    }
    
    // Calculate totals using Indian rates
    const subtotal = cart.total;
    const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const tax = subtotal * 0.18; // 18% GST
    
    // Apply coupons if provided
    let appliedCoupons = [];
    let totalDiscount = 0;
    
    if (coupons && Array.isArray(coupons) && coupons.length > 0) {
      for (let couponCode of coupons) {
        const coupon = await Coupon.findOne({ code: couponCode, status: 'active' });
        if (!coupon) {
          return res.status(400).json({ message: `Invalid coupon code: ${couponCode}` });
        }
        
        // Check if coupon is applicable
        const applicabilityCheck = await coupon.isApplicableToOrder({
          subtotal,
          user: req.user.id,
          items: cart.items
        });
        
        if (!applicabilityCheck.applicable) {
          return res.status(400).json({ message: applicabilityCheck.reason });
        }
        
        const discount = coupon.calculateDiscount(subtotal);
        totalDiscount += discount;
        
        appliedCoupons.push({
          coupon: coupon._id,
          code: coupon.code,
          discountAmount: discount,
          appliedAt: new Date()
        });
      }
    }
    
    const total = subtotal + shippingCost + tax - totalDiscount;
    
    // Create order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
      image: item.product.image,
      size: item.size,
      color: item.color
    }));
    
    // Create order
    const order = new Order({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      tax,
      total,
      appliedCoupons,
      totalDiscount,
      notes,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await order.save();
    
    // Clear cart after successful order
    cart.items = [];
    cart.total = 0;
    await cart.save();
    
    // Update user order count
    await User.findByIdAndUpdate(req.user.id, { $inc: { orders: 1 } });
    
    await order.populate('user', 'name email');
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error creating order from cart", error: error.message });
  }
};

// Clear cart after successful payment
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
    }
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error clearing cart", error: error.message });
  }
};

// Get all orders (admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filter = {};
    if (status) filter.orderStatus = status;
    
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate({
        path: 'items.product',
        select: 'name image',
        match: { _id: { $ne: null } }
      })
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.status(200).json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, dateFrom, dateTo } = req.query;
    
    // Build filter query
    const filter = { user: req.user.id };
    
    // Add status filter
    if (status) {
      filter.orderStatus = status;
    }
    
    // Add date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lt = endDate;
      }
    }
    
    const orders = await Order.find(filter)
      .populate({
        path: 'items.product',
        select: 'name image images price description brand',
        match: { _id: { $ne: null } }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(filter);
    
    res.status(200).json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user orders", error: error.message });
  }
};

// Get single order
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'items.product',
        select: 'name image images description price brand',
        match: { _id: { $ne: null } }
      });
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, notes } = req.body;
    
    const updateData = { orderStatus };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;
    
    if (orderStatus === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error updating order", error: error.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled in current status" 
      });
    }
    
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = cancelReason;
    
    await order.save();
    
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error cancelling order", error: error.message });
  }
};

// Apply coupon to existing order (before payment)
exports.applyCouponToOrder = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check if order can be modified (only pending orders)
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: "Cannot modify order after processing" });
    }
    
    const result = await order.applyCoupon(couponCode, req.user.id);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error applying coupon", error: error.message });
  }
};

// Remove coupon from existing order (before payment)
exports.removeCouponFromOrder = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Check if order can be modified (only pending orders)
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: "Cannot modify order after processing" });
    }
    
    const result = await order.removeCoupon(couponCode);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error removing coupon", error: error.message });
  }
};

// Get order statistics (admin only)
exports.getOrderStats = async (req, res) => {
  try {
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);
    
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    // Coupon usage statistics
    const couponStats = await Order.aggregate([
      { $match: { appliedCoupons: { $exists: true, $ne: [] } } },
      { $group: { _id: null, totalDiscount: { $sum: '$totalDiscount' }, ordersWithCoupons: { $sum: 1 } } }
    ]);
    
    // Create status breakdown object
    const statusBreakdown = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    statusStats.forEach(stat => {
      if (statusBreakdown.hasOwnProperty(stat._id)) {
        statusBreakdown[stat._id] = stat.count;
      }
    });
    
    res.status(200).json({
      total: totalOrders,
      pending: statusBreakdown.pending,
      processing: statusBreakdown.processing,
      shipped: statusBreakdown.shipped,
      delivered: statusBreakdown.delivered,
      cancelled: statusBreakdown.cancelled,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalDiscount: couponStats[0]?.totalDiscount || 0,
      ordersWithCoupons: couponStats[0]?.ordersWithCoupons || 0
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order statistics", error: error.message });
  }
};