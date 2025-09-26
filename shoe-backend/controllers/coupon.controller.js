const Coupon = require('../models/coupon.model');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const logger = require('../config/logger');

// Admin Controllers

// Get all coupons (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
      query.expiryDate = { $gt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.expiryDate = { $lte: new Date() };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [coupons, totalCount] = await Promise.all([
      Coupon.find(query)
        .populate({
          path: 'createdBy',
          select: 'name email',
          match: { _id: { $ne: null } }
        })
        .populate({
          path: 'applicableCategories',
          select: 'name',
          match: { _id: { $ne: null } }
        })
        .populate({
          path: 'applicableProducts',
          select: 'name',
          match: { _id: { $ne: null } }
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Coupon.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        coupons,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
    });
  }
};

// Get coupon by ID (Admin)
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id)
      .populate({
        path: 'createdBy',
        select: 'name email',
        match: { _id: { $ne: null } }
      })
      .populate({
        path: 'applicableCategories',
        select: 'name',
        match: { _id: { $ne: null } }
      })
      .populate({
        path: 'applicableProducts',
        select: 'name',
        match: { _id: { $ne: null } }
      })
      .populate({
        path: 'allowedUsers',
        select: 'name email',
        match: { _id: { $ne: null } }
      })
      .populate({
        path: 'restrictedUsers',
        select: 'name email',
        match: { _id: { $ne: null } }
      });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    logger.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// Create new coupon (Admin)
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minPurchaseAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      userUsageLimit,
      isActive,
      isPublic,
      applicableCategories,
      applicableProducts,
      allowedUsers,
      restrictedUsers
    } = req.body;

    // Validation
    if (type === 'percentage' && value > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    if (type === 'percentage' && !maxDiscountAmount) {
      return res.status(400).json({
        success: false,
        message: 'Maximum discount amount is required for percentage coupons'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: type === 'percentage' ? maxDiscountAmount : null,
      expiryDate: new Date(expiryDate),
      usageLimit,
      userUsageLimit: userUsageLimit || 1,
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : true,
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      allowedUsers: allowedUsers || [],
      restrictedUsers: restrictedUsers || [],
      createdBy: req.user.id
    });

    await coupon.save();

    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'name email')
      .populate('applicableCategories', 'name')
      .populate('applicableProducts', 'name');

    logger.info(`Coupon created: ${coupon.code} by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: populatedCoupon
    });
  } catch (error) {
    logger.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Update coupon (Admin)
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.usageCount;

    // Validation for percentage coupons
    if (updateData.type === 'percentage' && updateData.value > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount cannot exceed 100%'
      });
    }

    // Check if coupon code already exists (if code is being updated)
    if (updateData.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updateData.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code already exists'
        });
      }
      updateData.code = updateData.code.toUpperCase();
    }

    // Convert expiry date if provided
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('applicableCategories', 'name')
     .populate('applicableProducts', 'name');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    logger.info(`Coupon updated: ${coupon.code} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    logger.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message
    });
  }
};

// Delete coupon (Admin)
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if coupon is used in any orders
    const ordersWithCoupon = await Order.countDocuments({
      'appliedCoupons.coupon': id
    });

    if (ordersWithCoupon > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete coupon as it has been used in orders. Consider deactivating it instead.'
      });
    }

    await Coupon.findByIdAndDelete(id);

    logger.info(`Coupon deleted: ${coupon.code} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
};

// Toggle coupon status (Admin)
const toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    logger.info(`Coupon status toggled: ${coupon.code} - ${coupon.isActive ? 'activated' : 'deactivated'} by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: coupon.isActive }
    });
  } catch (error) {
    logger.error('Error toggling coupon status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle coupon status',
      error: error.message
    });
  }
};

// User Controllers

// Validate coupon (User)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;  // Changed from params to body, renamed orderAmount to orderTotal
    const userId = req.user.id;
    console.log(code, orderTotal);
    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({
        success: false,
        orderTotal : orderTotal,
        message: 'Valid order amount is required'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is applicable
    const applicabilityCheck = coupon.isApplicableToOrder(orderTotal, userId);
    if (!applicabilityCheck.valid) {
      return res.status(400).json({
        success: false,
        message: applicabilityCheck.message
      });
    }

    // Check user usage limit
    const userUsageCount = await Order.countDocuments({
      user: userId,
      'appliedCoupons.coupon': coupon._id
    });

    if (userUsageCount >= coupon.userUsageLimit) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the usage limit for this coupon'
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(orderTotal);

    // Return shape expected by frontend: { data: { isValid, coupon, discountAmount } }
    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        isValid: true,
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: coupon.value,
          minPurchaseAmount: coupon.minPurchaseAmount,
          maxDiscountAmount: coupon.maxDiscountAmount,
          expiryDate: coupon.expiryDate,
          isActive: coupon.isActive,
          usageCount: coupon.usageCount,
          usageLimit: coupon.usageLimit,
          userUsageLimit: coupon.userUsageLimit
        },
        discountAmount
      }
    });
  } catch (error) {
    logger.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message
    });
  }
};

// Get available coupons for user
const getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { orderAmount } = req.query;

    const query = {
      isActive: true,
      expiryDate: { $gt: new Date() },
      isPublic: true // For public access, only show public coupons
    };

    // If user is authenticated, include user-specific coupons
    if (userId) {
      query.$or = [
        { isPublic: true },
        { allowedUsers: userId }
      ];
      query.restrictedUsers = { $ne: userId };
      delete query.isPublic; // Remove the isPublic filter when using $or
    }

    // Add usage limit filter
    if (query.$or) {
      query.$or.push({
        usageLimit: null
      }, {
        $expr: { $lt: ['$usageCount', '$usageLimit'] }
      });
    } else {
      // For public access, add usage limit as separate conditions
      query.$and = [
        {
          $or: [
            { usageLimit: null },
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
          ]
        }
      ];
    }

    let coupons = await Coupon.find(query)
      .select('code name description type value minPurchaseAmount maxDiscountAmount expiryDate')
      .sort({ createdAt: -1 });

    // Filter coupons based on order amount if provided
    if (orderAmount) {
      coupons = coupons.filter(coupon => {
        const applicabilityCheck = coupon.isApplicableToOrder(parseFloat(orderAmount), userId);
        return applicabilityCheck.valid;
      });

      // Add discount amount for each coupon
      coupons = coupons.map(coupon => {
        const discountAmount = coupon.calculateDiscount(parseFloat(orderAmount));
        return {
          ...coupon.toObject(),
          discountAmount
        };
      });
    }

    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    logger.error('Error fetching available coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available coupons',
      error: error.message
    });
  }
};

// Get coupon usage statistics (Admin)
const getCouponStats = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Get usage statistics
    const [totalOrders, totalDiscount, recentOrders] = await Promise.all([
      Order.countDocuments({ 'appliedCoupons.coupon': id }),
      Order.aggregate([
        { $match: { 'appliedCoupons.coupon': coupon._id } },
        { $unwind: '$appliedCoupons' },
        { $match: { 'appliedCoupons.coupon': coupon._id } },
        { $group: { _id: null, totalDiscount: { $sum: '$appliedCoupons.discountAmount' } } }
      ]),
      Order.find({ 'appliedCoupons.coupon': id })
        .populate('user', 'name email')
        .select('user orderNumber total appliedCoupons createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const stats = {
      coupon: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        usageCount: coupon.usageCount,
        usageLimit: coupon.usageLimit,
        remainingUses: coupon.remainingUses,
        isActive: coupon.isActive,
        isExpired: coupon.isExpired
      },
      usage: {
        totalOrders,
        totalDiscount: totalDiscount[0]?.totalDiscount || 0,
        averageDiscount: totalOrders > 0 ? (totalDiscount[0]?.totalDiscount || 0) / totalOrders : 0
      },
      recentOrders: recentOrders.map(order => ({
        orderNumber: order.orderNumber,
        user: order.user,
        total: order.total,
        discountAmount: order.appliedCoupons.find(ac => ac.coupon.toString() === id)?.discountAmount || 0,
        createdAt: order.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching coupon stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon statistics',
      error: error.message
    });
  }
};

// Get user's coupon usage history
const getUserCouponUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all orders for this user that have coupons applied
    const orders = await Order.find({
      user: userId,
      'coupon.code': { $exists: true }
    })
    .populate('coupon.couponId', 'code name type discountValue')
    .select('orderNumber coupon totalAmount discountAmount createdAt status')
    .sort({ createdAt: -1 });

    const couponUsage = orders.map(order => ({
      orderNumber: order.orderNumber,
      couponCode: order.coupon.code,
      couponName: order.coupon.couponId?.name || 'Unknown',
      discountAmount: order.discountAmount || 0,
      orderTotal: order.totalAmount,
      usedAt: order.createdAt,
      orderStatus: order.status
    }));

    res.json({
      success: true,
      data: couponUsage,
      total: couponUsage.length
    });
  } catch (error) {
    logger.error('Error fetching user coupon usage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon usage history',
      error: error.message
    });
  }
};

module.exports = {
  // Admin controllers
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats,
  // User controllers
  validateCoupon,
  getAvailableCoupons,
  getUserCouponUsage
};