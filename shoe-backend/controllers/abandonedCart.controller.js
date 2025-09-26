const AbandonedCart = require("../models/abandonedCart.model");
const Cart = require("../models/cart.model");
const User = require("../models/user.model");

// Track abandoned cart
exports.trackAbandonedCart = async (req, res) => {
  try {
    const { sessionId, deviceInfo } = req.body;
    
    // Get user's current cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "No cart items to track" });
    }
    
    // Get user info
    const user = await User.findById(req.user.id);
    
    // Check if there's already an active abandoned cart for this user
    let abandonedCart = await AbandonedCart.findOne({ 
      user: req.user.id, 
      status: 'active' 
    });
    
    const abandonedItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      name: item.product.name,
      image: item.product.image
    }));
    
    if (abandonedCart) {
      // Update existing abandoned cart
      abandonedCart.items = abandonedItems;
      abandonedCart.total = cart.total;
      abandonedCart.abandonedAt = new Date();
      abandonedCart.sessionId = sessionId;
      abandonedCart.deviceInfo = deviceInfo;
      abandonedCart.reminderCount = 0;
      abandonedCart.lastReminderSent = null;
    } else {
      // Create new abandoned cart
      abandonedCart = new AbandonedCart({
        user: req.user.id,
        email: user.email,
        items: abandonedItems,
        total: cart.total,
        sessionId,
        deviceInfo
      });
    }
    
    await abandonedCart.save();
    
    res.status(200).json({ 
      message: "Abandoned cart tracked successfully",
      recoveryToken: abandonedCart.recoveryToken
    });
  } catch (error) {
    res.status(400).json({ message: "Error tracking abandoned cart", error: error.message });
  }
};

// Get all abandoned carts (admin only)
exports.getAllAbandonedCarts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'active';
    const sortBy = req.query.sortBy || 'abandonedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const filter = { status };
    
    const abandonedCarts = await AbandonedCart.find(filter)
      .populate('user', 'name email')
      .populate('items.product', 'name image')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await AbandonedCart.countDocuments(filter);
    
    res.status(200).json({
      abandonedCarts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching abandoned carts", error: error.message });
  }
};

// Get user's abandoned carts
exports.getUserAbandonedCarts = async (req, res) => {
  try {
    const abandonedCarts = await AbandonedCart.find({ 
      user: req.user.id,
      status: { $in: ['active', 'recovered'] }
    })
    .populate('items.product', 'name image price')
    .sort({ abandonedAt: -1 })
    .limit(5); // Limit to recent 5
    
    res.status(200).json(abandonedCarts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user abandoned carts", error: error.message });
  }
};

// Recover abandoned cart
exports.recoverAbandonedCart = async (req, res) => {
  try {
    const { recoveryToken } = req.params;
    
    const abandonedCart = await AbandonedCart.findOne({ 
      recoveryToken,
      status: 'active',
      expiresAt: { $gt: new Date() }
    }).populate('items.product');
    
    if (!abandonedCart) {
      return res.status(404).json({ message: "Invalid or expired recovery token" });
    }
    
    // Check if products are still available
    const availableItems = [];
    const unavailableItems = [];
    
    for (let item of abandonedCart.items) {
      if (item.product && item.product.inStock) {
        availableItems.push(item);
      } else {
        unavailableItems.push(item);
      }
    }
    
    if (availableItems.length === 0) {
      return res.status(400).json({ 
        message: "All items in abandoned cart are no longer available",
        unavailableItems
      });
    }
    
    // Get or create user's current cart
    let currentCart = await Cart.findOne({ user: abandonedCart.user });
    if (!currentCart) {
      currentCart = new Cart({ user: abandonedCart.user, items: [], total: 0 });
    }
    
    // Add available items to current cart
    for (let item of availableItems) {
      const existingItemIndex = currentCart.items.findIndex(
        cartItem => cartItem.product.toString() === item.product._id.toString()
      );
      
      if (existingItemIndex > -1) {
        currentCart.items[existingItemIndex].quantity += item.quantity;
      } else {
        currentCart.items.push({
          product: item.product._id,
          quantity: item.quantity
        });
      }
    }
    
    // Recalculate cart total
    await currentCart.populate('items.product');
    currentCart.total = currentCart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    await currentCart.save();
    
    // Mark abandoned cart as recovered
    abandonedCart.status = 'recovered';
    abandonedCart.recoveredAt = new Date();
    await abandonedCart.save();
    
    res.status(200).json({
      message: "Cart recovered successfully",
      cart: currentCart,
      recoveredItems: availableItems.length,
      unavailableItems
    });
  } catch (error) {
    res.status(400).json({ message: "Error recovering cart", error: error.message });
  }
};

// Mark abandoned cart as ignored
exports.ignoreAbandonedCart = async (req, res) => {
  try {
    const { recoveryToken } = req.params;
    
    const abandonedCart = await AbandonedCart.findOneAndUpdate(
      { recoveryToken, status: 'active' },
      { status: 'ignored' },
      { new: true }
    );
    
    if (!abandonedCart) {
      return res.status(404).json({ message: "Abandoned cart not found" });
    }
    
    res.status(200).json({ message: "Abandoned cart marked as ignored" });
  } catch (error) {
    res.status(400).json({ message: "Error ignoring abandoned cart", error: error.message });
  }
};

// Send recovery reminder (admin only)
exports.sendRecoveryReminder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const abandonedCart = await AbandonedCart.findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name image price');
    
    if (!abandonedCart) {
      return res.status(404).json({ message: "Abandoned cart not found" });
    }
    
    if (abandonedCart.status !== 'active') {
      return res.status(400).json({ message: "Cannot send reminder for inactive cart" });
    }
    
    if (abandonedCart.reminderCount >= abandonedCart.maxReminders) {
      return res.status(400).json({ message: "Maximum reminders already sent" });
    }
    
    // Update reminder tracking
    abandonedCart.lastReminderSent = new Date();
    abandonedCart.reminderCount += 1;
    await abandonedCart.save();
    
    // Here you would integrate with your email service
    // For now, we'll just return success
    
    res.status(200).json({ 
      message: "Recovery reminder sent successfully",
      reminderCount: abandonedCart.reminderCount,
      recoveryLink: `${process.env.FRONTEND_URL}/recover-cart/${abandonedCart.recoveryToken}`
    });
  } catch (error) {
    res.status(400).json({ message: "Error sending reminder", error: error.message });
  }
};

// Get abandoned cart statistics (admin only)
exports.getAbandonedCartStats = async (req, res) => {
  try {
    const stats = await AbandonedCart.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);
    
    const totalAbandoned = await AbandonedCart.countDocuments({ status: 'active' });
    const totalRecovered = await AbandonedCart.countDocuments({ status: 'recovered' });
    const recoveryRate = totalAbandoned > 0 ? ((totalRecovered / (totalAbandoned + totalRecovered)) * 100).toFixed(2) : 0;
    
    const recentAbandoned = await AbandonedCart.find({ 
      status: 'active',
      abandonedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).countDocuments();
    
    res.status(200).json({
      statusBreakdown: stats,
      totalAbandoned,
      totalRecovered,
      recoveryRate: parseFloat(recoveryRate),
      recentAbandoned
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching abandoned cart statistics", error: error.message });
  }
};