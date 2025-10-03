import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Phone, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Star,
  Tag,
  Copy,
  ExternalLink
} from 'lucide-react';
import orderService from '../services/orderService';
import { Order } from '../types';
import { downloadInvoicePDF, InvoiceData } from '../utils/invoiceGenerator';

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        if (orderData) {
          setOrder(orderData);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        // Silent fail - error handled by UI state
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-indigo-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200';
      case 'shipped':
        return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-200';
      case 'processing':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border-indigo-200';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      // Get invoice data from backend
      const invoiceData = await orderService.downloadInvoice(order._id);
      downloadInvoicePDF(invoiceData);
    } catch (error) {
      // Silent fail - fallback to client-side generation
      const fallbackInvoiceData: InvoiceData = {
        orderId: order._id,
        orderNumber: order.orderNumber || `ORD-${order._id?.slice(-8).toUpperCase()}`,
        date: order.createdAt,
        customerName: order.shippingAddress?.fullName || 'Customer',
        customerEmail: order.user?.email || 'customer@example.com',
        shippingAddress: {
          fullName: order.shippingAddress?.fullName || '',
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          state: order.shippingAddress?.state || '',
          zipCode: order.shippingAddress?.zipCode || '',
          country: order.shippingAddress?.country || 'India'
        },
        items: order.items?.map(item => ({
          name: item.product?.name || item.name || 'N/A',
          quantity: item.quantity || 0,
          price: item.price || 0,
          total: (item.price || 0) * (item.quantity || 0)
        })) || [],
        subtotal: order.subtotal || 0,
        shippingCost: order.shippingCost || 0,
        discount: order.totalDiscount || 0,
        totalAmount: order.total || 0,
        paymentMethod: order.paymentMethod || 'N/A',
        status: order.status || 'pending'
      };
      downloadInvoicePDF(fallbackInvoiceData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const orderStatus = order.orderStatus || order.status || 'pending';
  const paymentStatus = order.paymentStatus || 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber || order._id?.slice(-8)}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {order.trackingNumber && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Tracking: {order.trackingNumber}
                    <button
                      onClick={() => copyToClipboard(order.trackingNumber!)}
                      className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm border ${getStatusColor(orderStatus)}`}>
                {getStatusIcon(orderStatus)}
                {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items?.length || 0})
              </h2>
              
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="relative">
                      <img 
                         src={(() => {
                           // Handle both single image field and images array
                           const imageUrl = item.product?.images?.[0] || item.product?.image || item.image;
                           if (!imageUrl) return '/assets/product-placeholder.svg';
                           if (imageUrl.startsWith('http')) return imageUrl;
                           return `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                         })()}
                         alt={item.product?.name || item.name}
                         className="w-20 h-20 object-cover rounded-xl shadow-sm"
                         onError={(e) => {
                           // Silent fallback to placeholder image
                           e.currentTarget.src = '/assets/product-placeholder.svg';
                         }}
                       />
                      <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.product?.name || item.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        {item.size && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                            Size: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                            Color: {item.color}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </span>
                        <span className="font-semibold text-lg text-primary-600">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {orderStatus !== 'pending' && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        orderStatus === 'confirmed' || orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered'
                          ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <CheckCircle className={`w-5 h-5 ${
                          orderStatus === 'confirmed' || orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered'
                            ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order Confirmed</p>
                      <p className="text-sm text-gray-600">Your order has been confirmed and is being prepared</p>
                    </div>
                  </div>
                )}
                
                {(orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered') && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Processing</p>
                      <p className="text-sm text-gray-600">Your order is being processed and packed</p>
                    </div>
                  </div>
                )}
                
                {(orderStatus === 'shipped' || orderStatus === 'delivered') && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Shipped</p>
                      <p className="text-sm text-gray-600">
                        Your order has been shipped
                        {order.trackingNumber && (
                          <span className="block mt-1">
                            Tracking: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.trackingNumber}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                
                {orderStatus === 'delivered' && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-600">
                        {order.deliveredAt 
                          ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}`
                          : 'Your order has been delivered'
                        }
                      </p>
                    </div>
                  </div>
                )}
                
                {orderStatus === 'cancelled' && (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Cancelled</p>
                      <p className="text-sm text-gray-600">
                        {order.cancelReason || 'Order has been cancelled'}
                        {order.cancelledAt && (
                          <span className="block mt-1">
                            Cancelled on {new Date(order.cancelledAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(order.subtotal || 0).toFixed(2)}</span>
                </div>
                
                {order.shippingCost && order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">₹{order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
                
                {order.tax && order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹{order.tax.toFixed(2)}</span>
                  </div>
                )}
                
                {order.totalDiscount && order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-₹{order.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-primary-600">₹{(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {order.appliedCoupons && order.appliedCoupons.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Applied Coupons</h4>
                  <div className="space-y-2">
                    {order.appliedCoupons.map((coupon, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">{coupon.code}</span>
                        <span className="text-sm font-medium text-green-600">-₹{coupon.discountAmount?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1) || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    paymentStatus === 'paid' || paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      paymentStatus === 'paid' || paymentStatus === 'completed' ? 'bg-green-500' :
                      paymentStatus === 'pending' ? 'bg-yellow-500' :
                      paymentStatus === 'failed' ? 'bg-red-500' :
                      paymentStatus === 'refunded' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    {paymentStatus}
                  </span>
                </div>
                
                {order.paymentDetails?.razorpay_payment_id && (
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {order.paymentDetails.razorpay_payment_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h3>
              
              {order.shippingAddress && (
                <div className="text-sm text-gray-600 space-y-1">
                  {order.shippingAddress.fullName && (
                    <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                  )}
                  <p>{order.shippingAddress.address || order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode || order.shippingAddress.zipCode}
                  </p>
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                  {order.shippingAddress.phone && (
                    <p className="flex items-center gap-1 mt-2">
                      <Phone className="w-4 h-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleDownloadInvoice}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
                
                {orderStatus === 'delivered' && (
                  <Link
                    to={`/products`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Star className="w-4 h-4" />
                    Write Review
                  </Link>
                )}
                
                {(orderStatus === 'pending' || orderStatus === 'confirmed') && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200">
                    <XCircle className="w-4 h-4" />
                    Cancel Order
                  </button>
                )}
                
                {order.trackingNumber && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200">
                    <ExternalLink className="w-4 h-4" />
                    Track Package
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;