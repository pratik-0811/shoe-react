import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft, Loader } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import wishlistService from '../services/wishlistService';
import cartService from '../services/cartService';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const Wishlist: React.FC = () => {
  const { items: localItems, removeItem: removeLocalItem, toggleItem } = useWishlist();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<Product[]>(localItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Update local state when useWishlist items change
    setItems(localItems);
  }, [localItems]);
  
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const wishlistData = await wishlistService.getWishlist();
        
        // If we have a server wishlist, use it
        if (wishlistData && wishlistData.items && wishlistData.items.length > 0) {
          setItems(wishlistData.items);
        } else if (localItems.length > 0) {
          // If we have local items but no server items, sync to server
          await wishlistService.mergeWithServerWishlist();
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError('Failed to load wishlist data');
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, user]);
  
  const removeItem = async (productId: string) => {
    removeLocalItem(productId);
    
    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
      } catch (err) {
        console.error('Error removing wishlist item:', err);
        setError('Failed to remove item from wishlist');
      }
    }
  };

  const handleAddToCart = async (product: Product) => {
    addItem(product);
    
    if (isAuthenticated) {
      try {
        await cartService.addToCart(product._id);
      } catch (err) {
        console.error('Error adding item to cart:', err);
        // We don't set error state here to avoid disrupting the UI flow
        // Just log the error and let the local cart update proceed
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading your wishlist</h2>
          <p className="text-gray-600 mb-8">Please wait while we fetch your wishlist items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8">Save items you love to your wishlist and shop them later.</p>
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Wishlist</h1>
          <p className="text-gray-600">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center animate-fade-in">
          <Link
            to="/products"
            className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;