const Newsletter = require('../models/newsletter.model');
const logger = require('../config/logger');

// Subscribe to newsletter
const subscribe = async (req, res) => {
  try {
    const { email, source = 'website', preferences } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ email });
    
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(409).json({
          success: false,
          message: 'Email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        await existingSubscription.resubscribe();
        logger.info(`Newsletter resubscription: ${email}`);
        
        return res.status(200).json({
          success: true,
          message: 'Successfully resubscribed to newsletter',
          data: {
            email: existingSubscription.email,
            subscribedAt: existingSubscription.subscribedAt,
            status: 'resubscribed'
          }
        });
      }
    }

    // Create new subscription
    const subscription = new Newsletter({
      email,
      source,
      preferences: preferences || {}
    });

    await subscription.save();
    logger.info(`New newsletter subscription: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt,
        status: 'subscribed'
      }
    });

  } catch (error) {
    logger.error('Newsletter subscription error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email is already subscribed'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Unsubscribe from newsletter
const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscription = await Newsletter.findOne({ email });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list'
      });
    }

    if (!subscription.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Email is already unsubscribed'
      });
    }

    await subscription.unsubscribe();
    logger.info(`Newsletter unsubscription: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    logger.error('Newsletter unsubscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all subscribers (Admin only)
const getAllSubscribers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    const subscribers = await Newsletter.find(filter)
      .select('-__v')
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Newsletter.countDocuments(filter);
    const activeCount = await Newsletter.getActiveSubscribersCount();

    res.status(200).json({
      success: true,
      data: {
        subscribers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscribers: total,
          activeSubscribers: activeCount,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get subscribers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get newsletter statistics
const getStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.getActiveSubscribersCount();
    const recentSubscribers = await Newsletter.getRecentSubscribers(30);
    
    // Get monthly growth
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyGrowth = await Newsletter.countDocuments({
      subscribedAt: { $gte: thirtyDaysAgo },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        inactiveSubscribers: totalSubscribers - activeSubscribers,
        monthlyGrowth,
        recentSubscribersCount: recentSubscribers.length,
        conversionRate: totalSubscribers > 0 ? ((activeSubscribers / totalSubscribers) * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    logger.error('Get newsletter stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  getStats
};