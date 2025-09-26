import { useCallback } from 'react';
import { useCart } from './useCart';
import { useWishlist } from '../contexts/WishlistContext';

/**
 * Custom hook to handle cart and wishlist merging when user logs in
 * This ensures guest items are properly merged with server data
 */
export const useCartWishlistMerge = () => {
  const { mergeCartOnLogin } = useCart();
  const { mergeWishlistOnLogin } = useWishlist();

  const mergeGuestDataOnLogin = useCallback(async () => {
    try {
      // Merge both cart and wishlist in parallel
      await Promise.all([
        mergeCartOnLogin(),
        mergeWishlistOnLogin()
      ]);
    } catch (error) {
      // Silent fail - don't throw error to prevent login failure
      // The merge can be retried later or handled gracefully
    }
  }, [mergeCartOnLogin, mergeWishlistOnLogin]);

  return {
    mergeGuestDataOnLogin
  };
};