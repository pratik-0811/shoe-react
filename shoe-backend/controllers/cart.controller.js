const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

// Get guest cart
exports.getGuestCart = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    let cart = await Cart.findOne({ sessionId }).populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    
    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = new Cart({ sessionId, items: [], total: 0 });
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error fetching guest cart", error: error.message });
  }
};

// Add item to guest cart
exports.addToGuestCart = async (req, res) => {
  try {
    const { sessionId, productId, quantity, size, color } = req.body;
    
    // Input validation
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Find guest cart or create a new one
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [], total: 0 });
    }
    
    // Check if product already in cart with same size and color
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      item.size === size && 
      item.color === color
    );
    
    if (itemIndex > -1) {
      // Product exists in cart with same attributes, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart or different attributes, add new item
      cart.items.push({
        product: productId,
        quantity,
        size,
        color
      });
    }
    
    // Recalculate cart total
    await cart.populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ message: "Error adding item to guest cart", error: error.message });
  }
};

// Get user cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    
    if (!cart) {
      // Create a new cart if one doesn\'t exist
      cart = new Cart({ user: req.user.id, items: [], total: 0 });
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cart", error: error.message });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    
    // Input validation
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Find user\'s cart or create a new one
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [], total: 0 });
    }
    
    // Check if product already in cart with same size and color
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      item.size === size && 
      item.color === color
    );
    
    if (itemIndex > -1) {
      // Product exists in cart with same attributes, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart or different attributes, add new item
      cart.items.push({
        product: productId,
        quantity,
        size,
        color
      });
    }
    
    // Recalculate cart total
    await cart.populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ message: "Error adding item to cart", error: error.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    // Input validation
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }
    
    // Find user\'s cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    
    // Update quantity or remove if quantity is 0
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    
    // Recalculate cart total
    await cart.populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ message: "Error updating cart item", error: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Input validation
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    
    // Find user\'s cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Check if item exists in cart
    const itemExists = cart.items.some(item => item._id.toString() === itemId);
    if (!itemExists) {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    
    // Remove item from cart
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    
    // Recalculate cart total
    await cart.populate({
      path: "items.product",
      match: { _id: { $ne: null } }
    });
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(400).json({ message: "Error removing item from cart", error: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    // Find user\'s cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Clear cart items and reset total
    cart.items = [];
    cart.total = 0;
    
    await cart.save();
    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    res.status(500).json({ message: "Error clearing cart", error: error.message });
  }
};
