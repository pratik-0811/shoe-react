const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const { verifyToken, optionalAuth } = require('../middleware/auth.middleware');
const { body, validationResult } = require('express-validator');
 
/**
 * @route   GET /api/recommendations/user
 * @desc    Get size and color recommendations for logged-in user based on last order
 * @access  Private
 */
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await recommendationService.getRecommendationsForUser(userId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/purchase-based
 * @desc    Get purchase-based product recommendations for authenticated users
 * @access  Private
 */
router.get('/purchase-based', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await recommendationService.getPurchaseBasedRecommendations(userId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting purchase-based recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get purchase-based recommendations'
    });
  }
});

/**
 * @route   GET /api/recommendations/products
 * @desc    Get product recommendations based on user authentication status
 * @access  Public/Private (adaptive)
 */
router.get('/products', optionalAuth, async (req, res) => {
  try {
    const { sessionId } = req.query;
    let userId = null;
    
    // Check if user is authenticated
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue as guest
  
      }
    }

    let recommendations;
    
    if (userId) {
      // For logged-in users: get recommendations based on purchase history
  
      recommendations = await recommendationService.getPurchaseBasedRecommendations(userId);
    } else if (sessionId) {
      // For guest users: get recommendations based on cart contents
  
      recommendations = await recommendationService.getCartBasedRecommendations(sessionId);
    } else {
      // Fallback to trending products
  
      recommendations = await recommendationService.getTrendingProducts();
    }
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product recommendations'
    });
  }
});

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending products for guests
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const recommendations = await recommendationService.getTrendingProducts();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting trending recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending recommendations'
    });
  }
});

/**
 * @route   POST /api/recommendations/guest
 * @desc    Get size and color recommendations for guest user based on cart
 * @access  Public
 */
router.post('/guest', [
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Session ID must be between 1 and 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { sessionId } = req.body;
    const recommendations = await recommendationService.getRecommendationsForGuest(sessionId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting guest recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/enhanced
 * @desc    Get enhanced recommendations with category analysis
 * @access  Private/Public (depends on user authentication)
 */
router.get('/enhanced', optionalAuth, async (req, res) => {
  try {
    const { category, sessionId } = req.query;
    let userId = null;
    
    // Check if user is authenticated
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }
  
    const recommendations = await recommendationService.getEnhancedRecommendations(
      userId,
      sessionId,
      category
    );
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting enhanced recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/category/:category
 * @desc    Get popular sizes and colors for a specific category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const recommendations = await recommendationService.getCategoryRecommendations(category);
    
    res.json({
      success: true,
      data: {
        category,
        popularSizes: recommendations.popularSizes,
        popularColors: recommendations.popularColors,
        message: `Popular sizes and colors for ${category} products`
      }
    });
  } catch (error) {
    console.error('Error getting category recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/product/:productId/sizes
 * @desc    Get size recommendations for a specific product based on purchase history
 * @access  Public
 */
router.get('/product/:productId/sizes', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const recommendations = await recommendationService.getProductSizeRecommendations(productId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting product size recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get product size recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/default
 * @desc    Get default recommendations when no user data is available
 * @access  Public
 */
router.get('/default', async (req, res) => {
  try {
    const recommendations = await recommendationService.getDefaultRecommendations();
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting default recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get default recommendations',
      error: error.message
    });
  }
});

module.exports = router;