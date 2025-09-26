import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { initializeRazorpayPayment, createRazorpayOrder, createOrder, PaymentData } from '../services/paymentService';
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
    
    setProcessingPayment(true);
    
    try {
      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(total);
      // Validate shipping address before payment
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
        appliedCoupons: appliedCoupons
      };
      
      // Initialize Razorpay payment
      const paymentResult = await initializeRazorpayPayment(paymentData);
      
      if (paymentResult.success) {
        // Payment verification already created the order, redirect to thank you page
        const orderId = paymentResult.orderId;
        
        // Redirect to thank you first to avoid race with cart-clearing effect
        navigate(`/thank-you/${orderId}`);
        
        // Clear cart after navigation
        await clearCart();
        
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
    } catch (error: unknown) {
      // Silent fail - error handled by UI state
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                <button
                  onClick={() => { setAddressSelectionType('shipping'); setShowAddressManagement(true); }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
              <div className="mb-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsShipping}
                    onChange={(e) => setSameAsShipping(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <span className="text-sm font-medium text-gray-700">Same as shipping address</span>
                </label>
              </div>
              
              {!sameAsShipping && (
                <div>
                  {selectedBillingAddress ? (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{selectedBillingAddress.fullName || selectedBillingAddress.name}</p>
                          <p className="text-sm text-gray-600">
                            {selectedBillingAddress.addressLine1 || selectedBillingAddress.street}, {selectedBillingAddress.city}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedBillingAddress.state} {(selectedBillingAddress.postalCode || selectedBillingAddress.postalCode)}, {selectedBillingAddress.country}
                          </p>
                          {selectedBillingAddress.phone && (
                            <p className="text-sm text-gray-600">Phone: {selectedBillingAddress.phone}</p>
                          )}
                        </div>
                        <button
                          onClick={() => { setAddressSelectionType('billing'); setShowAddressManagement(true); }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
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
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <img src="/assets/payment-secure.svg" alt="Secure Payment" className="h-6 mr-3" />
                    <div>
                      <div className="font-medium">Razorpay</div>
                      <div className="text-sm text-gray-500">Credit/Debit Card, UPI, Net Banking, Wallets</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={`${item.product._id}-${item.size}-${item.color}`} className="flex items-center space-x-4">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                    {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                    {item.color && <p className="text-sm text-gray-500">Color: {item.color}</p>}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Order Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (GST 18%)</span>
                <span className="text-gray-900">₹{tax.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">₹{total.toFixed(2)}</span>
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
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors
                ${(!canPlaceOrder || processingPayment)
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {processingPayment ? 'Processing...' : `Place Order - ₹${total.toFixed(2)}`}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </p>
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