import api from './api';
import { Product } from '../types';

export interface Wishlist {
  _id?: string;
  user?: string;
  items: Product[];
  createdAt?: string;
  updatedAt?: string;
}

class WishlistService {
  async getWishlist(): Promise<Wishlist> {
    return api.get<Wishlist>('/wishlist');
  }

  async addToWishlist(productId: string): Promise<Wishlist> {
    return api.post<Wishlist>('/wishlist/items', { productId });
  }

  async removeFromWishlist(productId: string): Promise<Wishlist> {
    return api.delete<Wishlist>(`/wishlist/items/${productId}`);
  }

  async clearWishlist(): Promise<{ message: string }> {
    return api.delete<{ message: string }>('/wishlist');
  }

  // For guest users (wishlist stored in localStorage)
  getLocalWishlist(): Product[] {
    const wishlistStr = localStorage.getItem('wishlist');
    return wishlistStr ? JSON.parse(wishlistStr) : [];
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
          await this.addToWishlist(product._id);
        } catch (error) {
          console.error('Error merging wishlist item:', error);
        }
      }
      
      // Clear local wishlist after successful merge
      this.clearLocalWishlist();
    }
    
    return this.getWishlist();
  }
}

export default new WishlistService();