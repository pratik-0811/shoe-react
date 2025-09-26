import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Eye, Users, Calendar, Percent, DollarSign } from 'lucide-react';
import couponService from '../../services/couponService';
import { Coupon } from '../../types';

interface CouponUsage {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  order: {
    orderNumber: string;
    totalAmount: number;
  };
  discountAmount: number;
  usedAt: string;
}

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageLoading, setUsageLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    description: '',
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    userLimit: 1,
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await couponService.getAllCoupons();
      // Ensure coupons is always an array
      setCoupons(Array.isArray(response.coupons) ? response.coupons : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coupons');
      setCoupons([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsage = async (couponId: string) => {
    try {
      setUsageLoading(true);
      const response = await couponService.getCouponUsage(couponId);
      setCouponUsage(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch coupon usage');
    } finally {
      setUsageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, formData);
      } else {
        await couponService.createCoupon(formData);
      }
      fetchCoupons();
      resetForm();
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await couponService.deleteCoupon(couponId);
        fetchCoupons();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || '',
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      userLimit: coupon.userLimit || 1,
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      description: '',
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      userLimit: 1,
      expiryDate: '',
      isActive: true
    });
    setEditingCoupon(null);
  };

  const handleViewUsage = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    fetchCouponUsage(coupon._id);
    setShowUsageModal(true);
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && coupon.isActive) ||
                         (statusFilter === 'inactive' && !coupon.isActive) ||
                         (statusFilter === 'expired' && new Date(coupon.expiryDate) < new Date());
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (coupon: Coupon) => {
    if (!coupon.isActive) return 'bg-gray-100 text-gray-800';
    if (new Date(coupon.expiryDate) < new Date()) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (coupon: Coupon) => {
    if (!coupon.isActive) return 'Inactive';
    if (new Date(coupon.expiryDate) < new Date()) return 'Expired';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600">Manage discount coupons and promotional codes</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Coupon
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Coupons Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      <div className="text-sm text-gray-500">{coupon.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {coupon.type === 'percentage' ? (
                          <Percent className="w-4 h-4 text-blue-500 mr-2" />
                        ) : (
                          <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 capitalize">{coupon.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                      </div>
                      {coupon.maxDiscountAmount && coupon.type === 'percentage' && (
                         <div className="text-xs text-gray-500">Max: ₹{coupon.maxDiscountAmount}</div>
                       )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon)}`}>
                        {getStatusText(coupon)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewUsage(coupon)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Usage"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                      min="0"
                      max={formData.type === 'percentage' ? "100" : undefined}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  {formData.type === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                      <input
                        type="number"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      min="0"
                      placeholder="0 = Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Limit</label>
                    <input
                      type="number"
                      value={formData.userLimit}
                      onChange={(e) => setFormData({ ...formData, userLimit: Number(e.target.value) })}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                   <input
                     type="date"
                     value={formData.expiryDate}
                     onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     min={new Date().toISOString().split('T')[0]}
                     required
                   />
                 </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCoupon ? 'Update' : 'Create'} Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsageModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Usage History - {selectedCoupon.code}
                </h2>
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {usageLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : couponUsage.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No usage history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {couponUsage.map((usage) => (
                        <tr key={usage._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{usage.user.name}</div>
                            <div className="text-sm text-gray-500">{usage.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{usage.order.orderNumber}</div>
                            <div className="text-sm text-gray-500">₹{usage.order.totalAmount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">₹{usage.discountAmount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(usage.usedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;