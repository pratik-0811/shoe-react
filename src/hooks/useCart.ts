import { useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import cartService from '../services/cartService';
import { useAuth } from './useAuth';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        if (isAuthenticated) {
          // If user is logged in, fetch cart from API
          const cart = await cartService.getCart();
          setItems(cart.items || []);
        } else {
          // Otherwise use localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            setItems(JSON.parse(savedCart));
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Fallback to localStorage if API fails
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      }
    };
    
    fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    // Only save to localStorage if not authenticated
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const addItem = async (product: Product, quantity: number = 1, size?: string, color?: string) => {
    try {
      if (isAuthenticated) {
        // If user is logged in, use API
        await cartService.addToCart(product._id, quantity, size, color);
        const cart = await cartService.getCart();
        setItems(cart.items || []);
      } else {
        // Otherwise use local state
        setItems(prevItems => {
          const existingItem = prevItems.find(item => item.product._id === product._id);
          if (existingItem) {
            return prevItems.map(item =>
              item.product._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          }
          return [...prevItems, { _id: Date.now().toString(), product, quantity, size, color }];
        });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      if (isAuthenticated) {
        // Find the cart item id
        const cartItem = items.find(item => item.product._id === productId);
        if (cartItem) {
          await cartService.removeFromCart(cartItem._id);
          const cart = await cartService.getCart();
          setItems(cart.items || []);
        }
      } else {
        setItems(prevItems => prevItems.filter(item => item.product._id !== productId));
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (isAuthenticated) {
        // Find the cart item id
        const cartItem = items.find(item => item.product._id === productId);
        if (cartItem) {
          await cartService.updateCartItem(cartItem._id, quantity);
          const cart = await cartService.getCart();
          setItems(cart.items || []);
        }
      } else {
        setItems(prevItems =>
          prevItems.map(item =>
            item.product._id === productId ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await cartService.clearCart();
        setItems([]);
      } else {
        setItems([]);
        localStorage.removeItem('cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount
  };
};