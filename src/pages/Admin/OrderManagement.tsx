import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Order, OrderItem, AppliedCoupon } from '../../types';

interface AdminOrderUser {
  _id: string;
  name: string;
  email: string;
}

interface AdminOrder extends Order {
  user: AdminOrderUser;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/orders/admin/all?${params}`);
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages);
    } catch (err: unknown) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus as any });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by order number or customer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('');
            setCurrentPage(1);
          }}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Order Details - {selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Order Number:</span> {selectedOrder.orderNumber}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Customer:</span> {selectedOrder.user?.name || 'N/A'} ({selectedOrder.user?.email || 'N/A'})</p>
                    <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Payment Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Order Status:</span>
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                    <p>Phone: {selectedOrder.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Billing Address (if different from shipping) */}
                {selectedOrder.billingAddress && (
                  selectedOrder.billingAddress.address !== selectedOrder.shippingAddress.address ||
                  selectedOrder.billingAddress.city !== selectedOrder.shippingAddress.city ||
                  selectedOrder.billingAddress.postalCode !== selectedOrder.shippingAddress.postalCode ||
                  selectedOrder.billingAddress.country !== selectedOrder.shippingAddress.country
                ) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Billing Address</h4>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.billingAddress.fullName}</p>
                      <p>{selectedOrder.billingAddress.address}</p>
                      <p>{selectedOrder.billingAddress.city}, {selectedOrder.billingAddress.postalCode}</p>
                      <p>{selectedOrder.billingAddress.country}</p>
                    </div>
                  </div>
                )}

                {/* Applied Coupons */}
                {selectedOrder.appliedCoupons && selectedOrder.appliedCoupons.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Applied Coupons</h4>
                    <div className="space-y-2">
                      {selectedOrder.appliedCoupons.map((coupon, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div>
                            <p className="font-medium text-sm text-gray-900">{coupon.code}</p>
                            <p className="text-xs text-gray-600">
                              {coupon.type === 'percentage' ? `${coupon.value}% off` : `₹${coupon.value} off`}
                            </p>
                          </div>
                          <p className="font-medium text-sm text-green-600">-₹{coupon.discountAmount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 border-b pb-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                      <p className="font-medium text-sm">₹{(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items Price:</span>
                      <span>₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.totalDiscount && selectedOrder.totalDiscount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-green-600">-₹{selectedOrder.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>₹{(selectedOrder.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>₹{(selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{order.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 border rounded-lg ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderManagement;