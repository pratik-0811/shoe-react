import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Package, Heart, Settings, Edit3, LogOut, Camera, ShoppingBag, Star, Award, CreditCard, Bell, Shield, ChevronRight, ChevronLeft, Filter, Search, Eye, Trash2, Edit, CheckCircle, Clock, XCircle, Plus, Truck, Tag, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import orderService from '../services/orderService';
import wishlistService from '../services/wishlistService';
import reviewService from '../services/reviewService';
import imageUploadService from '../services/imageUploadService';
import { useWishlist } from '../contexts/WishlistContext';
import { User as UserType, Order, Product, Address } from '../types';
import { ReviewData } from '../services/reviewService';
import AddressManagement from '../components/AddressManagement';

interface UserStats {
  orderCount: number;
  wishlistCount: number;
  reviewCount: number;
}

interface OrderFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
}

const UserProfile: React.FC = () => {
  // Add CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const navigate = useNavigate();
  const { itemCount: wishlistCount } = useWishlist();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({ orderCount: 0, wishlistCount: 0, reviewCount: 0 });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilters, setOrderFilters] = useState<OrderFilters>({ status: '', dateFrom: '', dateTo: '' });
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Reviews state
  const [userReviews, setUserReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilters, setReviewFilters] = useState<{ status: string }>({ status: '' });
  
  // Address management state
  const [showAddressManagement, setShowAddressManagement] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [editingReview, setEditingReview] = useState<string | null>(null);
  
  // Settings state
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
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
  
  const [fieldErrors, setFieldErrors] = useState<{
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
  
  // Track order popup state
  const [showTrackOrderPopup, setShowTrackOrderPopup] = useState<string | null>(null);
  
  useEffect(() => {
    if (!userService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    fetchUserData();
    fetchUserStats();
  }, [navigate]);
  
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    } else if (activeTab === 'reviews') {
      fetchUserReviews();
    }
  }, [activeTab, orderFilters, reviewFilters, ordersPagination.page, reviewsPagination.page]);
  
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
      setLoading(false);
    } catch {
      setError('Failed to load user data. Please try again.');
      setLoading(false);
    }
  };
  
  const fetchUserStats = async () => {
    try {
      const stats = await userService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      // Silent fail - stats not critical for UI
    }
  };
  
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const params: any = { page: ordersPagination.page, limit: 10 };
      if (orderFilters.status) params.status = orderFilters.status;
      if (orderFilters.dateFrom) params.dateFrom = orderFilters.dateFrom;
      if (orderFilters.dateTo) params.dateTo = orderFilters.dateTo;
      
      const result = await orderService.getOrders(params);
      setOrders(result.orders);
      setOrdersPagination(prev => ({ ...prev, total: result.total, totalPages: Math.ceil(result.total / 10) }));
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setOrdersLoading(false);
    }
  };
  
  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const wishlist = await wishlistService.getWishlist();
      setWishlistItems(wishlist.items?.map(item => item.product) || []);
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setWishlistLoading(false);
    }
  };
  
  const fetchUserReviews = async () => {
    try {
      setReviewsLoading(true);
      const status = reviewFilters.status || undefined;
      const result = await reviewService.getUserReviews(reviewsPagination.page, 10, status as any);
      setUserReviews(result.reviews);
      setReviewsPagination(prev => ({ 
        ...prev, 
        total: result.pagination.totalReviews,
        totalPages: result.pagination.totalPages 
      }));
    } catch (error) {
      // Silent fail - error handled by UI state
    } finally {
      setReviewsLoading(false);
    }
  };
  
  const handleLogout = () => {
    userService.logout();
    navigate('/login');
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatarPreview = () => {
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) return 'Please enter a valid phone number';
        return '';
      case 'address':
        if (value && value.length > 500) return 'Address must be less than 500 characters';
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      name: validateField('name', editData.name),
      email: validateField('email', editData.email),
      phone: validateField('phone', editData.phone),
      address: validateField('address', editData.address)
    };
    
    setFieldErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleEditDataChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
    
    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  const validatePasswordField = (name: string, value: string): string => {
    switch (name) {
      case 'currentPassword':
        if (!value.trim()) return 'Current password is required';
        return '';
      case 'newPassword':
        if (!value.trim()) return 'New password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        return '';
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your new password';
        if (value !== passwordData.newPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const validatePasswordForm = (): boolean => {
    const errors = {
      currentPassword: validatePasswordField('currentPassword', passwordData.currentPassword),
      newPassword: validatePasswordField('newPassword', passwordData.newPassword),
      confirmPassword: validatePasswordField('confirmPassword', passwordData.confirmPassword)
    };
    
    setPasswordErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handlePasswordDataChange = (field: string, value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
    
    // Clear field error when user starts typing
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors({ ...passwordErrors, [field]: '' });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const updateData = { ...editData };
      
      if (selectedAvatarFile) {
        setUploadingAvatar(true);
        try {
          const uploadResponse = await imageUploadService.uploadAvatarImage(selectedAvatarFile);
          updateData.avatar = uploadResponse.imageUrl;
        } catch {
          setError('Failed to upload avatar. Please try again.');
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }
      
      await userService.updateProfile(updateData);
      await fetchUserData();
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch {
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
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };
  
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
    } catch (error) {
      // Silent fail - error handled by UI state
    }
  };
  
  const handleDeleteReview = async (reviewId: string) => {
    try {
      await reviewService.deleteReview(reviewId);
      setUserReviews(prev => prev.filter(review => review._id !== reviewId));
      setUserStats(prev => ({ ...prev, reviewCount: prev.reviewCount - 1 }));
    } catch (error) {
      // Silent fail - error handled by UI state
    }
  };
  
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setSettingsLoading(true);
      await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
    } catch (error) {
      setError('Failed to change password. Please check your current password.');
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const handleUpdateNotifications = async () => {
    try {
      setSettingsLoading(true);
      await userService.updateNotificationPreferences(notificationPrefs);
    } catch (error) {
      setError('Failed to update notification preferences.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package, count: userStats.orderCount },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlistCount },
    { id: 'reviews', label: 'Reviews', icon: Star, count: userStats.reviewCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  if (error && !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-red-600 mb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            {error}
          </div>
          <button 
            onClick={() => fetchUserData()}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="text-red-700 hover:text-red-900 font-medium"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Modern Header with Gradient Background */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group">
                  {avatarPreview || userData?.avatar ? (
                    <img
                      src={avatarPreview || userData?.avatar}
                      alt="User avatar"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/20">
                      <User className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                    </div>
                  )}

          
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-black/60 transition-all group-hover:opacity-100 opacity-0"
                         onClick={() => document.getElementById('avatar-upload')?.click()}>
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  {isEditing && (
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  )}
                </div>
                
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{userData?.name}</h1>
                  <p className="text-white/80 mb-4">Member since {new Date(userData?.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  
                  {/* Dynamic Stats Row */}
                  <div className="flex flex-wrap gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">{userStats.orderCount}</div>
                      <div className="text-white/80 text-sm">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">{wishlistCount}</div>
                      <div className="text-white/80 text-sm">Wishlist</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold">{userStats.reviewCount}</div>
                      <div className="text-white/80 text-sm">Reviews</div>
                    </div>
                  </div>
                  
                  {isEditing && selectedAvatarFile && (
                    <button
                      type="button"
                      onClick={removeAvatarPreview}
                      className="mt-3 text-sm text-white/80 hover:text-white transition-colors underline"
                    >
                      Remove new avatar
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={uploadingAvatar}
                      className="group relative flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl hover:bg-green-500/40 hover:scale-105 hover:shadow-lg transition-all duration-300 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-300/30 to-green-400/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      <CheckCircle className="w-4 h-4 relative z-10 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="relative z-10">{uploadingAvatar ? 'Uploading...' : 'Save'}</span>
                      <div className="absolute inset-0 rounded-xl bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="group relative flex items-center justify-center gap-2 px-4 py-2 bg-gray-500/20 backdrop-blur-sm border border-gray-400/30 rounded-xl hover:bg-gray-500/40 hover:scale-105 hover:shadow-lg transition-all duration-300 text-white font-medium overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-400/20 via-gray-300/30 to-gray-400/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      <XCircle className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="relative z-10">Cancel</span>
                      <div className="absolute inset-0 rounded-xl bg-gray-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="group relative flex items-center justify-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-300 text-white font-medium overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      <Edit3 className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="relative z-10">Edit Profile</span>
                      <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="group relative flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl hover:bg-red-500/40 hover:scale-105 hover:shadow-lg transition-all duration-300 text-white font-medium overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-300/30 to-red-400/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                       <LogOut className="w-4 h-4 relative z-10 group-hover:-rotate-12 transition-transform duration-300" />
                       <span className="relative z-10">Logout</span>
                       <div className="absolute inset-0 rounded-xl bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="sm:hidden">
            <div className="flex overflow-x-auto scrollbar-hide relative z-10 px-2 py-2 gap-2" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex flex-col items-center gap-1 px-3 py-3 font-medium transition-all duration-300 whitespace-nowrap min-w-[80px] rounded-xl touch-manipulation ${
                      isActive
                        ? 'bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                        : 'text-gray-600 hover:text-primary-600 bg-gray-50 hover:bg-gradient-to-b hover:from-primary-50 hover:to-blue-50 active:scale-95'
                    }`}
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                    {/* Mobile active indicator */}
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white rounded-full animate-pulse"></div>
                    )}
                    
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-white scale-110' : 'group-hover:scale-110 group-hover:text-primary-600 group-active:scale-95'
                    }`} />
                    <span className={`text-xs transition-all duration-300 ${
                      isActive ? 'font-semibold text-white' : 'group-hover:font-medium'
                    }`}>{tab.label.split(' ')[0]}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full font-bold transition-all duration-300 transform ${
                        isActive 
                          ? 'bg-white text-primary-600 scale-110 animate-bounce' 
                          : 'bg-red-500 text-white group-hover:scale-110'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    
                    {/* Touch feedback */}
                    <div className="absolute inset-0 bg-white/20 rounded-xl transform scale-0 group-active:scale-100 transition-transform duration-150 ease-out"></div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Desktop: Standard horizontal tabs */}
          <div className="hidden sm:block">
            <div className="flex overflow-x-auto scrollbar-hide relative z-10">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center gap-3 px-6 py-4 font-medium transition-all duration-300 whitespace-nowrap min-w-0 flex-1 sm:flex-none overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-600 shadow-inner'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50'
                    }`}
                    style={{animationDelay: `${index * 50}ms`}}
                  >
                  {/* Animated background overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-purple-500/10 transform transition-all duration-300 ${
                    isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-50'
                  }`}></div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-blue-500 animate-pulse"></div>
                  )}
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'text-primary-600 scale-110' : 'group-hover:scale-110 group-hover:text-primary-600'
                    }`} />
                    <span className={`hidden sm:inline transition-all duration-300 ${
                      isActive ? 'font-semibold' : 'group-hover:font-medium'
                    }`}>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold transition-all duration-300 transform ${
                        isActive 
                          ? 'bg-gradient-to-r from-primary-100 to-blue-100 text-primary-700 scale-105 animate-pulse' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gradient-to-r group-hover:from-primary-100 group-hover:to-blue-100 group-hover:text-primary-700 group-hover:scale-105'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </div>
                  
                  {/* Ripple effect on click */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-primary-500/20 rounded-full transform scale-0 group-active:scale-150 transition-transform duration-300 ease-out"></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 sm:space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Profile Information */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-3">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                    Profile Information
                  </h2>
                  
                  <div className="space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => handleEditDataChange('name', e.target.value)}
                              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base touch-manipulation ${
                                fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                              }`}
                              placeholder="Enter your full name"
                            />
                            {fieldErrors.name && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <span className="mr-1">⚠</span>
                                {fieldErrors.name}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 font-medium text-sm sm:text-base truncate">{userData?.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                        {isEditing ? (
                          <div>
                            <input
                              type="email"
                              value={editData.email}
                              onChange={(e) => handleEditDataChange('email', e.target.value)}
                              className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base touch-manipulation ${
                                fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                              }`}
                              placeholder="Enter your email address"
                            />
                            {fieldErrors.email && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <span className="mr-1">⚠</span>
                                {fieldErrors.email}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 font-medium text-sm sm:text-base truncate">{userData?.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
                      {isEditing ? (
                        <div>
                          <input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => handleEditDataChange('phone', e.target.value)}
                            className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-base touch-manipulation ${
                              fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                            }`}
                            placeholder="Enter your phone number"
                          />
                          {fieldErrors.phone && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <span className="mr-1">⚠</span>
                              {fieldErrors.phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                          <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 font-medium text-sm sm:text-base">{userData?.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Address</label>
                      {isEditing ? (
                        <div>
                          <textarea
                            value={editData.address}
                            onChange={(e) => handleEditDataChange('address', e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none text-base touch-manipulation ${
                              fieldErrors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                            }`}
                            placeholder="Enter your address"
                          />
                          {fieldErrors.address && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <span className="mr-1">⚠</span>
                              {fieldErrors.address}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <span className="text-gray-900 font-medium">{userData?.address || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    Account Stats
                  </h3>
                  
                  {/* Mobile: Horizontal grid */}
                  <div className="grid grid-cols-3 gap-2 sm:hidden">
                    <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                      <Package className="w-4 h-4 text-blue-600 mb-1" />
                      <span className="text-lg font-bold text-blue-600">{userStats.orderCount}</span>
                      <span className="text-xs font-medium text-gray-700 text-center">Orders</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg">
                      <Heart className="w-4 h-4 text-red-600 mb-1" />
                      <span className="text-lg font-bold text-red-600">{wishlistCount}</span>
                      <span className="text-xs font-medium text-gray-700 text-center">Wishlist</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-600 mb-1" />
                      <span className="text-lg font-bold text-yellow-600">{userStats.reviewCount}</span>
                      <span className="text-xs font-medium text-gray-700 text-center">Reviews</span>
                    </div>
                  </div>
                  
                  {/* Desktop: Vertical list */}
                  <div className="hidden sm:block space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-700">Total Orders</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{userStats.orderCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-700">Wishlist Items</span>
                      </div>
                      <span className="text-xl font-bold text-red-600">{wishlistCount}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-700">Reviews Written</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-600">{userStats.reviewCount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                    Member Since
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    {new Date(userData?.createdAt || '').toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  <span className="truncate">Order History ({userStats.orderCount})</span>
                </h2>
                
                {/* Order Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={orderFilters.status}
                    onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full sm:w-auto px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base touch-manipulation"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={orderFilters.dateFrom}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base touch-manipulation"
                      placeholder="From Date"
                    />
                    
                    <input
                      type="date"
                      value={orderFilters.dateTo}
                      onChange={(e) => setOrderFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base touch-manipulation"
                      placeholder="To Date"
                    />
                  </div>
                </div>
              </div>
              
              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gradient-to-r from-primary-200 to-primary-300"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-600 absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-primary-600 font-medium animate-pulse">Loading your orders...</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-purple-50/30 rounded-3xl"></div>
                  <div className="relative z-10">
                    <div className="relative inline-block">
                      <Package className="w-20 h-20 text-primary-300 mx-auto mb-6 animate-bounce" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold animate-pulse">0</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">No orders found</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">You haven't placed any orders yet. Start exploring our amazing collection!</p>
                    <Link to="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 text-white rounded-2xl hover:from-primary-700 hover:via-primary-800 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold">
                      <ShoppingBag className="w-5 h-5" />
                      Start Shopping
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order, orderIndex) => (
                    <div 
                      key={order._id} 
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
                      style={{
                        animationDelay: `${orderIndex * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-100/0 group-hover:from-primary-50/30 group-hover:via-primary-50/20 group-hover:to-primary-100/30 transition-all duration-700 rounded-2xl"></div>
                      
                      {/* Floating particles effect */}
                      <div className="absolute top-4 right-4 w-2 h-2 bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500" style={{animationDelay: '0.1s'}}></div>
                      <div className="absolute top-8 right-8 w-1 h-1 bg-primary-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500" style={{animationDelay: '0.5s'}}></div>
                      
                      <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-primary-700 transition-colors duration-300 truncate">Order #{order.orderNumber || order._id?.slice(-8)}</h3>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 shadow-lg flex-shrink-0"></div>
                            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                              <div className="w-1 h-1 bg-primary-300 rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-primary-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{new Date(order.createdAt || '').toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </span>
                            {order.trackingNumber && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate text-xs sm:text-sm">{order.trackingNumber}</span>
                              </span>
                            )}
                          </div>
                          {order.shippingAddress && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-3 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:border-blue-200 transition-all duration-500 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Shipping Address</p>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {order.shippingAddress.fullName && <span className="font-semibold text-gray-900">{order.shippingAddress.fullName}<br /></span>}
                                {order.shippingAddress.address || order.shippingAddress.street || ''}
                                {(order.shippingAddress.address || order.shippingAddress.street) && <br />}
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode || order.shippingAddress.zipCode || ''}
                                {order.shippingAddress.country && <br />}{order.shippingAddress.country}
                              </p>
                            </div>
                          )}
                          {order.appliedCoupons && order.appliedCoupons.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Coupons Applied:
                              </span>
                              {order.appliedCoupons.map((coupon, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 text-green-800 text-xs font-semibold rounded-full border border-green-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 relative overflow-hidden group/coupon"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-green-200/0 to-emerald-200/0 group-hover/coupon:from-green-200/50 group-hover/coupon:to-emerald-200/50 transition-all duration-500"></div>
                                  <Tag className="w-3 h-3 relative z-10 group-hover/coupon:rotate-12 transition-transform duration-300" />
                                  <span className="relative z-10">{coupon.code} (-₹{coupon.discountAmount?.toFixed(2)})</span>
                                </span>
                              ))}
                            </div>
                          )}
                          {order.paymentMethod && (
                            <div className="flex items-center gap-2 mt-2">
                              <CreditCard className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}
                              </span>
                              {order.paymentStatus && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                  order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                  order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                  order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    order.paymentStatus === 'paid' || order.paymentStatus === 'completed' ? 'bg-green-500' :
                                    order.paymentStatus === 'pending' ? 'bg-yellow-500' :
                                    order.paymentStatus === 'failed' ? 'bg-red-500' :
                                    order.paymentStatus === 'refunded' ? 'bg-purple-500' :
                                    'bg-gray-500'
                                  }`}></div>
                                  {order.paymentStatus}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                              order.orderStatus === 'delivered' ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white border-2 border-emerald-300' :
                              order.orderStatus === 'shipped' ? 'bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600 text-white border-2 border-blue-300' :
                              order.orderStatus === 'processing' ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white border-2 border-amber-300' :
                              order.orderStatus === 'confirmed' ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white border-2 border-indigo-300' :
                              order.orderStatus === 'cancelled' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600 text-white border-2 border-red-300' :
                              order.orderStatus === 'pending' ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white border-2 border-orange-300' :
                              'bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 text-white border-2 border-gray-300'
                            }`}>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                              <div className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse relative z-10 ${
                                order.orderStatus === 'delivered' ? 'bg-emerald-200 shadow-lg shadow-emerald-300/50' :
                                order.orderStatus === 'shipped' ? 'bg-blue-200 shadow-lg shadow-blue-300/50' :
                                order.orderStatus === 'processing' ? 'bg-amber-200 shadow-lg shadow-amber-300/50' :
                                order.orderStatus === 'confirmed' ? 'bg-indigo-200 shadow-lg shadow-indigo-300/50' :
                                order.orderStatus === 'cancelled' ? 'bg-red-200 shadow-lg shadow-red-300/50' :
                                order.orderStatus === 'pending' ? 'bg-orange-200 shadow-lg shadow-orange-300/50' :
                                'bg-gray-200 shadow-lg shadow-gray-300/50'
                              }`}></div>
                              <span className="relative z-10 uppercase tracking-wide">{(order.orderStatus || order.status || 'pending')?.charAt(0).toUpperCase() + (order.orderStatus || order.status || 'pending')?.slice(1)}</span>
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            {order.totalDiscount && order.totalDiscount > 0 && (
                              <div className="flex items-center sm:justify-end gap-2 mb-1 sm:mb-2">
                                <span className="text-xs sm:text-sm text-gray-500 line-through font-medium">₹{((order.total || order.totalAmount || 0) + order.totalDiscount).toFixed(2)}</span>
                                <span className="text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold shadow-lg animate-pulse">-₹{order.totalDiscount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex items-center sm:justify-end gap-1 sm:gap-2 mb-1">
                              <div className="text-left sm:text-right">
                                <span className="text-xl sm:text-3xl font-black bg-gradient-to-r from-primary-600 via-primary-700 to-purple-600 bg-clip-text text-transparent">₹{(order.total || order.totalAmount || 0).toFixed(2)}</span>
                                <div className="w-full h-0.5 sm:h-1 bg-gradient-to-r from-primary-400 to-purple-500 rounded-full mt-0.5 sm:mt-1 opacity-60"></div>
                              </div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full animate-ping"></div>
                            </div>
                            <div className="flex items-center sm:justify-end gap-1 sm:gap-2">
                              <p className="text-xs sm:text-sm text-gray-600 font-medium">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</p>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-100 pt-3 sm:pt-4 mt-3 sm:mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900">Order Items ({order.items?.length || 0})</h4>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button 
                              onClick={() => setShowTrackOrderPopup(order._id)}
                              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 hover:border-primary-300 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 relative overflow-hidden group/track"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 to-primary-200/0 group-hover/track:from-primary-100/50 group-hover/track:to-primary-200/30 transition-all duration-500"></div>
                              <Truck className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover/track:rotate-12 transition-transform duration-300" />
                              <span className="relative z-10">Track</span>
                            </button>
                            <button 
                              onClick={() => navigate(`/order/${order._id}`)}
                              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group/btn"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 relative z-10 group-hover/btn:rotate-12 transition-transform duration-300" />
                              <span className="relative z-10">View Details</span>
                              <div className="w-1 h-1 bg-white/60 rounded-full relative z-10 group-hover/btn:animate-ping"></div>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div 
                              key={index} 
                              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-lg hover:scale-105 transition-all duration-400 relative overflow-hidden group/item"
                              style={{
                                animationDelay: `${index * 150}ms`,
                                animation: 'slideInRight 0.5s ease-out forwards'
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover/item:from-primary-50/20 group-hover/item:to-primary-100/10 transition-all duration-500"></div>
                              <div className="relative group/img">
                                <div className="relative overflow-hidden rounded-xl">
                                  <img 
                                    src={(() => {
                                      // Handle both single image field and images array
                                      const imageUrl = item.product?.images?.[0] || item.product?.image;
                                      if (!imageUrl) return '/assets/product-placeholder.svg';
                                      if (imageUrl.startsWith('http')) return imageUrl;
                                      return `http://localhost:5000${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                                    })()} 
                                    alt={item.product?.name || 'Product'}
                                    className="w-16 h-16 object-cover rounded-xl shadow-lg group-hover/item:scale-110 transition-transform duration-500"
                                    onError={(e) => {
                                      // Silent fallback to placeholder image
                                      e.currentTarget.src = '/assets/product-placeholder.svg';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                                </div>
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-white group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-300">
                                  <span className="group-hover/item:animate-pulse">{item.quantity}</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 relative z-10">
                                <p className="font-semibold text-gray-900 truncate text-sm group-hover/item:text-primary-700 transition-colors duration-300">{item.product?.name || item.name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {item.size && (
                                    <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1.5 rounded-full border border-gray-300 font-medium hover:from-primary-100 hover:to-primary-200 hover:text-primary-700 hover:border-primary-300 transition-all duration-300 shadow-sm">
                                      {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-1.5 rounded-full border border-gray-300 font-medium hover:from-primary-100 hover:to-primary-200 hover:text-primary-700 hover:border-primary-300 transition-all duration-300 shadow-sm">
                                      {item.color}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <p className="text-sm font-bold text-primary-600 group-hover/item:text-primary-700 transition-colors duration-300">₹{(item.price || 0).toFixed(2)}</p>
                                  <div className="w-1 h-1 bg-primary-400 rounded-full group-hover/item:animate-ping"></div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.items && order.items.length > 3 && (
                            <div className="flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-300 hover:from-primary-50 hover:to-primary-100 transition-all duration-500 group/more">
                              <div className="text-center">
                                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover/more:text-primary-500 group-hover/more:scale-110 transition-all duration-300" />
                                <p className="text-sm font-medium text-gray-600 group-hover/more:text-primary-700 transition-colors duration-300">+{order.items.length - 3} more items</p>
                                <p className="text-xs text-gray-500 group-hover/more:text-primary-600 transition-colors duration-300">Click "View Details" to see all</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {ordersPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                      {/* Mobile: Compact pagination */}
                      <div className="flex sm:hidden items-center gap-2 w-full">
                        <button
                          onClick={() => setOrdersPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={ordersPagination.page === 1}
                          className="flex-1 group relative px-4 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium touch-manipulation"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm">Prev</span>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1 px-3 py-2 bg-primary-50 rounded-lg">
                          <span className="text-sm font-medium text-primary-700">{ordersPagination.page}</span>
                          <span className="text-sm text-gray-500">of</span>
                          <span className="text-sm font-medium text-primary-700">{ordersPagination.totalPages}</span>
                        </div>
                        
                        <button
                          onClick={() => setOrdersPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={ordersPagination.page === ordersPagination.totalPages}
                          className="flex-1 group relative px-4 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium touch-manipulation"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      </div>
                      
                      {/* Desktop: Full pagination */}
                      <div className="hidden sm:flex items-center gap-3">
                        <button
                          onClick={() => setOrdersPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={ordersPagination.page === 1}
                          className="group relative px-6 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 font-medium overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 via-primary-200/0 to-primary-100/0 group-hover:from-primary-100/50 group-hover:via-primary-200/30 group-hover:to-primary-100/50 transition-all duration-500 rounded-xl"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                            <span className="group-hover:text-primary-700 transition-colors duration-300">Previous</span>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {[...Array(Math.min(ordersPagination.totalPages, 5))].map((_, index) => {
                            let pageNum;
                            if (ordersPagination.totalPages <= 5) {
                              pageNum = index + 1;
                            } else {
                              const current = ordersPagination.page;
                              const total = ordersPagination.totalPages;
                              if (current <= 3) {
                                pageNum = index + 1;
                              } else if (current >= total - 2) {
                                pageNum = total - 4 + index;
                              } else {
                                pageNum = current - 2 + index;
                              }
                            }
                            const isActive = pageNum === ordersPagination.page;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setOrdersPagination(prev => ({ ...prev, page: pageNum }))}
                                className={`relative w-10 h-10 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
                                  isActive 
                                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-110' 
                                    : 'border border-gray-300 text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 hover:scale-105 hover:shadow-md'
                                }`}
                              >
                                {!isActive && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 via-primary-200/0 to-primary-100/0 hover:from-primary-100/50 hover:via-primary-200/30 hover:to-primary-100/50 transition-all duration-500 rounded-xl"></div>
                                )}
                                {isActive && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 animate-pulse"></div>
                                )}
                                <span className="relative z-10">{pageNum}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setOrdersPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={ordersPagination.page === ordersPagination.totalPages}
                          className="group relative px-6 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 font-medium overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 via-primary-200/0 to-primary-100/0 group-hover:from-primary-100/50 group-hover:via-primary-200/30 group-hover:to-primary-100/50 transition-all duration-500 rounded-xl"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <span className="group-hover:text-primary-700 transition-colors duration-300">Next</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  Manage Addresses
                </h2>
                <button
                  onClick={() => setShowAddressManagement(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Manage Addresses
                </button>
              </div>
              
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Address Management</h3>
                <p className="text-gray-500 mb-6">Click the button above to manage your delivery addresses.</p>
              </div>
            </div>
          )}
          {activeTab === 'wishlist' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary-600" />
                Wishlist 
              </h2>
              
              {wishlistLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse" style={{animationDelay: `${index * 100}ms`}}>
                        <div className="aspect-square bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[slide_2s_infinite]" style={{animationDelay: `${index * 200}ms`}}></div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${60 + Math.random() * 30}%`}}></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${40 + Math.random() * 20}%`}}></div>
                          <div className="h-6 bg-gradient-to-r from-blue-200 to-blue-300 rounded animate-pulse" style={{width: '80%'}}></div>
                          <div className="flex gap-2">
                            <div className="flex-1 h-8 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse"></div>
                            <div className="w-10 h-8 bg-gradient-to-r from-red-200 to-red-300 rounded-lg animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="relative">
                        <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <span className="text-blue-700 font-medium">Loading your wishlist...</span>
                    </div>
                  </div>
                </div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                  <p className="text-gray-500">Save items you love for later.</p>
                  <Link to="/products" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200">
                    <ShoppingBag className="w-4 h-4" />
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wishlistItems.map((product, index) => (
                    <div 
                      key={product._id} 
                      className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-primary-300 hover:-translate-y-2 transition-all duration-500 transform"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-primary-50/40 group-hover:via-purple-50/30 group-hover:to-pink-50/40 transition-all duration-700 rounded-xl"></div>
                      
                      {/* Floating heart effect */}
                      <div className="absolute top-3 right-3 w-8 h-8 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-90 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300 z-20 shadow-lg">
                        <Heart className="w-4 h-4 text-white fill-current animate-pulse" />
                      </div>
                      
                      {/* Sparkle effects */}
                      <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500" style={{animationDelay: '0.1s'}}></div>
                      <div className="absolute top-4 left-6 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500" style={{animationDelay: '0.3s'}}></div>
                      <div className="absolute top-6 left-3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" style={{animationDelay: '0.5s'}}></div>
                      
                      <div className="relative z-10">
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={product.images?.[0]?.startsWith('http') ? product.images[0] : `http://localhost:5000${product.images?.[0] || '/assets/product-placeholder.svg'}`} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          {/* Image overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        
                        <div className="p-4 relative">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors duration-300">{product.name}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <p className="text-lg font-bold text-primary-600 group-hover:text-primary-700 transition-colors duration-300">${product.price?.toFixed(2)}</p>
                            <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 shadow-lg"></div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link 
                              to={`/product/${product._id}`}
                              className="group/btn flex-1 relative bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 hover:scale-105 transition-all duration-300 text-center text-sm font-medium overflow-hidden shadow-lg hover:shadow-xl"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out"></div>
                              <span className="relative z-10">View Details</span>
                            </Link>
                            <button
                              onClick={() => handleRemoveFromWishlist(product._id)}
                              className="group/remove relative px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-105 transition-all duration-300 overflow-hidden shadow-md hover:shadow-lg"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-300/30 to-red-400/20 transform -translate-x-full group-hover/remove:translate-x-full transition-transform duration-500 ease-out"></div>
                              <Trash2 className="w-4 h-4 relative z-10 group-hover/remove:rotate-12 transition-transform duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Star className="w-6 h-6 text-primary-600" />
                  My Reviews ({userStats.reviewCount})
                </h2>
                
                {/* Review Filters */}
                <select
                  value={reviewFilters.status}
                  onChange={(e) => setReviewFilters({ status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Reviews</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {reviewsLoading ? (
                <div className="space-y-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 animate-pulse" style={{animationDelay: `${index * 150}ms`}}>
                      {/* Product skeleton */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${120 + Math.random() * 80}px`}}></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${60 + Math.random() * 40}px`}}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 space-y-3">
                          {/* Rating and status skeleton */}
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-4 h-4 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded animate-pulse"></div>
                              ))}
                            </div>
                            <div className="w-16 h-5 bg-gradient-to-r from-green-200 to-green-300 rounded-full animate-pulse"></div>
                          </div>
                          
                          {/* Title skeleton */}
                          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${150 + Math.random() * 100}px`}}></div>
                          
                          {/* Comment skeleton */}
                          <div className="space-y-2">
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: '100%'}}></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: `${60 + Math.random() * 30}%`}}></div>
                          </div>
                          
                          {/* Date skeleton */}
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" style={{width: '80px'}}></div>
                        </div>
                        
                        {/* Action buttons skeleton */}
                        <div className="flex gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-blue-300 rounded animate-pulse"></div>
                          <div className="w-8 h-8 bg-gradient-to-r from-red-200 to-red-300 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                      <div className="relative">
                        <div className="w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-6 h-6 border-2 border-transparent border-t-amber-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                      </div>
                      <span className="text-amber-700 font-medium">Loading your reviews...</span>
                    </div>
                  </div>
                </div>
              ) : userReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-500">Share your experience with products you've purchased.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userReviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 rounded-xl p-6">
                      {/* Product Information */}
                      {review.product && (
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                          <img 
                            src={review.product.images?.[0]?.startsWith('http') ? review.product.images[0] : `http://localhost:5000${review.product.images?.[0] || '/assets/product-placeholder.svg'}`} 
                            alt={review.product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-medium text-gray-900">{review.product.name}</h3>
                            <p className="text-sm text-gray-500">₹{review.product.price}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800' :
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {review.status?.charAt(0).toUpperCase() + review.status?.slice(1)}
                            </span>
                          </div>
                          
                          {review.title && (
                            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                          )}
                          
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                          
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingReview(review._id)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {reviewsPagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
                      {/* Mobile: Compact pagination */}
                      <div className="flex sm:hidden items-center gap-2 w-full">
                        <button
                          onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={reviewsPagination.page === 1}
                          className="flex-1 group relative px-4 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium touch-manipulation"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm">Prev</span>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1 px-3 py-2 bg-primary-50 rounded-lg">
                          <span className="text-sm font-medium text-primary-700">{reviewsPagination.page}</span>
                          <span className="text-sm text-gray-500">of</span>
                          <span className="text-sm font-medium text-primary-700">{reviewsPagination.totalPages}</span>
                        </div>
                        
                        <button
                          onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={reviewsPagination.page === reviewsPagination.totalPages}
                          className="flex-1 group relative px-4 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium touch-manipulation"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm">Next</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </button>
                      </div>
                      
                      {/* Desktop: Enhanced pagination */}
                      <div className="hidden sm:flex items-center gap-3">
                        <button
                          onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={reviewsPagination.page === 1}
                          className="group relative px-6 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 font-medium overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 via-primary-200/0 to-primary-100/0 group-hover:from-primary-100/50 group-hover:via-primary-200/30 group-hover:to-primary-100/50 transition-all duration-500 rounded-xl"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                            <span className="group-hover:text-primary-700 transition-colors duration-300">Previous</span>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
                          <span className="text-sm font-medium text-primary-700">Page {reviewsPagination.page} of {reviewsPagination.totalPages}</span>
                        </div>
                        
                        <button
                          onClick={() => setReviewsPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                          disabled={reviewsPagination.page === reviewsPagination.totalPages}
                          className="group relative px-6 py-3 border border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none transition-all duration-300 font-medium overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/0 via-primary-200/0 to-primary-100/0 group-hover:from-primary-100/50 group-hover:via-primary-200/30 group-hover:to-primary-100/50 transition-all duration-500 rounded-xl"></div>
                          <div className="flex items-center gap-2 relative z-10">
                            <span className="group-hover:text-primary-700 transition-colors duration-300">Next</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Change Password */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  Change Password
                </h2>
                
                <div className="max-w-md space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordDataChange('currentPassword', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-3 sm:py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 touch-manipulation ${
                        passwordErrors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      placeholder="Enter current password"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span>
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordDataChange('newPassword', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-3 sm:py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 touch-manipulation ${
                        passwordErrors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span>
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordDataChange('confirmPassword', e.target.value)}
                      className={`w-full px-3 sm:px-4 py-3 sm:py-3 text-sm sm:text-base border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 touch-manipulation ${
                        passwordErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠</span>
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleChangePassword}
                    disabled={settingsLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full bg-primary-600 text-white px-4 sm:px-6 py-3 sm:py-3 text-sm sm:text-base rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {settingsLoading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </div>
              </div>
              
              {/* Notification Preferences */}
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2 sm:gap-3">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  Notification Preferences
                </h2>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.smsNotifications}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Order Updates</h3>
                      <p className="text-sm text-gray-500">Get notified about order status changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.orderUpdates}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, orderUpdates: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">Promotional Emails</h3>
                      <p className="text-sm text-gray-500">Receive offers and promotional content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.promotionalEmails}
                        onChange={(e) => setNotificationPrefs(prev => ({ ...prev, promotionalEmails: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleUpdateNotifications}
                    disabled={settingsLoading}
                    className="w-full sm:w-auto bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settingsLoading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Address Management Modal */}
      {showAddressManagement && (
        <AddressManagement
          onClose={() => setShowAddressManagement(false)}
        />
      )}
      
      {/* Track Order Popup */}
      {showTrackOrderPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Track Your Order</h3>
                    <p className="text-sm text-gray-500">Order ID: {showTrackOrderPopup}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrackOrderPopup(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="w-5 h-5 text-primary-600" />
                    <h4 className="font-semibold text-gray-900">Contact Support</h4>
                  </div>
                  <p className="text-gray-700 mb-3">
                    For detailed order tracking and updates, please contact our support team:
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="bg-white rounded-lg px-4 py-3 border-2 border-primary-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary-600" />
                        <span className="font-bold text-lg text-primary-700">7709897723</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Support available: Mon-Sat, 9 AM - 7 PM</span>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.open('tel:7709897723')}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </button>
                <button
                  onClick={() => setShowTrackOrderPopup(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;