const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const Category = require('../models/category.model');

class RecommendationService {
  /**
   * Get size and color recommendations for logged-in users based on their last order
   * @param {string} userId - User ID
   * @returns {Object} Recommended sizes and colors
   */
  async getRecommendationsForUser(userId) {
    try {
      // Validate userId format
      if (!userId || typeof userId !== 'string') {
    
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors (invalid user ID)'
        };
      }

      // Get user's orders from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentOrders = await Order.find({ 
        user: userId,
        createdAt: { $gte: thirtyDaysAgo }
      })
        .sort({ createdAt: -1 })
        .populate('items.product');

      if (!recentOrders || recentOrders.length === 0) {
        // Return default recommendations for users without order history
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors (no previous orders found)'
        };
      }

      // Extract sizes and colors from all recent orders
      const sizes = [];
      const colors = [];
      const productCategories = [];
      
      recentOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.size) sizes.push(item.size);
          if (item.color) colors.push(item.color);
          if (item.product && item.product.category) {
            productCategories.push(item.product.category.toString());
          }
        });
      });

      // If no sizes or colors found in order history, return default recommendations
      if (sizes.length === 0 && colors.length === 0) {
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors (no size/color data in order history)'
        };
      }

      // Get frequency of sizes and colors
      const sizeFrequency = this.getFrequency(sizes);
      const colorFrequency = this.getFrequency(colors);

      // Sort by frequency (most used first)
      const recommendedSizes = Object.keys(sizeFrequency)
        .sort((a, b) => sizeFrequency[b] - sizeFrequency[a]);
      const recommendedColors = Object.keys(colorFrequency)
        .sort((a, b) => colorFrequency[b] - colorFrequency[a]);

      // If still no recommendations after processing, fall back to defaults
      if (recommendedSizes.length === 0 && recommendedColors.length === 0) {
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors (processed order data was empty)'
        };
      }

      return {
        recommendedSizes: recommendedSizes.slice(0, 5), // Top 5 sizes
        recommendedColors: recommendedColors.slice(0, 8), // Top 8 colors
        message: `Recommendations based on your ${recentOrders.length} order${recentOrders.length > 1 ? 's' : ''} from the last 30 days`
      };
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      
      // If it's a MongoDB casting error, return default recommendations
      if (error.name === 'CastError' || error.message.includes('Cast to ObjectId failed')) {
  
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors (user data error)'
        };
      }
      
      // For other errors, also return default recommendations instead of throwing

      const defaultRecs = this.getDefaultRecommendations();
      return {
        recommendedSizes: defaultRecs.recommendedSizes,
        recommendedColors: defaultRecs.recommendedColors,
        message: 'Popular sizes and colors (service error)'
      };
    }
  }

  /**
   * Get size and color recommendations for guest users based on their cart
   * @param {string} sessionId - Session ID for guest users
   * @returns {Object} Recommended sizes and colors
   */
  async getRecommendationsForGuest(sessionId) {
    try {
      // Get guest cart items
      const cart = await Cart.findOne({ sessionId })
        .populate('items.product');

      if (!cart || !cart.items.length) {
        return {
          recommendedSizes: [],
          recommendedColors: [],
          message: 'No items in cart'
        };
      }

      // Extract sizes and colors from cart items
      const sizes = cart.items.map(item => item.size).filter(Boolean);
      const colors = cart.items.map(item => item.color).filter(Boolean);

      // Get frequency of sizes and colors
      const sizeFrequency = this.getFrequency(sizes);
      const colorFrequency = this.getFrequency(colors);

      // Sort by frequency (most used first)
      const recommendedSizes = Object.keys(sizeFrequency)
        .sort((a, b) => sizeFrequency[b] - sizeFrequency[a]);
      const recommendedColors = Object.keys(colorFrequency)
        .sort((a, b) => colorFrequency[b] - colorFrequency[a]);

      return {
        recommendedSizes: recommendedSizes.slice(0, 3), // Top 3 sizes
        recommendedColors: recommendedColors.slice(0, 5), // Top 5 colors
        message: 'Recommendations based on your cart items'
      };
    } catch (error) {
      console.error('Error getting guest recommendations:', error);
      
      // Return default recommendations instead of throwing error

      const defaultRecs = this.getDefaultRecommendations();
      return {
        recommendedSizes: defaultRecs.recommendedSizes,
        recommendedColors: defaultRecs.recommendedColors,
        message: 'Popular sizes and colors (guest service error)'
      };
    }
  }

  /**
   * Get enhanced recommendations based on user order history from last 30 days
   * @param {string} userId - User ID (optional)
   * @param {string} sessionId - Session ID (optional)
   * @param {string} productCategory - Product category (ignored - using order history only)
   * @returns {Object} Enhanced recommendations
   */
  async getEnhancedRecommendations(userId = null, sessionId = null, productCategory = null) {
    try {
      let baseRecommendations;
      
      if (userId) {
        baseRecommendations = await this.getRecommendationsForUser(userId);
      } else if (sessionId) {
        baseRecommendations = await this.getRecommendationsForGuest(sessionId);
      } else {
        // Return default recommendations when no user or session provided
        const defaultRecs = this.getDefaultRecommendations();
        return {
          recommendedSizes: defaultRecs.recommendedSizes,
          recommendedColors: defaultRecs.recommendedColors,
          message: 'Popular sizes and colors'
        };
      }

      // Return user's order-based recommendations directly (no category mixing)
      return baseRecommendations;
    } catch (error) {
      console.error('Error getting enhanced recommendations:', error);
      
      // If it's a MongoDB casting error or any other error, return default recommendations

      const defaultRecs = this.getDefaultRecommendations();
      return {
        recommendedSizes: defaultRecs.recommendedSizes,
        recommendedColors: defaultRecs.recommendedColors,
        message: 'Popular sizes and colors (enhanced service error)'
      };
    }
  }

  /**
   * Get purchase-based product recommendations for authenticated users
   * @param {string} userId - User ID
   * @returns {Object} Purchase-based product recommendations
   */
  async getPurchaseBasedRecommendations(userId) {
    try {
      // Get user's past orders
      const userOrders = await Order.find({ 
        user: userId,
        orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
      })
        .populate('items.product')
        .sort({ createdAt: -1 })
        .limit(20); // Get last 20 orders

      if (!userOrders || userOrders.length === 0) {
        // Return trending products for users without purchase history
        return this.getTrendingProducts();
      }

      // Extract purchased product details
      const purchasedProducts = [];
      const purchasedCategories = new Set();
      const purchasedBrands = new Set();
      const purchasedProductIds = new Set();

      userOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product) {
            purchasedProducts.push(item.product);
            purchasedProductIds.add(item.product._id.toString());
            if (item.product.category) purchasedCategories.add(item.product.category.toString());
            if (item.product.brand) purchasedBrands.add(item.product.brand);
          }
        });
      });

      // Find similar products based on categories and brands
      const categoryArray = Array.from(purchasedCategories);
      const brandArray = Array.from(purchasedBrands);
      const excludeIds = Array.from(purchasedProductIds);

      const similarProducts = await Product.find({
        _id: { $nin: excludeIds }, // Exclude already purchased products
        $or: [
          { category: { $in: categoryArray } },
          { brand: { $in: brandArray } }
        ],
        inStock: true
      })
        .populate('category')
        .limit(12)
        .sort({ rating: -1, createdAt: -1 });

      return {
        recommendedProducts: similarProducts,
        recommendationType: 'purchase-based',
        message: `Based on your ${purchasedProducts.length} previous purchases`
      };

    } catch (error) {
      console.error('Error getting purchase-based recommendations:', error);
      return this.getTrendingProducts();
    }
  }

  /**
   * Get cart-based product recommendations for guest users
   * @param {string} sessionId - Session ID for guest users
   * @returns {Object} Cart-based product recommendations
   */
  async getCartBasedRecommendations(sessionId) {
    try {
      // Get guest cart items
      const cart = await Cart.findOne({ sessionId })
        .populate('items.product');

      if (!cart || !cart.items.length) {
        // Return trending products for guests with empty cart
        return this.getTrendingProducts();
      }

      // Extract cart product details
      const cartProducts = [];
      const cartCategories = new Set();
      const cartBrands = new Set();
      const cartProductIds = new Set();

      cart.items.forEach(item => {
        if (item.product) {
          cartProducts.push(item.product);
          cartProductIds.add(item.product._id.toString());
          if (item.product.category) cartCategories.add(item.product.category.toString());
          if (item.product.brand) cartBrands.add(item.product.brand);
        }
      });

      // Find similar products based on categories and brands from cart
      const categoryArray = Array.from(cartCategories);
      const brandArray = Array.from(cartBrands);
      const excludeIds = Array.from(cartProductIds);

      const similarProducts = await Product.find({
        _id: { $nin: excludeIds }, // Exclude already added products
        $or: [
          { category: { $in: categoryArray } },
          { brand: { $in: brandArray } }
        ],
        inStock: true
      })
        .populate('category')
        .limit(12)
        .sort({ rating: -1, createdAt: -1 });

      return {
        recommendedProducts: similarProducts,
        recommendationType: 'cart-based',
        message: `Based on ${cartProducts.length} items in your cart`
      };

    } catch (error) {
      console.error('Error getting cart-based recommendations:', error);
      return this.getTrendingProducts();
    }
  }

  /**
   * Get trending products for guests or fallback
   * @returns {Object} Trending products
   */
  async getTrendingProducts() {
    try {
      // Get products with highest ratings and recent orders
      const trendingProducts = await Product.find({
        inStock: true,
        rating: { $gte: 4.0 }
      })
        .populate('category')
        .sort({ rating: -1, createdAt: -1 })
        .limit(12);

      // If no products meet the trending criteria, return empty array
      // Don't show all products as fallback
      return {
        recommendedProducts: trendingProducts,
        recommendationType: trendingProducts.length > 0 ? 'trending' : 'no-trending',
        message: trendingProducts.length > 0 ? 'Trending products' : 'No trending products available'
      };
    } catch (error) {
      console.error('Error getting trending products:', error);
      return {
        recommendedProducts: [],
        recommendationType: 'error',
        message: 'Unable to load recommendations'
      };
    }
  }

  /**
   * Get popular sizes and colors for a specific product category
   * @param {string} category - Product category
   * @returns {Object} Popular sizes and colors
   */
  async getCategoryRecommendations(category) {
    try {
      // First, find the category by name or slug
      const categoryDoc = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp(category, 'i') } },
          { slug: category.toLowerCase() }
        ]
      });

      if (!categoryDoc) {
  
        return { popularSizes: [], popularColors: [] };
      }

      // Get recent orders with items from this category
      const recentOrders = await Order.find({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      })
      .populate('items.product')
      .limit(100);

      const sizes = [];
      const colors = [];

      recentOrders.forEach(order => {
        order.items.forEach(item => {
          if (item.product && item.product.category && item.product.category.toString() === categoryDoc._id.toString()) {
            if (item.size) sizes.push(item.size);
            if (item.color) colors.push(item.color);
          }
        });
      });

      const sizeFrequency = this.getFrequency(sizes);
      const colorFrequency = this.getFrequency(colors);

      const popularSizes = Object.keys(sizeFrequency)
        .sort((a, b) => sizeFrequency[b] - sizeFrequency[a])
        .slice(0, 5);
      
      const popularColors = Object.keys(colorFrequency)
        .sort((a, b) => colorFrequency[b] - colorFrequency[a])
        .slice(0, 8);

      return {
        popularSizes,
        popularColors
      };
    } catch (error) {
      console.error('Error getting category recommendations:', error);
      return {
        popularSizes: [],
        popularColors: []
      };
    }
  }

  /**
   * Helper function to calculate frequency of items in an array
   * @param {Array} items - Array of items
   * @returns {Object} Frequency object
   */
  getFrequency(items) {
    return items.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {});
  }

  /**
   * Get product-specific size recommendations based on what other users bought
   * @param {string} productId - The product ID to get recommendations for
   * @returns {Object} Product-specific size recommendations
   */
  async getProductSizeRecommendations(productId) {
    try {
      // Get all orders that contain this specific product
      const orders = await Order.find({
        'items.product': productId,
        orderStatus: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
      }).populate('items.product');

      if (!orders || orders.length === 0) {
        return {
          recommendedSizes: [],
          message: 'No purchase history available for this product'
        };
      }

      // Extract sizes purchased for this specific product
      const productSizes = [];
      orders.forEach(order => {
        order.items.forEach(item => {
          if (item.product._id.toString() === productId) {
            productSizes.push(item.size);
          }
        });
      });

      if (productSizes.length === 0) {
        return {
          recommendedSizes: [],
          message: 'No size data available for this product'
        };
      }

      // Calculate size frequency
      const sizeFrequency = this.getFrequency(productSizes);
      
      // Get most popular sizes for this product
      const recommendedSizes = Object.keys(sizeFrequency)
        .sort((a, b) => sizeFrequency[b] - sizeFrequency[a])
        .slice(0, 5);

      const totalPurchases = productSizes.length;
      const uniqueCustomers = new Set(orders.map(order => order.user.toString())).size;

      return {
        recommendedSizes,
        sizeFrequency,
        message: `Based on ${totalPurchases} purchases by ${uniqueCustomers} customers`,
        totalPurchases,
        uniqueCustomers
      };
    } catch (error) {
      console.error('Error getting product size recommendations:', error);
      return {
        recommendedSizes: [],
        message: 'Error retrieving product size recommendations'
      };
    }
  }

  /**
   * Get default recommendations when no user data is available
   * @returns {Object} Default recommendations
   */
  getDefaultRecommendations() {
    return {
      recommendedSizes: ['8', '9', '10'],
      recommendedColors: ['Black', 'White', 'Navy', 'Brown', 'Gray'],
      message: 'Popular sizes and colors'
    };
  }
}

module.exports = new RecommendationService();