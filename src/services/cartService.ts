import api from './api';
import { CartItem, Cart } from '../types';

class CartService {
  async getCart(): Promise<Cart> {
    try {
      return await api.get<Cart>('/cart');
    } catch (error) {
      // Fallback to local cart when server is unavailable
      return this.getLocalCart() || { items: [], totalPrice: 0, totalItems: 0 };
    }
  }

  async addToCart(productId: string, quantity = 1, size?: string, color?: string): Promise<Cart> {
    try {
      return await api.post<Cart>('/cart/items', { productId, quantity, size, color });
    } catch (error) {
      // Fallback to local cart when server is unavailable
      const { products } = await import('../data/products');
      const product = products.find(p => p._id === productId);
      if (product) {
        return this.addToLocalCart(product, quantity, size, color);
      }
      throw new Error('Product not found');
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      return await api.put<Cart>(`/cart/items/${itemId}`, { quantity });
    } catch (error) {
      // Fallback to local cart when server is unavailable
      return this.updateLocalCartItem(itemId, quantity);
    }
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    try {
      return await api.delete<Cart>(`/cart/items/${itemId}`);
    } catch (error) {
      // Fallback to local cart when server is unavailable
      return this.removeFromLocalCart(itemId);
    }
  }

  async clearCart(): Promise<{ message: string }> {
    try {
      return await api.delete<{ message: string }>('/cart');
    } catch (error) {
      // Fallback to local cart when server is unavailable
      this.clearLocalCart();
      return { message: 'Cart cleared locally' };
    }
  }

  // For guest users (cart stored in localStorage)
  getLocalCart(): Cart | null {
    const cartStr = localStorage.getItem('cart');
    return cartStr ? JSON.parse(cartStr) : null;
  }

  saveLocalCart(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  addToLocalCart(product: any, quantity = 1, size?: string, color?: string): Cart {
    let cart = this.getLocalCart() || { items: [], totalPrice: 0, totalItems: 0 };
    
    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product._id === product._id && item.size === size && item.color === color
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        _id: Date.now().toString(), // Temporary ID
        product,
        quantity,
        size,
        color,
        price: product.price * quantity
      });
    }
    
    // Recalculate totals
    this.recalculateCart(cart);
    this.saveLocalCart(cart);
    
    return cart;
  }

  updateLocalCartItem(itemId: string, quantity: number): Cart {
    const cart = this.getLocalCart();
    if (!cart) return { items: [], totalPrice: 0, totalItems: 0 };
    
    const itemIndex = cart.items.findIndex(item => item._id === itemId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = cart.items[itemIndex].product.price * quantity;
      this.recalculateCart(cart);
      this.saveLocalCart(cart);
    }
    
    return cart;
  }

  removeFromLocalCart(itemId: string): Cart {
    const cart = this.getLocalCart();
    if (!cart) return { items: [], totalPrice: 0, totalItems: 0 };
    
    cart.items = cart.items.filter(item => item._id !== itemId);
    this.recalculateCart(cart);
    this.saveLocalCart(cart);
    
    return cart;
  }

  clearLocalCart(): Cart {
    const emptyCart = { items: [], totalPrice: 0, totalItems: 0 };
    this.saveLocalCart(emptyCart);
    return emptyCart;
  }

  private recalculateCart(cart: Cart): void {
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
  }

  // Merge local cart with server cart when user logs in
  async mergeWithServerCart(): Promise<Cart> {
    try {
      const localCart = this.getLocalCart();
      if (!localCart || localCart.items.length === 0) {
        return this.getCart();
      }
      
      // Add each local item to server cart
      for (const item of localCart.items) {
        await this.addToCart(
          item.product._id,
          item.quantity,
          item.size,
          item.color
        );
      }
      
      // Clear local cart after merging
      this.clearLocalCart();
      
      // Get updated server cart
      return this.getCart();
    } catch (error) {
      // If server merge fails, return local cart
      return this.getLocalCart() || { items: [], totalPrice: 0, totalItems: 0 };
    }
  }
}

export default new CartService();