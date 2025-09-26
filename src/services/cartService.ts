import api from './api';
import { Cart, Product } from '../types';

class CartService {
  async getCart(): Promise<Cart> {
    const res = await api.get<Cart>('/cart', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return res.data; // ✅ return only the JSON body
  }

  async addToCart(productId: string, quantity = 1, size?: string, color?: string): Promise<Cart> {
    const res = await api.post<Cart>('/cart/items', { productId, quantity, size, color });
    return res.data; // ✅
  }

  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    const res = await api.put<Cart>(`/cart/items/${itemId}`, { quantity });
    return res.data; // ✅
  }

  async removeFromCart(itemId: string): Promise<Cart> {
    const res = await api.delete<Cart>(`/cart/items/${itemId}`);
    return res.data; // ✅
  }

  async clearCart(): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>('/cart');
    return res.data; // ✅
  }

  // Guest cart methods (backend-based)
  async getGuestCart(sessionId: string): Promise<Cart> {
    const res = await api.post<Cart>('/cart/guest', { sessionId });
    return res.data;
  }

  async addToGuestCart(sessionId: string, productId: string, quantity = 1, size?: string, color?: string): Promise<Cart> {
    const res = await api.post<Cart>('/cart/guest/items', { sessionId, productId, quantity, size, color });
    return res.data;
  }

  // For guest users (cart stored in localStorage) - fallback
  getLocalCart(): Cart | null {
    const cartStr = localStorage.getItem('cart');
    if (!cartStr || cartStr === 'undefined' || cartStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(cartStr);
    } catch (error) {
      return null;
    }
  }

  saveLocalCart(cart: Cart): void {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  addToLocalCart(product: Product, quantity = 1, size?: string, color?: string): Cart {
    const cart = this.getLocalCart() || { items: [], totalPrice: 0, totalItems: 0 };

    // Check if product already exists
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product._id === product._id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price =
        cart.items[existingItemIndex].product.price * cart.items[existingItemIndex].quantity;
    } else {
      cart.items.push({
        _id: Date.now().toString(), // temporary ID
        product,
        quantity,
        size,
        color,
        price: product.price * quantity,
      });
    }

    this.recalculateCart(cart);
    this.saveLocalCart(cart);
    return cart;
  }

  updateLocalCartItem(itemId: string, quantity: number): Cart {
    const cart = this.getLocalCart();
    if (!cart) return { items: [], totalPrice: 0, totalItems: 0 };

    const itemIndex = cart.items.findIndex((item) => item._id === itemId);
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

    cart.items = cart.items.filter((item) => item._id !== itemId);
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
        await this.addToCart(item.product._id, item.quantity, item.size, item.color);
      }

      // Clear local cart after merge
      this.clearLocalCart();

      // Return updated server cart
      const updatedCart = await this.getCart();
      return updatedCart;
    } catch (err) {
      return this.getLocalCart() || { items: [], totalPrice: 0, totalItems: 0 };
    }
  }
}

export default new CartService();
