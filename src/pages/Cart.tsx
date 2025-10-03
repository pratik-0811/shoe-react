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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6 animate-fade-in">
          <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-orange-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">
              <span className="bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                Shopping Cart
              </span>
            </h1>
            <p className="text-center text-white/90 text-sm font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
            </p>
            <div className="mt-3 h-0.5 bg-gradient-to-r from-white/30 via-white/60 to-white/30 rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-primary-100 overflow-hidden animate-slide-up hover:shadow-xl transition-all duration-300">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Cart Items
                  </h2>
                </div>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item._id}
                      className="flex items-center space-x-3 p-3 border border-primary-100 rounded-lg hover:shadow-md hover:border-primary-200 transition-all duration-300 animate-fade-in bg-gradient-to-r from-white to-primary-50/30"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <OptimizedImage
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                        width={64}
                        height={64}
                        loading="lazy"
                      />
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-gray-800 text-base mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1">
                          {typeof item.product.category === 'object'
                            ? item.product.category.name
                            : item.product.category}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.size && (
                            <span className="text-xs text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full font-medium">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full font-medium">
                              Color: {item.color}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center border border-primary-200 rounded-md bg-white shadow-sm hover:shadow-md transition-all duration-200">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item._id,
                                  Math.max(1, item.quantity - 1)
                                )
                              }
                              className="p-1.5 hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 py-1.5 border-x border-primary-200 font-semibold min-w-[40px] text-center text-primary-700 text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(item._id, item.quantity + 1)
                              }
                              className="p-1.5 hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 shadow-sm border border-red-200 hover:border-red-300 hover:shadow-md"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-base font-bold text-primary-950">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">
                          ₹{item.product.price} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          {/* Recommendations */}
        <div className="mt-6">
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
            <div className="bg-white rounded-xl shadow-lg border border-primary-100 p-4 animate-scale-in sticky top-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-gray-700 text-sm font-medium">Subtotal</span>
                  <span className="font-semibold text-sm text-primary-700">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary-100">
                  <span className="text-gray-700 text-sm font-medium">Shipping</span>
                  <span className="font-semibold text-green-600 text-sm">Free</span>
                </div>
                <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg p-3 border border-primary-200">
                  <div className="flex justify-between py-1">
                    <span className="text-lg font-bold text-primary-800">Total</span>
                    <span className="text-lg font-bold text-primary-900">
                      ₹{finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-gradient-to-r from-primary-600 via-primary-700 to-orange-600 text-white py-3 rounded-lg hover:from-primary-700 hover:via-primary-800 hover:to-orange-700 transition-all duration-300 font-semibold hover:shadow-lg transform hover:scale-105 mb-3 text-sm shadow-md border border-primary-500 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Proceed to Checkout
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>

              <Link
                to="/products"
                className="block text-center text-primary-600 hover:text-primary-800 transition-all duration-200 mb-3 text-sm font-semibold hover:bg-primary-50 py-1.5 px-3 rounded-lg"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Continue Shopping
                </span>
              </Link>

              {/* Trust Badges */}
              <div className="mt-3 p-3 bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg border border-primary-100">
                <div className="text-center">
                  <p className="text-xs text-primary-700 mb-2 font-semibold flex items-center justify-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure Checkout
                  </p>
                  <div className="flex justify-center space-x-2">
                    <div className="w-8 h-5 bg-gradient-to-r from-primary-100 to-primary-200 rounded border border-primary-300 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-primary-700">VISA</span>
                    </div>
                    <div className="w-8 h-5 bg-gradient-to-r from-primary-100 to-primary-200 rounded border border-primary-300 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-primary-700">MC</span>
                    </div>
                    <div className="w-8 h-5 bg-gradient-to-r from-primary-100 to-primary-200 rounded border border-primary-300 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-primary-700">PP</span>
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
