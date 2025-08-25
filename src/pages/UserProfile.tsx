import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Package, Heart, Settings, Edit3, LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import orderService from '../services/orderService';
import { User as UserType, Order } from '../types';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  
  const [editData, setEditData] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
  }>({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '' 
  });
  
  useEffect(() => {
    // Check if user is authenticated
    if (!userService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    // Fetch user data
    fetchUserData();
    fetchRecentOrders();
  }, [navigate]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const user = await userService.getCurrentUser();
      setUserData(user);
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      
      // Get wishlist count
      const wishlist = await userService.getWishlist();
      setWishlistCount(wishlist.length);
      
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load user data. Please try again.');
      setLoading(false);
    }
  };
  
  const fetchRecentOrders = async () => {
    try {
      const { orders, total } = await orderService.getOrders({ page: 1, limit: 3 });
      setRecentOrders(orders);
      setOrderCount(total);
    } catch (err) {
      console.error('Failed to fetch recent orders', err);
    }
  };
  
  const handleLogout = () => {
    userService.logout();
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await userService.updateProfile(editData);
      await fetchUserData(); // Refresh user data
      setIsEditing(false);
    } catch (err: any) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setEditData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      });
    }
    setIsEditing(false);
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-900"></div>
      </div>
    );
  }
  
  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => fetchUserData()}
            className="w-full bg-primary-950 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-red-700 hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-primary-950 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{userData?.name}</h1>
                <p className="text-gray-600">Member since {new Date(userData?.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 animate-slide-up">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 py-2">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-800">{userData?.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 py-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-800">{userData?.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 py-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">{userData?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <div className="flex items-start space-x-3 py-2">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-800">{userData?.address || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-primary-600" />
                    <span className="text-gray-600">Total Orders</span>
                  </div>
                  <span className="font-semibold text-gray-800">{orderCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-gray-600">Wishlist Items</span>
                  </div>
                  <span className="font-semibold text-gray-800">{wishlistCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600">Member Since</span>
                  </div>
                  <span className="font-semibold text-gray-800">{new Date(userData?.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/orders" className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Package className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">View Orders</span>
                </Link>
                <Link to="/wishlist" className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Wishlist</span>
                </Link>
                <Link to="/account-settings" className="w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Account Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? recentOrders.map((order, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-primary-600">#{order._id.substring(0, 8)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">${order.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      No orders found. Start shopping to see your orders here!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;