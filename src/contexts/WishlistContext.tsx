import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import wishlistService, { WishlistItem } from '../services/wishlistService';
import { useAuth } from '../hooks/useAuth';

interface WishlistContextType {
  items: Product[];
  itemCount: number;
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => Promise<void>;
  clearWishlist: () => Promise<void>;
  loading: boolean;
  mergeWishlistOnLogin: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider = ({ children }: WishlistProviderProps) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Calculate derived values
  const itemCount = items.length;

  // Load wishlist from localStorage on mount
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

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  // Load server wishlist for authenticated users
  useEffect(() => {
    const loadServerWishlist = async () => {
      if (isAuthenticated && initialLoadComplete && user) {
        try {
          setLoading(true);
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
          
          // Handle 401 errors gracefully - don't force login, just use local wishlist
          if (err?.response?.status === 401) {
            // Authentication failed, falling back to local wishlist
          }
        } finally {
          setLoading(false);
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
        // Refresh wishlist from server to ensure consistency
        const updatedWishlist = await wishlistService.getWishlist();
        if (updatedWishlist && updatedWishlist.items) {
          setItems(updatedWishlist.items.map((item: WishlistItem) => item.product));
        }
      } catch (err: any) {
        // Silent fail - error handled by UI state
        
        // Handle 401 errors gracefully - fallback to local wishlist
        if (err?.response?.status === 401) {
          // Authentication failed, adding to local wishlist instead
        } else {
          // Revert optimistic update on other errors
          setItems(prevItems => prevItems.filter(item => item._id !== product._id));
        }
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
      } catch (err: any) {
        // Silent fail - error handled by UI state
        
        // Handle 401 errors gracefully
        if (err?.response?.status === 401) {
          // Authentication failed during wishlist item removal
        } else {
          // Revert optimistic update on other errors - add the item back
          if (removedProduct) {
            setItems(prevItems => [...prevItems, removedProduct]);
          }
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
      } catch (err: any) {
        // Silent fail - error handled by UI state
        
        // Handle 401 errors gracefully
        if (err?.response?.status === 401) {
          // Authentication failed during wishlist clear
        } else {
          // Revert optimistic update on other errors
          setItems(previousItems);
        }
      }
    }
  };

  // Merge wishlist when user logs in
  const mergeWishlistOnLogin = async () => {
    try {
      setLoading(true);
      const mergedWishlist = await wishlistService.mergeWithServerWishlist();
      
      // Add null checking to prevent map error
      if (mergedWishlist && mergedWishlist.items && Array.isArray(mergedWishlist.items)) {
        setItems(mergedWishlist.items.map(item => item.product));
      } else {
        // Merged wishlist has no items or invalid structure
        setItems([]);
      }
    } catch (error) {
      // Silent fail - keep existing items on error
    } finally {
      setLoading(false);
    }
  };

  const value: WishlistContextType = {
    items,
    itemCount,
    addItem,
    removeItem,
    isInWishlist,
    toggleItem,
    clearWishlist,
    loading,
    mergeWishlistOnLogin
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};