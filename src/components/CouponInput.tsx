import React, { useState, useEffect } from 'react';
import { Tag, X, Check, AlertCircle, Gift, Percent } from 'lucide-react';
import { Coupon, AppliedCoupon } from '../types';
import couponService from '../services/couponService';
import Toast from './Toast';

interface CouponInputProps {
  orderTotal: number;
  appliedCoupons: AppliedCoupon[];
  onCouponApply: (appliedCoupon: AppliedCoupon) => void;
  onCouponRemove: (couponId: string) => void;
  orderItems?: any[];
  className?: string;
}

const CouponInput: React.FC<CouponInputProps> = ({
  orderTotal,
  appliedCoupons,
  onCouponApply,
  onCouponRemove,
  orderItems = [],
  className = ''
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  const fetchAvailableCoupons = async () => {
    try {
      const coupons = await couponService.getActiveCoupons();
      // Ensure coupons is always an array
      const couponsArray = Array.isArray(coupons) ? coupons : [];
      // Filter out already applied coupons
      const appliedCouponIds = appliedCoupons.map(ac => ac.coupon._id);
      const filteredCoupons = couponsArray.filter(coupon => 
        !appliedCouponIds.includes(coupon._id) &&
        !couponService.isCouponExpired(coupon) &&
        !couponService.isUsageLimitReached(coupon)
      );
      setAvailableCoupons(filteredCoupons);
    } catch (error: any) {
      setAvailableCoupons([]); // Set empty array on error
    }
  };

  const handleApplyCoupon = async (code: string) => {
    // Clear previous validation error
    setValidationError('');
    
    if (!code.trim()) {
      setValidationError('Please enter a coupon code');
      setToast({ message: 'Please enter a coupon code', type: 'error' });
      return;
    }

    // Check if order total is valid
    if (!orderTotal || orderTotal <= 0) {
      setValidationError('Add items to your cart before applying coupons');
      setToast({ message: 'Add items to your cart before applying coupons', type: 'error' });
      return;
    }

    // Check if coupon is already applied
    if (appliedCoupons.some(ac => ac.coupon.code.toLowerCase() === code.toLowerCase())) {
      setValidationError('This coupon is already applied');
      setToast({ message: 'This coupon is already applied', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const validation = await couponService.validateCoupon(code, orderTotal, orderItems);
      
      if (validation.isValid && validation.coupon && validation.discountAmount !== undefined) {
        const appliedCoupon: AppliedCoupon = {
          coupon: validation.coupon,
          discountAmount: validation.discountAmount
        };
        
        onCouponApply(appliedCoupon);
        // Keep the coupon code in the input field after successful application
        // setCouponCode(''); // Commented out to keep coupon code visible
        setValidationError(''); // Clear validation error on success
        setToast({ message: 'Coupon applied successfully!', type: 'success' });
        
        // Refresh available coupons
        fetchAvailableCoupons();
      } else {
        const errorMsg = validation.message || 'Invalid coupon code';
        setValidationError(errorMsg);
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || error?.message || 'Failed to apply coupon';
      let errorMsg = '';
      
      if (status === 401) {
        errorMsg = 'Please log in to apply coupons';
      } else if (status === 404) {
        errorMsg = 'Invalid coupon code';
      } else if (status === 400) {
        errorMsg = msg;
      } else if (status === 429) {
        errorMsg = 'Too many attempts. Please try again later.';
      } else if (!status) {
        errorMsg = 'Network error. Please check your connection.';
      } else {
        errorMsg = msg;
      }
      
      setValidationError(errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = (couponId: string) => {
    onCouponRemove(couponId);
    setToast({ message: 'Coupon removed', type: 'success' });
    fetchAvailableCoupons();
  };

  const handleQuickApply = (coupon: Coupon) => {
    setCouponCode(coupon.code); // Set the coupon code in the input field
    handleApplyCoupon(coupon.code);
    setShowAvailableCoupons(false);
  };

  const getTotalDiscount = () => {
    return appliedCoupons.reduce((total, ac) => total + ac.discountAmount, 0);
  };

  const getCouponIcon = (type: string) => {
    return type === 'percentage' ? <Percent className="w-4 h-4" /> : <Tag className="w-4 h-4" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Coupon Input */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Apply Coupon</h3>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  // Clear validation error when user starts typing
                  if (validationError) setValidationError('');
                }}
                placeholder={orderTotal <= 0 ? "Add items to cart first" : "Enter coupon code"}
                disabled={orderTotal <= 0}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  validationError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } ${
                   orderTotal <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                 }`}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon(couponCode)}
              />
          </div>
          <button
             onClick={() => {
               const appliedCoupon = appliedCoupons.find(ac => ac.coupon.code.toLowerCase() === couponCode.toLowerCase());
               if (appliedCoupon) {
                 onCouponRemove(appliedCoupon.coupon._id);
                 setCouponCode('');
                 setToast({ message: 'Coupon removed successfully!', type: 'success' });
               } else {
                 handleApplyCoupon(couponCode);
               }
             }}
             disabled={loading || !couponCode.trim() || orderTotal <= 0}
             className={`px-4 py-2 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 ${
               appliedCoupons.find(ac => ac.coupon.code.toLowerCase() === couponCode.toLowerCase())
                 ? 'bg-red-600 hover:bg-red-700'
                 : 'bg-blue-600 hover:bg-blue-700'
             }`}
           >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : appliedCoupons.find(ac => ac.coupon.code.toLowerCase() === couponCode.toLowerCase()) ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {appliedCoupons.find(ac => ac.coupon.code.toLowerCase() === couponCode.toLowerCase()) ? 'Remove' : 'Apply'}
          </button>
        </div>
        
        {/* Validation Error Message */}
        {validationError && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        
        {/* Available Coupons Toggle */}
        {availableCoupons.length > 0 && (
          <button
            onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
            className="text-blue-600 hover:text-blue-700 text-sm mt-2 flex items-center gap-1"
          >
            <Gift className="w-4 h-4" />
            {showAvailableCoupons ? 'Hide' : 'View'} available coupons ({availableCoupons.length})
          </button>
        )}
      </div>

      {/* Available Coupons */}
      {showAvailableCoupons && availableCoupons.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Available Coupons</h4>
          <div className="space-y-2">
            {availableCoupons.map((coupon) => {
              const discount = couponService.calculateDiscount(coupon, orderTotal);
              const isEligible = !coupon.minPurchaseAmount || orderTotal >= coupon.minPurchaseAmount;
              
              return (
                <div
                  key={coupon._id}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    isEligible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isEligible ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getCouponIcon(coupon.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">{coupon.code}</span>
                        <span className={`text-sm ${
                          isEligible ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {couponService.formatCouponForDisplay(coupon)}
                        </span>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-600 mt-1">{coupon.description}</p>
                      )}
                      {coupon.minPurchaseAmount && (
                        <p className="text-xs text-gray-500 mt-1">
                          Min. purchase: ₹{coupon.minPurchaseAmount}
                        </p>
                      )}
                      {isEligible && discount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          You save: ₹{discount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      const appliedCoupon = appliedCoupons.find(ac => ac.coupon._id === coupon._id);
                      if (appliedCoupon) {
                        onCouponRemove(coupon._id);
                        setToast({ message: 'Coupon removed successfully!', type: 'success' });
                      } else {
                        handleQuickApply(coupon);
                      }
                    }}
                    disabled={(!isEligible && !appliedCoupons.find(ac => ac.coupon._id === coupon._id)) || loading}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      appliedCoupons.find(ac => ac.coupon._id === coupon._id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : isEligible
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {appliedCoupons.find(ac => ac.coupon._id === coupon._id) ? 'Remove' : 'Apply'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Applied Coupons */}
      {appliedCoupons.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            Applied Coupons ({appliedCoupons.length})
          </h4>
          
          <div className="space-y-2">
            {appliedCoupons.map((appliedCoupon) => (
              <div
                key={appliedCoupon.coupon._id}
                className="flex items-center justify-between p-3 bg-white rounded-md border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    {getCouponIcon(appliedCoupon.coupon.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">
                        {appliedCoupon.coupon.code}
                      </span>
                      <span className="text-sm text-green-600">
                        {couponService.formatCouponForDisplay(appliedCoupon.coupon)}
                      </span>
                    </div>
                    {appliedCoupon.coupon.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {appliedCoupon.coupon.description}
                      </p>
                    )}
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Discount: -₹{appliedCoupon.discountAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveCoupon(appliedCoupon.coupon._id)}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Total Discount Summary */}
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Discount:</span>
              <span className="font-bold text-green-600 text-lg">
                -₹{getTotalDiscount().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Guidelines */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Coupon Guidelines:</p>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Multiple coupons can be applied to a single order</li>
              <li>• Coupons are applied in the order they are added</li>
              <li>• Some coupons may have minimum purchase requirements</li>
              <li>• Expired or used coupons cannot be applied</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponInput;