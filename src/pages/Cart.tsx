import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Loader } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import cartService from '../services/cartService';
import { CartItem } from '../types';
import { useAuth } from '../hooks/useAuth';

const Cart: React.FC = () => {
  const { items: localItems, updateQuantity, removeItem, total, itemCount, clearCart } = useCart();
  const [items, setItems] = useState<CartItem[]>(localItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Update local state when useCart items change
    setItems(localItems);
  }, [localItems]);

  useEffect(() => {
    const fetchCart = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const cartData = await cartService.getCart();
        
        // If we have a server cart, use it instead of local cart
        if (cartData && cartData.items && cartData.items.length > 0) {
          // Clear local cart and use server cart
          clearCart();
          setItems(cartData.items);
        } else if (localItems.length > 0) {
          // If we have local items but no server items, sync to server
          await cartService.syncCart(localItems);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching cart:', err);
        setError('Failed to load cart data');
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, user]);
  
  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
    
    if (isAuthenticated) {
      try {
        await cartService.updateCartItem(productId, quantity);
      } catch (err) {
        console.error('Error updating cart item:', err);
        setError('Failed to update item quantity');
      }
    }
  };
  
  const handleRemoveItem = async (productId: string) => {
    removeItem(productId);
    
    if (isAuthenticated) {
      try {
        await cartService.removeFromCart(productId);
      } catch (err) {
        console.error('Error removing cart item:', err);
        setError('Failed to remove item from cart');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading your cart</h2>
          <p className="text-gray-600 mb-8">Please wait while we fetch your cart items...</p>
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
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-slide-up">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Cart Items</h2>
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-1">{item.product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{item.product.category}</p>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                              className="p-2 hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 border-x border-gray-300 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.product._id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.product._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-950">${(item.product.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${item.product.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-scale-in sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${(total * 0.08).toFixed(2)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary-950">${(total * 1.08).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-primary-950 text-white py-3 rounded-lg hover:bg-primary-800 transition-all duration-300 font-medium hover:shadow-lg transform hover:scale-105 mb-4">
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-primary-600 hover:text-primary-800 transition-colors"
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
};

export default Cart;