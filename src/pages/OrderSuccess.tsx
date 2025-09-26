import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderDetails } from '../services/paymentService';
import { Order } from '../types';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        navigate('/products');
        return;
      }
      
      try {
        const orderData = await getOrderDetails(orderId);
        setOrder(orderData);
      } catch (error: unknown) {
        // Silent fail - error handled by UI state
        setToast({ message: 'Failed to load order details', type: 'error' });
        setTimeout(() => navigate('/products'), 3000);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, navigate]);
  
  if (loading) {
    return <Loading />;
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="text-gray-600 mt-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Order #{order.orderNumber}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Order Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">Size: {item.size}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Shipping Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-gray-600">{order.shippingAddress.address}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p className="text-gray-600">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </div>

            {/* Note: Billing address functionality removed as it's not in the current backend model */}
            
            {/* Delivery Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Status:</span>
                  <span className="font-medium text-green-600 capitalize">{order.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span className="text-gray-900">
                    {order.estimatedDelivery ? 
                      new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 
                      '5-7 business days'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-gray-900 capitalize">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="text-gray-900 text-sm font-mono">{order.paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-medium text-green-600">Completed</span>
                </div>
              </div>
            </div>
            
            {/* Applied Coupons */}
            {order.appliedCoupons && order.appliedCoupons.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Applied Coupons</h2>
                <div className="space-y-3">
                  {order.appliedCoupons.map((coupon, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{coupon.code}</p>
                          <p className="text-sm text-gray-600">
                            {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">-₹{coupon.discountAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Total */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{order.subtotal.toFixed(2)}</span>
                </div>
                {order.totalDiscount && order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-₹{order.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">
                    {order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (GST 18%)</span>
                  <span className="text-gray-900">₹{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/products"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium text-center block"
              >
                Continue Shopping
              </Link>
              <Link
                to="/profile/orders"
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 font-medium text-center block"
              >
                View All Orders
              </Link>
            </div>
            
            {/* Help Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-700 mb-3">
                If you have any questions about your order, please contact our customer support.
              </p>
              <Link
                to="/contact"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Email Confirmation Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Order Confirmation Email</h3>
              <p className="text-sm text-yellow-700 mt-1">
                We've sent an order confirmation email to your registered email address. 
                Please check your inbox and spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default React.memo(OrderSuccess);