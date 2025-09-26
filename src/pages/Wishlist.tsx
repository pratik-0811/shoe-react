import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Loader } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../hooks/useAuth';
import wishlistService from '../services/wishlistService';
import ProductCard from '../components/ProductCard';

const Wishlist: React.FC = () => {
  const { items } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        // For guest users, just use local items from the hook
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const wishlistData = await wishlistService.getWishlist();
        
        // If we have a server wishlist, the hook will handle updating the items
        if (wishlistData && wishlistData.items && wishlistData.items.length > 0) {
          // The useWishlist hook will handle the state update
        } else if (items.length > 0) {
          // If we have local items but no server items, sync to server
          await wishlistService.mergeWithServerWishlist();
        }
        setLoading(false);
      } catch (err) {
        // Silent fail - error handled by UI state
        setError('Failed to load wishlist data');
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, items]);
  


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