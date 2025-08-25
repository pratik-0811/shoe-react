import { useState, useEffect } from 'react';
import { Product } from '../types';
import wishlistService from '../services/wishlistService';
import { useAuth } from './useAuth';

export const useWishlist = () => {
  const [items, setItems] = useState<Product[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setItems(JSON.parse(savedWishlist));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  const addItem = async (product: Product) => {
    // Update local state first for immediate UI feedback
    setItems(prevItems => {
      const exists = prevItems.find(item => item._id === product._id);
      if (!exists) {
        return [...prevItems, product];
      }
      return prevItems;
    });
    
    // If authenticated, also update server
    if (isAuthenticated) {
      try {
        await wishlistService.addToWishlist(product._id);
      } catch (err) {
        console.error('Error adding to wishlist:', err);
      }
    }
  };

  const removeItem = async (productId: string) => {
    // Update local state first for immediate UI feedback
    setItems(prevItems => prevItems.filter(item => item._id !== productId));
    
    // If authenticated, also update server
    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
      } catch (err) {
        console.error('Error removing from wishlist:', err);
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item._id === productId);
  };

  const toggleItem = async (product: Product) => {
    if (isInWishlist(product._id)) {
      await removeItem(product._id);
    } else {
      await addItem(product);
    }
  };

  const clearWishlist = async () => {
    // Clear local state
    setItems([]);
    
    // If authenticated, also clear server wishlist
    if (isAuthenticated) {
      try {
        await wishlistService.clearWishlist();
      } catch (err) {
        console.error('Error clearing wishlist:', err);
      }
    }
  };

  return {
    items,
    addItem,
    removeItem,
    isInWishlist,
    toggleItem,
    clearWishlist,
    itemCount: items.length
  };
};