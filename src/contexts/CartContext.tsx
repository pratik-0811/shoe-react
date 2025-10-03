import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CartItem, Product } from '../types';
import cartService from '../services/cartService';
import { useAuth } from '../hooks/useAuth';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  mergeCartOnLogin: () => Promise<void>;
  loading: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

// ✅ Helper to normalize cart response
const normalizeCart = (cartResponse: any): CartItem[] => {
  if (!cartResponse) return [];
  if (Array.isArray(cartResponse)) return cartResponse; // direct array
  if (cartResponse.items) return cartResponse.items; // { items: [...] }
  if (cartResponse.cart?.items) return cartResponse.cart.items; // { cart: { items: [...] } }
  return [];
};

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Derived values
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Debug effect to track itemCount changes
  useEffect(() => {

  }, [itemCount, items]);

  // Helper to get or create session ID for guest users
  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      // Try to recover from backup storage (sessionStorage persists during page refresh but not cache clear)
      sessionId = sessionStorage.getItem('guestSessionIdBackup');
      if (!sessionId) {
        sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      localStorage.setItem('guestSessionId', sessionId);
      sessionStorage.setItem('guestSessionIdBackup', sessionId);
    } else {
      // Ensure backup is in sync
      sessionStorage.setItem('guestSessionIdBackup', sessionId);
    }
    return sessionId;
  };

  // Load cart on mount/auth changes - wait for auth to finish loading
  useEffect(() => {
    // Don't load cart until auth state is determined
    if (authLoading) {
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        
        // Handle cart loading based on authentication status
        let cartLoaded = false;

        if (isAuthenticated) {
          try {
            const cart = await cartService.getCart();
            const normalizedCart = normalizeCart(cart);
            
            // If backend cart is empty but we have local cart data, merge them
            if (normalizedCart.length === 0) {
              const localCart = localStorage.getItem('cart');
              if (localCart && localCart !== 'undefined' && localCart !== 'null') {
                try {
                  const parsedLocalCart = JSON.parse(localCart);
                  const localItems = normalizeCart(parsedLocalCart);
                  if (localItems.length > 0) {
                    // Merge local cart with server cart (which is empty)
                    setItems(localItems);
                    // Trigger merge to sync with backend
                    setTimeout(() => {
                      cartService.mergeWithServerCart().then(mergedCart => {
                        setItems(normalizeCart(mergedCart));
                      }).catch(error => {
                        // Silent fail - error handled by UI state
                      });
                    }, 100);
                    cartLoaded = true;
                    setCartLoaded(true);
                    return;
                  }
                } catch (error) {
                  // Silent fail - error handled by UI state
                }
              }
            }
            
            setItems(normalizedCart);
            cartLoaded = true;
            setCartLoaded(true);
          } catch (authCartError) {
            // Silent fail - fallback to local cart for authenticated users too
            const localCart = localStorage.getItem('cart');
            if (localCart && localCart !== 'undefined' && localCart !== 'null') {
              try {
                const parsedCart = JSON.parse(localCart);
                setItems(normalizeCart(parsedCart));
                cartLoaded = true;
              } catch (error) {
                // Silent fail - error handled by UI state
              }
            }
            if (!cartLoaded) {
              setItems([]);
            }
          }
        } else {
          // Guest user logic - prioritize local storage
          const localCart = localStorage.getItem('cart');
          const sessionCart = sessionStorage.getItem('cartBackup');
          const existingSessionId = localStorage.getItem('guestSessionId') || sessionStorage.getItem('guestSessionIdBackup');
          
          // Try localStorage first
          if (localCart && localCart !== 'undefined' && localCart !== 'null') {
            try {
              const parsedCart = JSON.parse(localCart);
              setItems(normalizeCart(parsedCart));
              cartLoaded = true;
            } catch (error) {
              // Silent fail - error handled by UI state
            }
          }
          
          // If localStorage failed, try sessionStorage backup
          if (!cartLoaded && sessionCart && sessionCart !== 'undefined' && sessionCart !== 'null') {
            try {
              const parsedCart = JSON.parse(sessionCart);
              setItems(normalizeCart(parsedCart));
              localStorage.setItem('cart', sessionCart); // Restore to localStorage
              cartLoaded = true;
            } catch (error) {
              // Silent fail - error handled by UI state
            }
          }
          
          // If no local data but we have an existing session ID, try backend
          if (!cartLoaded && existingSessionId) {
            try {
              const sessionId = getSessionId();
              const cart = await cartService.getGuestCart(sessionId);
              setItems(normalizeCart(cart));
              cartLoaded = true;
            } catch (guestCartError) {
              // Silent fail - error handled by UI state
            }
          }
          
          // If nothing worked, initialize empty cart
          if (!cartLoaded) {
            setItems([]);
          }
        }
      } catch (error: any) {
        // Silent fail - error handled by UI state
        
        // Handle 401 errors gracefully - don't force login, just use local cart
        if (error?.response?.status === 401) {
          // Authentication failed, falling back to local cart
        }
        
        // Try localStorage first, then sessionStorage backup
        let savedCart = localStorage.getItem('cart');
        if (!savedCart || savedCart === 'undefined' || savedCart === 'null') {
          savedCart = sessionStorage.getItem('cartBackup');
        }
        
        if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
          try {
            const parsedCart = JSON.parse(savedCart);
            setItems(normalizeCart(parsedCart));
            // If we recovered from sessionStorage, save back to localStorage
            if (!localStorage.getItem('cart')) {
              localStorage.setItem('cart', savedCart);
            }
          } catch (err) {
            // Silent fail - error handled by UI state
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setCartLoaded(true);
      }
    };

    fetchCart();
  }, [isAuthenticated, authLoading]);

  // Save to localStorage for guest users with enhanced persistence
  useEffect(() => {
    if (!isAuthenticated && cartLoaded) {
      localStorage.setItem('cart', JSON.stringify(items));
      sessionStorage.setItem('cartBackup', JSON.stringify(items));
    }
  }, [items, isAuthenticated, cartLoaded]);

  const addItem = async (product: Product, quantity = 1, size?: string, color?: string) => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        await cartService.addToCart(product._id, quantity, size, color);
        const cart = await cartService.getCart();
        setItems(normalizeCart(cart));
      } else {
        // For guest users, try to use backend guest cart first
        try {
          const sessionId = getSessionId();
          const cart = await cartService.addToGuestCart(sessionId, product._id, quantity, size, color);
          setItems(normalizeCart(cart));
        } catch (guestCartError) {
          // Silent fail - fallback to local storage
          // Fallback to local storage (localStorage + sessionStorage backup)
          setItems(prevItems => {
            const existingItem = prevItems.find(
              item => item.product._id === product._id && item.size === size && item.color === color
            );

            if (existingItem) {
              return prevItems.map(item =>
                item.product._id === product._id && item.size === size && item.color === color
                  ? { ...item, quantity: item.quantity + quantity, price: product.price * (item.quantity + quantity) }
                  : item
              );
            }

            const uniqueId = `${product._id}-${size || 'no-size'}-${color || 'no-color'}-${Date.now()}`;
            return [
              ...prevItems,
              {
                _id: uniqueId,
                product,
                quantity,
                size,
                color,
                price: product.price * quantity,
              },
            ];
          });
        }
      }
    } catch (error: any) {
      // Silent fail - error handled by UI state
      
      // Handle 401 errors gracefully - fallback to local cart
      if (error?.response?.status === 401) {
        // Authentication failed, adding to local cart instead
        // Retry as guest user
        setItems(prevItems => {
          const existingItem = prevItems.find(
            item => item.product._id === product._id && item.size === size && item.color === color
          );

          if (existingItem) {
            return prevItems.map(item =>
              item.product._id === product._id && item.size === size && item.color === color
                ? { ...item, quantity: item.quantity + quantity, price: product.price * (item.quantity + quantity) }
                : item
            );
          }

          const uniqueId = `${product._id}-${size || 'no-size'}-${color || 'no-color'}-${Date.now()}`;
          return [
            ...prevItems,
            {
              _id: uniqueId,
              product,
              quantity,
              size,
              color,
              price: product.price * quantity,
            },
          ];
        });
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        await cartService.updateCartItem(itemId, quantity);
        const cart = await cartService.getCart();
        setItems(normalizeCart(cart));
      } else {
        setItems(prevItems =>
          prevItems.map(item =>
            item._id === itemId ? { ...item, quantity, price: item.product.price * quantity } : item
          )
        );
      }
    } catch (error: any) {
      // Silent fail - error handled by UI state
      
      // Handle 401 errors gracefully
      if (error?.response?.status === 401) {
        // Authentication failed during cart update
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      if (isAuthenticated) {
        setLoading(true);        
        await cartService.removeFromCart(itemId);

        
        const cart = await cartService.getCart();

        
        const normalizedCart = normalizeCart(cart);

        
        setItems(normalizedCart);

      } else {
        setItems(prevItems => prevItems.filter(item => item._id !== itemId));
      }
    } catch (error: any) {

      
      // Handle different error scenarios gracefully
      if (error?.response?.status === 404) {
        // Item not found - refresh cart state to sync with server

        try {
          const cart = await cartService.getCart();
          const normalizedCart = normalizeCart(cart);
          setItems(normalizedCart);
  
        } catch (refreshError) {
          
        }
        // Don't throw the error - handle gracefully
        return;
      } else if (error?.response?.status === 401) {
        // Authentication failed during cart item removal

      } else {
        // For other errors, still throw to let UI handle them
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        await cartService.clearCart();
        setItems([]);
        // Also clear localStorage and sessionStorage to prevent cart restoration
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cartBackup');
      } else {
        setItems([]);
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cartBackup');
      }
    } catch (error: any) {
      // Silent fail - error handled by UI state
      
      // Handle 401 errors gracefully
      if (error?.response?.status === 401) {
        // Authentication failed during cart clear
        // Still clear local cart
        setItems([]);
        localStorage.removeItem('cart');
        sessionStorage.removeItem('cartBackup');
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        setLoading(true);
        const cart = await cartService.getCart();
        setItems(normalizeCart(cart));
      } catch (error: any) {
        // Silent fail - error handled by UI state
        
        // Handle 401 errors gracefully
        if (error?.response?.status === 401) {
          // Authentication failed during cart refresh
        }
      } finally {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Merge cart when user logs in
  const mergeCartOnLogin = useCallback(async () => {
    try {
      setLoading(true);
      const mergedCart = await cartService.mergeWithServerCart();
      setItems(normalizeCart(mergedCart));
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setLoading(false);
    }
  }, []);

  const value: CartContextType = {
    items,
    itemCount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,
    mergeCartOnLogin,
    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
