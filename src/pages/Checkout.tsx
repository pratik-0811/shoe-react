import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { initializeRazorpayPayment, createRazorpayOrder, createOrder, PaymentData, createCODOrder, CODOrderData } from '../services/paymentService';
import { ShippingAddress, Address, AppliedCoupon } from '../types';
import addressService from '../services/addressService';
import couponService from '../services/couponService';
import Loading from '../components/Loading';
import Toast from '../components/Toast';
import AddressManagement from '../components/AddressManagement';
import CouponInput from '../components/CouponInput';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  
  const [loading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [showAddressManagement, setShowAddressManagement] = useState(false);
  const [addressSelectionType, setAddressSelectionType] = useState<'shipping' | 'billing'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  
  // Calculate totals
  const subtotal = items?.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) || 0;
  const shipping = subtotal > 1000 ? 0 : 50; // Free shipping above ₹1000
  const tax = subtotal * 0.18; // 18% GST
  const totalDiscount = appliedCoupons.reduce((sum, ac) => sum + ac.discountAmount, 0);
  const total = Math.max(0, subtotal + shipping + tax - totalDiscount);
  
  // Derived validation booleans for enabling the Place Order button
  const isCustomerInfoComplete = Boolean(
    customerInfo.name?.trim() && customerInfo.email?.trim() && customerInfo.phone?.trim()
  );
  const hasShippingAddress = Boolean(selectedShippingAddress);
  const hasBillingAddress = sameAsShipping ? true : Boolean(selectedBillingAddress);
  const canPlaceOrder = Boolean(
    user && items?.length && isCustomerInfoComplete && hasShippingAddress && hasBillingAddress && !processingPayment
  );
  useEffect(() => {
    if (!items?.length && !processingPayment) {
      navigate('/cart');
    }
  }, [items, navigate, processingPayment]);
  
  useEffect(() => {
    if (sameAsShipping && selectedShippingAddress) {
      setSelectedBillingAddress(selectedShippingAddress);
    }
  }, [sameAsShipping, selectedShippingAddress]);
  
  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };
  
  const handleCouponApply = (appliedCoupon: AppliedCoupon) => {
    setAppliedCoupons(prev => [...prev, appliedCoupon]);
  };

  const handleCouponRemove = (couponId: string) => {
    setAppliedCoupons(prev => prev.filter(ac => ac.coupon._id !== couponId));
  };

  const handleAddressSelect = (address: Address) => {
    if (addressSelectionType === 'shipping') {
      setSelectedShippingAddress(address);
      if (sameAsShipping) {
        setSelectedBillingAddress(address);
      }
    } else {
      setSelectedBillingAddress(address);
    }
    setShowAddressManagement(false);
  };
  
  const validateForm = () => {
    if (!user) {
      setToast({ message: 'Please log in to place an order', type: 'error' });
      return false;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setToast({ message: 'Please fill in all customer information', type: 'error' });
      return false;
    }
    
    if (!selectedShippingAddress) {
      setToast({ message: 'Please select a shipping address', type: 'error' });
      return false;
    }
    
    if (!sameAsShipping && !selectedBillingAddress) {
      setToast({ message: 'Please select a billing address', type: 'error' });
      return false;
    }
    
    return true;
  };
  
  const handlePlaceOrder = async () => {
    if (processingPayment) return; // Prevent duplicate submissions
    if (!validateForm()) return;
    
    // Additional check for user authentication
    if (!user) {
      setToast({ message: 'Please log in to place an order', type: 'error' });
      navigate('/login');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Validate shipping address
      const zipOrPostal = (selectedShippingAddress as any)?.zipCode || (selectedShippingAddress as any)?.postalCode || '';
      const trimmedZipCode = zipOrPostal.trim();
      
      if (!trimmedZipCode || trimmedZipCode.length < 3 || trimmedZipCode.length > 20) {
        setToast({ 
          message: 'Please ensure your shipping address has a valid postal code (3-20 characters)', 
          type: 'error' 
        });
        setProcessingPayment(false);
        return;
      }

      if (paymentMethod === 'cod') {
        // Handle Cash on Delivery
        const codOrderData: CODOrderData = {
          items: items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
            name: item.product.name,
            image: item.product.images[0],
            size: item.size,
            color: item.color
          })),
          shippingAddress: {
            fullName: selectedShippingAddress.fullName || customerInfo.name,
            street: selectedShippingAddress.addressLine1 || selectedShippingAddress.street || '',
            city: selectedShippingAddress.city,
            state: selectedShippingAddress.state,
            zipCode: trimmedZipCode,
            country: selectedShippingAddress.country,
            phone: customerInfo.phone
          },
          notes: 'Cash on Delivery order',
          appliedCoupons: appliedCoupons
        };
        
        const result = await createCODOrder(codOrderData);
        
        if (result.success && result.order) {
          const orderId = result.order._id;
          
          // Cart is already cleared by the backend after successful order creation
          // No need to clear it again from frontend
          
          // Redirect to thank you page
          navigate(`/thank-you/${orderId}`);
          
          setToast({ message: 'COD order placed successfully!', type: 'success' });
        } else {
          
          // Handle specific error cases
          if (result.error?.includes('No token provided') || result.error?.includes('Access denied')) {
            setToast({ message: 'Please log in to place a COD order', type: 'error' });
            navigate('/login');
            return;
          }
          
          throw new Error(result.error || 'Failed to create COD order');
        }
      } else {
        // Handle Razorpay payment
        const razorpayOrder = await createRazorpayOrder(total);
        
        // Prepare payment data
        const paymentData: PaymentData = {
          amount: total,
          currency: 'INR',
          orderId: razorpayOrder.orderId,
          customerInfo,
          shippingAddress: {
            street: selectedShippingAddress.addressLine1 || selectedShippingAddress.street || '',
            city: selectedShippingAddress.city,
            state: selectedShippingAddress.state,
            zipCode: trimmedZipCode,
            country: selectedShippingAddress.country
          },
          appliedCoupons: appliedCoupons,
          items: items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
            name: item.product.name,
            image: item.product.images[0],
            size: item.size,
            color: item.color
          }))
        };
        
        // Initialize Razorpay payment
        const paymentResult = await initializeRazorpayPayment(paymentData);
        
        if (paymentResult.success) {
          // Payment verification already created the order, redirect to thank you page
          const orderId = paymentResult.orderId;
          
          // Cart is already cleared by the backend after successful payment verification
          // Redirect to thank you page
          navigate(`/thank-you/${orderId}`);
          
          setToast({ message: 'Order placed successfully!', type: 'success' });
        } else {
          // Handle payment failure with better user feedback
          const errorMessage = paymentResult.error || 'Payment failed';
          
          // Show user-friendly error message
          if (errorMessage.includes('cancelled')) {
            setToast({ 
              message: 'Payment was cancelled. Your cart items are still saved. You can try again when ready.', 
              type: 'error' 
            });
          } else if (errorMessage.includes('verification failed')) {
            setToast({ 
              message: 'Payment verification failed. If money was deducted, it will be refunded within 5-7 business days.', 
              type: 'error' 
            });
          } else {
            setToast({ 
              message: `Payment failed: ${errorMessage}. Please try again or contact support.`, 
              type: 'error' 
            });
          }
          
          // Only redirect to payment failed page for serious errors, not cancellations
          if (!errorMessage.includes('cancelled')) {
            const encodedError = encodeURIComponent(errorMessage);
            navigate(`/payment-failed?error=${encodedError}`);
          }
        }
      }
    } catch (error: unknown) {

      setToast({ message: error instanceof Error ? error.message : 'Failed to place order', type: 'error' });
    } finally {
      setProcessingPayment(false);
    }
  };
  
  if (cartLoading || loading) {
    return <Loading />;
  }
  
  if (!items?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <button
            onClick={() => navigate('/products')}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">Secure Checkout</h1>
          <p className="text-primary-700 text-lg font-medium">Complete your order with confidence</p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full mx-auto mt-3"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium text-primary-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-primary-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-primary-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-primary-300"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                </div>
                <button
                  onClick={() => { setAddressSelectionType('shipping'); setShowAddressManagement(true); }}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Manage Addresses
                </button>
              </div>
              
              {selectedShippingAddress ? (
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedShippingAddress.fullName || selectedShippingAddress.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedShippingAddress.addressLine1 || selectedShippingAddress.street}, {selectedShippingAddress.city}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedShippingAddress.state} {(selectedShippingAddress.postalCode || selectedShippingAddress.postalCode)}, {selectedShippingAddress.country}
                      </p>
                      {selectedShippingAddress.phone && (
                        <p className="text-sm text-gray-600">Phone: {selectedShippingAddress.phone}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAddressManagement(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
                  <p className="text-gray-500 mb-2">No shipping address selected</p>
                  <button
                    onClick={() => { setAddressSelectionType('shipping'); setShowAddressManagement(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Select Address
                  </button>
                </div>
              )}
            </div>
            
            {/* Billing Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
              <div className="mb-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <span className="text-base font-medium text-gray-700">Same as shipping address</span>
                </label>
              </div>
              
              {!sameAsShipping && (
                <div>
                  {selectedBillingAddress ? (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{selectedBillingAddress.fullName || selectedBillingAddress.name}</p>
                          <p className="text-base text-gray-600">
                            {selectedBillingAddress.addressLine1 || selectedBillingAddress.street}, {selectedBillingAddress.city}
                          </p>
                          <p className="text-base text-gray-600">
                            {selectedBillingAddress.state} {(selectedBillingAddress.postalCode || selectedBillingAddress.postalCode)}, {selectedBillingAddress.country}
                          </p>
                          {selectedBillingAddress.phone && (
                            <p className="text-base text-gray-600">Phone: {selectedBillingAddress.phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setAddressSelectionType('billing'); setShowAddressManagement(true); }}
                          className="text-primary-600 hover:text-primary-700 text-base"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-md text-center">
                      <p className="text-gray-500 mb-2">No billing address selected</p>
                      <button
                        onClick={() => { setAddressSelectionType('billing'); setShowAddressManagement(true); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Select Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Coupon Section */}
            <CouponInput
              orderTotal={subtotal}
              appliedCoupons={appliedCoupons}
              onCouponApply={handleCouponApply}
              onCouponRemove={handleCouponRemove}
              orderItems={items}
            />
            
            {/* Payment Method */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
              </div>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'razorpay' 
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-orange-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-25'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4 w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Online Payment</div>
                      <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking, Wallets</div>
                    </div>
                  </div>
                  {paymentMethod === 'razorpay' && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
                
                <label className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'cod' 
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-orange-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-25'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-4 w-5 h-5 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Cash on Delivery</div>
                      <div className="text-sm text-gray-600">Pay when your order is delivered</div>
                    </div>
                  </div>
                  {paymentMethod === 'cod' && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-primary-100 h-fit sticky top-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
            </div>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.product._id}-${item.size}-${item.color}`} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg border border-primary-100 hover:shadow-md transition-all duration-200">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {item.size && <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">Size: {item.size}</span>}
                      {item.color && <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">Color: {item.color}</span>}
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 text-lg">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Totals */}
            <div className="border-t border-primary-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="text-gray-900 font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Shipping</span>
                <span className="text-green-600 font-semibold">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Tax (GST 18%)</span>
                <span className="text-gray-900 font-semibold">₹{tax.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Discount</span>
                  <span className="text-green-600 font-bold">-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-3 bg-gradient-to-r from-primary-50 to-orange-50 -mx-3 px-3 py-3 rounded-lg">
                <span className="text-primary-800">Total Amount</span>
                <span className="text-primary-600 text-xl">₹{total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Helper: requirements to place order */}
            {!canPlaceOrder && (
              <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium">Before placing your order, please:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {!user && <li>Log in to continue</li>}
                  {!isCustomerInfoComplete && <li>Complete customer information (name, email, phone)</li>}
                  {!hasShippingAddress && <li>Select a shipping address (use "Manage Addresses")</li>}
                  {!hasBillingAddress && !sameAsShipping && <li>Select a billing address</li>}
                </ul>
              </div>
            )}
            
            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={!canPlaceOrder || processingPayment}
              aria-disabled={!canPlaceOrder || processingPayment}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                (!canPlaceOrder || processingPayment)
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {processingPayment ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {paymentMethod === 'cod' 
                        ? `Place COD Order - ₹${total.toFixed(2)}` 
                        : `Place Order - ₹${total.toFixed(2)}`
                      }
                    </span>
                  </>
                )}
              </div>
            </button>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-orange-50 rounded-lg border border-primary-100">
              <p className="text-xs text-primary-700 text-center font-medium">
                🔒 Secure checkout • By placing your order, you agree to our 
                <span className="text-primary-600 font-semibold">Terms of Service</span> and 
                <span className="text-primary-600 font-semibold">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {showAddressManagement && (
        <AddressManagement
          onAddressSelect={handleAddressSelect}
          onClose={() => setShowAddressManagement(false)}
          showSelection={true}
          selectedAddressId={addressSelectionType === 'shipping' ? selectedShippingAddress?._id : selectedBillingAddress?._id}
        />
      )}
      
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

export default React.memo(Checkout);