const Wishlist = require("../models/wishlist.model");
const Product = require("../models/product.model");

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wishlist = await Wishlist.findOne({ user: userId }).populate('items.product');
    
    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = new Wishlist({ user: userId, items: [] });
      await wishlist.save();
    }
    
    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        user: userId,
        items: [{ product: productId }]
      });
    } else {
      // Check if product already in wishlist
      const existingItem = wishlist.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        return res.status(400).json({ message: 'Product already in wishlist' });
      }
      
      // Add product to wishlist
      wishlist.items.push({ product: productId });
    }
    
    await wishlist.save();
    await wishlist.populate('items.product');
    
    res.json(wishlist);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    // Remove product from wishlist
    wishlist.items = wishlist.items.filter(item => item.product.toString() !== productId);
    
    await wishlist.save();
    await wishlist.populate('items.product');
    
    res.json(wishlist);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Clear entire wishlist
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = [];
    await wishlist.save();
    
    res.json({ message: 'Wishlist cleared successfully' });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get wishlist item count
const getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wishlist = await Wishlist.findOne({ user: userId });
    const count = wishlist ? wishlist.items.length : 0;
    
    res.json({ count });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  getWishlistCount
};