import { api } from './api';

// Razorpay configuration
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_your_key_here';

// Payment interfaces
export interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  appliedCoupons?: Array<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  }>;
  items?: Array<{
    product: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
    size?: string;
    color?: string;
  }>;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  razorpayOrderId?: string;
  error?: string;
}

// Create Razorpay order
export const createRazorpayOrder = async (amount: number, currency: string = 'INR') => {
  try {
    const response = await api.post('/payments/create-order', {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
    });
    return response.data;
  } catch (error: unknown) {
    // Handle specific Razorpay configuration error
    if (error.response?.data?.error === 'RAZORPAY_NOT_CONFIGURED') {
      throw new Error('Payment service is not configured. Please contact the administrator.');
    }
    
    throw new Error(error.response?.data?.message || 'Failed to create payment order');
  }
};

// Initialize Razorpay payment
export const initializeRazorpayPayment = (paymentData: PaymentData): Promise<PaymentResult> => {
  return new Promise((resolve) => {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => processPayment(paymentData, resolve);
      script.onerror = () => {
        resolve({ 
          success: false, 
          error: 'Failed to load payment system. Please check your internet connection and try again.' 
        });
      };
      document.body.appendChild(script);
    } else {
      processPayment(paymentData, resolve);
    }
  });
};

// Process payment with Razorpay
const processPayment = (paymentData: PaymentData, resolve: (result: PaymentResult) => void) => {
  
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: Math.round(paymentData.amount * 100), // Convert to paise
    currency: paymentData.currency,
    name: 'Solewaale',
        description: 'Purchase from Solewaale',
    order_id: paymentData.orderId,
    prefill: {
      name: paymentData.customerInfo.name,
      email: paymentData.customerInfo.email,
      contact: paymentData.customerInfo.phone,
    },
    notes: {
      address: `${paymentData.shippingAddress.street}, ${paymentData.shippingAddress.city}, ${paymentData.shippingAddress.state} ${paymentData.shippingAddress.zipCode}`,
    },
    theme: {
      color: '#3B82F6',
    },
    handler: async (response: RazorpayResponse) => {
      try {
        // Verify payment on backend with shipping address, coupons, and cart items
        const verificationData = {
          ...response,
          shippingAddress: {
            street: paymentData.shippingAddress.street,
            city: paymentData.shippingAddress.city,
            state: paymentData.shippingAddress.state,
            zipCode: paymentData.shippingAddress.zipCode,
            country: paymentData.shippingAddress.country
          },
          appliedCoupons: paymentData.appliedCoupons || [],
          notes: 'Order from checkout',
          items: paymentData.items || []
        };
        
        const verificationResult = await verifyPayment(verificationData);
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: verificationResult.order?._id, // Use the database order ID
        });
      } catch (error: any) {
        const errorMessage = error.message || 'Payment verification failed';
        resolve({
          success: false,
          error: errorMessage,
        });
      }
    },
    modal: {
      ondismiss: () => {
        resolve({
          success: false,
          error: 'Payment was cancelled. Please try again or contact support if you continue to experience issues.',
        });
      },
    },
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

// Verify payment on backend
export const verifyPayment = async (verificationData: RazorpayResponse & {
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  appliedCoupons?: Array<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  }>;
  notes?: string;
  items?: Array<{
    product: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
    size?: string;
    color?: string;
  }>;
}) => {
  try {
    const response = await api.post('/payments/verify', verificationData);
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
    throw new Error(errorMessage);
  }
};

// Create order after successful payment
export const createOrder = async (orderData: Record<string, unknown>) => {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

// Get order details
export const getOrderDetails = async (orderId: string) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(error.response?.data?.message || 'Failed to fetch order details');
  }
};

// Clear cart after successful order
export const clearCart = async () => {
  try {
    const response = await api.post('/orders/clear-cart');
    return response.data;
  } catch (error: unknown) {
    throw new Error(error.response?.data?.message || 'Failed to clear cart');
  }
};

// COD-specific interfaces
export interface CODOrderData {
  items: Array<{
    product: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
    size: string;
    color: string;
  }>;
  shippingAddress: {
    fullName?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  appliedCoupons?: Array<{
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  }>;
  notes?: string;
}

export interface CODOrderResult {
  success: boolean;
  order?: {
    _id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
    orderStatus: string;
  };
  error?: string;
}

// Create COD order
export const createCODOrder = async (orderData: CODOrderData): Promise<CODOrderResult> => {
  try {
    const response = await api.post('/orders/cod', orderData);
    
    return {
      success: true,
      order: response.data.order
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to create COD order'
    };
  }
};

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void; };
  }
}

export default {
  createRazorpayOrder,
  initializeRazorpayPayment,
  verifyPayment,
  createOrder,
  getOrderDetails,
  clearCart,
  createCODOrder,
};