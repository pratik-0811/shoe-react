import { useState, useEffect } from 'react';
import { Product } from '../types';
import wishlistService, { WishlistItem } from '../services/wishlistService';
import { useAuth } from './useAuth';

export const useWishlist = () => {
  const [items, setItems] = useState<Product[]>([]);
  const { isAuthenticated, user } = useAuth();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsedItems = JSON.parse(savedWishlist);
        setItems(parsedItems || []);
      } catch (error) {
        // Silent fail - fallback to empty wishlist
        setItems([]);
      }
    }
    setInitialLoadComplete(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  // Load server wishlist for authenticated users
  useEffect(() => {
    const loadServerWishlist = async () => {
      if (isAuthenticated && initialLoadComplete && user) {
        try {
          const wishlistData = await wishlistService.getWishlist();
          if (wishlistData && wishlistData.items && wishlistData.items.length > 0) {
            const serverProducts = wishlistData.items.map((item: WishlistItem) => item.product);
            // Merge server items with local items, avoiding duplicates
            setItems(prevItems => {
              const mergedItems = [...prevItems];
              serverProducts.forEach(serverProduct => {
                if (!mergedItems.find(item => item._id === serverProduct._id)) {
                  mergedItems.push(serverProduct);
                }
              });
              return mergedItems;
            });
          }
        } catch (err: any) {
          // Silent fail - error handled by UI state
          // If it's a 401 error, the token might be invalid - don't retry
          if (err?.response?.status === 401) {
            // Authentication failed - token may be invalid
          }
        }
      }
    };

    loadServerWishlist();
  }, [isAuthenticated, initialLoadComplete, user]);

  const addItem = async (product: Product) => {
    // Check if item already exists
    if (items.find(item => item._id === product._id)) {
      return; // Item already in wishlist
    }
    
    // Update local state first for immediate UI feedback
    const newItems = [...items, product];

    setItems(newItems);
    
    // If authenticated, also update server
    if (isAuthenticated) {
      try {
        await wishlistService.addToWishlist(product._id);
        // For authenticated users, keep the local state as is
        // The server sync will happen through other mechanisms
      } catch (err) {
        // Silent fail - revert optimistic update on error
        setItems(prevItems => prevItems.filter(item => item._id !== product._id));
      }
    }
  };

  const removeItem = async (productId: string) => {
    // Store the item being removed for potential rollback
    const removedProduct = items.find(item => item._id === productId);
    
    // Check if item exists
    if (!removedProduct) {
      return; // Item not in wishlist
    }
    
    // Update local state first for immediate UI feedback
    const newItems = items.filter(item => item._id !== productId);

    setItems(newItems);
    
    // If authenticated, also update server
    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
        // For authenticated users, keep the local state as is
        // The server sync will happen through other mechanisms
      } catch (err) {
        // Silent fail - revert optimistic update on error
        if (removedProduct) {
          setItems(prevItems => [...prevItems, removedProduct]);
        }
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
    // Store items for potential rollback
    const previousItems = items;
    
    // Clear local state first for immediate UI feedback
    setItems([]);
    
    // If authenticated, also clear server wishlist
    if (isAuthenticated) {
      try {
        await wishlistService.clearWishlist();
      } catch (err) {
        // Silent fail - revert optimistic update on error
        setItems(previousItems);
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