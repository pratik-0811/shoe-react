const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

// Get user cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
    
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
    const { productId, quantity } = req.body;
    
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
    
    // Check if product already in cart
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    
    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart, add new item
      cart.items.push({
        product: productId,
        quantity
      });
    }
    
    // Recalculate cart total
    await cart.populate("items.product");
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
    const { productId, quantity } = req.body;
    
    // Find user\'s cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
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
    await cart.populate("items.product");
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
    const { productId } = req.params;
    
    // Find user\'s cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    // Remove item from cart
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    
    // Recalculate cart total
    await cart.populate("items.product");
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
