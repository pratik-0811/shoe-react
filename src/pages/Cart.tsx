import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader
} from 'lucide-react';
import { useCart } from '../hooks/useCart';
import cartService from '../services/cartService';
import { CartItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import OptimizedImage from '../components/OptimizedImage';
import Recommendations from '../components/Recommendations';

const Cart = React.memo(() => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    total,
    itemCount,
    loading,
    refreshCart
  } = useCart();
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const loadCart = async () => {
      try {
        setError(null);
        await refreshCart();
      } catch (err) {
        // Silent fail - error handled by UI state
        setError('Failed to load cart. Please try again.');
      }
    };

    if (isAuthenticated && user?.id) {
      loadCart();
    }
  }, [isAuthenticated, user?.id, refreshCart]);

  // Debug effect removed for production

  const handleUpdateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
      } else {
        try {
          await updateQuantity(itemId, quantity);
        } catch (err) {
          // Silent fail - error handled by UI state
          setError('Could not update item quantity.');
        }
      }
    },
    [updateQuantity, removeItem]
  );

  const handleRemoveItem = useCallback(
    async (itemId: string) => {
      try {
        await removeItem(itemId);
      } catch (err) {
        // Silent fail - error handled by UI state
        setError('Could not remove item.');
      }
    },
    [removeItem]
  );

  const finalTotal = useMemo(() => total, [total]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Loading your cart
          </h2>
          <p className="text-gray-600 mb-8">
            Please wait while we fetch your cart items...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trash2 className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h2>
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
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items to your cart yet.
          </p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Shopping Cart
          </h1>
          <p className="text-gray-600 text-lg">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
              <div className="p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-8">
                  Cart Items
                </h2>
                <div className="space-y-8">
                  {items.map((item, index) => (
                    <div
                      key={item._id}
                      className="flex items-center space-x-6 p-6 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 animate-fade-in bg-gray-50/30"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <OptimizedImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg shadow-sm"
                        width={96}
                        height={96}
                        loading="lazy"
                      />
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {typeof item.product.category === 'object'
                            ? item.product.category.name
                            : item.product.category}
                        </p>
                        <div className="flex flex-wrap gap-3 mb-3">
                          {item.size && (
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-6 mt-4">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="p-3 hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-6 py-3 border-x border-gray-300 font-medium min-w-[60px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item._id, item.quantity + 1)
                              }
                              className="p-3 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors shadow-sm border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-xl font-bold text-primary-950">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{item.product.price} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          {/* Recommendations */}
          <div className="mt-12">
            <Recommendations
              onSizeSelect={(size) => {
                // Size selection handled silently
              }}
              onColorSelect={(color) => {
                // Color selection handled silently
              }}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 animate-scale-in sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-8">
                Order Summary
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 text-base">Subtotal</span>
                  <span className="font-medium text-base">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 text-base">Shipping</span>
                  <span className="font-medium text-green-600 text-base">Free</span>
                </div>
                <div className="border-t pt-6 mt-4">
                  <div className="flex justify-between py-2">
                    <span className="text-xl font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary-950">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-primary-950 text-white py-4 rounded-lg hover:bg-primary-800 transition-all duration-300 font-medium hover:shadow-lg transform hover:scale-105 mb-6 text-base"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-primary-600 hover:text-primary-800 transition-colors mb-6 text-base font-medium"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Secure Checkout</p>
                  <div className="flex justify-center space-x-4">
                    <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">VISA</span>
                    </div>
                    <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">MC</span>
                    </div>
                    <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs font-bold">PP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Cart;
