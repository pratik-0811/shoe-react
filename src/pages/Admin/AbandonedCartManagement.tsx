import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface CartItem {
  product: {
    _id: string;
    name: string;
    image: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface AbandonedCart {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: CartItem[];
  totalAmount: number;
  abandonedAt: string;
  reminderSent: boolean;
  reminderSentAt?: string;
  recovered: boolean;
  recoveredAt?: string;
  recoveryToken: string;
  lastActivity: string;
}

const AbandonedCartManagement: React.FC = () => {
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchAbandonedCarts();
    fetchStats();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchAbandonedCarts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/abandoned-carts/admin/all?${params}`);
      setAbandonedCarts(response.data.abandonedCarts);
      setTotalPages(response.data.totalPages);
    } catch (err: unknown) {
      setError(err.response?.data?.message || 'Failed to fetch abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/abandoned-carts/admin/stats');
      setStats(response.data);
    } catch (err) {
      // Silent fail - stats not critical for UI
    }
  };

  const sendReminder = async (cartId: string) => {
    try {
      await api.post(`/abandoned-carts/admin/send-reminder/${cartId}`);
      fetchAbandonedCarts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reminder');
    }
  };

  const sendBulkReminders = async () => {
    if (window.confirm('Send reminders to all users with abandoned carts who haven\'t received one yet?')) {
      try {
        await api.post('/abandoned-carts/admin/send-bulk-reminders');
        fetchAbandonedCarts();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to send bulk reminders');
      }
    }
  };

  const getStatusColor = (cart: AbandonedCart) => {
    if (cart.recovered) return 'bg-green-100 text-green-800';
    if (cart.reminderSent) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (cart: AbandonedCart) => {
    if (cart.recovered) return 'Recovered';
    if (cart.reminderSent) return 'Reminder Sent';
    return 'Abandoned';
  };

  const getDaysAbandoned = (abandonedAt: string) => {
    const days = Math.floor((new Date().getTime() - new Date(abandonedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Abandoned Cart Management</h2>
        <button
          onClick={sendBulkReminders}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send Bulk Reminders
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Abandoned</p>
                <p className="text-2xl font-bold text-red-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-xl">
                🛒
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recovered</p>
                <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl">
                ✅
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recovery Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recoveryRate.toFixed(1)}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                📈
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalValue ? stats.totalValue.toLocaleString() : '0'}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                💰
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="abandoned">Abandoned</option>
          <option value="reminder-sent">Reminder Sent</option>
          <option value="recovered">Recovered</option>
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

      {/* Cart Details Modal */}
      {selectedCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Abandoned Cart Details</h3>
              <button
                onClick={() => setSelectedCart(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedCart.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedCart.user.email}</p>
                    <p><span className="font-medium">Abandoned:</span> {new Date(selectedCart.abandonedAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Days Ago:</span> {getDaysAbandoned(selectedCart.abandonedAt)} days</p>
                    <p><span className="font-medium">Last Activity:</span> {new Date(selectedCart.lastActivity).toLocaleDateString()}</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedCart)}`}>
                        {getStatusText(selectedCart)}
                      </span>
                    </div>
                    {selectedCart.reminderSent && selectedCart.reminderSentAt && (
                      <p><span className="font-medium">Reminder Sent:</span> {new Date(selectedCart.reminderSentAt).toLocaleDateString()}</p>
                    )}
                    {selectedCart.recovered && selectedCart.recoveredAt && (
                      <p><span className="font-medium">Recovered:</span> {new Date(selectedCart.recoveredAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Cart Items</h4>
                <div className="space-y-3">
                  {selectedCart.items.map((item, index) => (
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

                {/* Cart Total */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{selectedCart.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Recovery Link */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Recovery Link:</p>
                  <p className="text-xs text-gray-600 break-all">
                    {window.location.origin}/cart/recover/{selectedCart.recoveryToken}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-4">
              {!selectedCart.reminderSent && !selectedCart.recovered && (
                <button
                  onClick={() => {
                    sendReminder(selectedCart._id);
                    setSelectedCart(null);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Reminder
                </button>
              )}
              <button
                onClick={() => setSelectedCart(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abandoned Carts Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandoned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abandonedCarts.map((cart) => (
                  <tr key={cart._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cart.user.name}</div>
                      <div className="text-sm text-gray-500">{cart.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cart.items.length} items</div>
                      <div className="text-sm text-gray-500">
                        {cart.items.slice(0, 2).map(item => item.product.name).join(', ')}
                        {cart.items.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{cart.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(cart.abandonedAt).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">{getDaysAbandoned(cart.abandonedAt)} days ago</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cart)}`}>
                        {getStatusText(cart)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedCart(cart)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Details
                      </button>
                      {!cart.reminderSent && !cart.recovered && (
                        <button
                          onClick={() => sendReminder(cart._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Send Reminder
                        </button>
                      )}
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

      {abandonedCarts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No abandoned carts found</p>
        </div>
      )}
    </div>
  );
};

export default AbandonedCartManagement;