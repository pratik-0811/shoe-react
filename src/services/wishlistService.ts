import api from './api';
import { Product } from '../types';

export interface WishlistItem {
  _id?: string;
  product: Product;
  addedAt?: string;
}

export interface Wishlist {
  _id?: string;
  user?: string;
  items: WishlistItem[];
  createdAt?: string;
  updatedAt?: string;
}

class WishlistService {
  async getWishlist(): Promise<Wishlist> {
    const res = await api.get<Wishlist>('/wishlist');
    return res.data; // ✅ FIX
  }

  async addToWishlist(productId: string): Promise<Wishlist> {
    const res = await api.post<Wishlist>('/wishlist/items', { productId });
    return res.data; // ✅ FIX
  }

  async removeFromWishlist(productId: string): Promise<Wishlist> {
    const res = await api.delete<Wishlist>(`/wishlist/items/${productId}`);
    return res.data; // ✅ FIX
  }

  async clearWishlist(): Promise<{ message: string }> {
    const res = await api.delete<{ message: string }>('/wishlist');
    return res.data; // ✅ FIX
  }

  // For guest users (wishlist stored in localStorage)
  getLocalWishlist(): Product[] {
    const wishlistStr = localStorage.getItem('wishlist');
    if (!wishlistStr || wishlistStr === 'undefined' || wishlistStr === 'null') {
      return [];
    }
    try {
      return JSON.parse(wishlistStr);
    } catch (error) {
      return [];
    }
  }

  saveLocalWishlist(items: Product[]): void {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }

  addToLocalWishlist(product: Product): Product[] {
    const wishlist = this.getLocalWishlist();
    const exists = wishlist.find(item => item._id === product._id);

    if (!exists) {
      wishlist.push(product);
      this.saveLocalWishlist(wishlist);
    }

    return wishlist;
  }

  removeFromLocalWishlist(productId: string): Product[] {
    const wishlist = this.getLocalWishlist();
    const updatedWishlist = wishlist.filter(item => item._id !== productId);
    this.saveLocalWishlist(updatedWishlist);
    return updatedWishlist;
  }

  clearLocalWishlist(): Product[] {
    localStorage.removeItem('wishlist');
    return [];
  }

  async mergeWithServerWishlist(): Promise<Wishlist> {
    const localWishlist = this.getLocalWishlist();

    if (localWishlist.length > 0) {
      // Add local items to server wishlist
      for (const product of localWishlist) {
        try {
          await this.addToWishlist(product._id!);
        } catch (error) {
          // Continue with next item if one fails
        }
      }

      // Clear local wishlist after successful merge
      this.clearLocalWishlist();
    }

    return this.getWishlist();
  }

  async getWishlistCount(): Promise<number> {
    try {
      const wishlist = await this.getWishlist();
      return wishlist.items?.length || 0;
    } catch (error) {
      // Fallback to local wishlist count for guest users
      return this.getLocalWishlist().length;
    }
  }
}

export default new WishlistService();
