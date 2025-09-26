import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import BannerManagement from './BannerManagement';
import AbandonedCartManagement from './AbandonedCartManagement';
import CategoryManagement from './CategoryManagement';
import ReviewManagement from './ReviewManagement';
import CouponManagement from './CouponManagement';

type TabType = 'dashboard' | 'products' | 'categories' | 'orders' | 'banners' | 'abandoned-carts' | 'reviews' | 'coupons';

const AdminDashboard: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: '📊' },
    { id: 'products' as TabType, label: 'Products', icon: '👟' },
    { id: 'categories' as TabType, label: 'Categories', icon: '📂' },
    { id: 'orders' as TabType, label: 'Orders', icon: '📦' },
    { id: 'reviews' as TabType, label: 'Reviews', icon: '⭐' },
    { id: 'coupons' as TabType, label: 'Coupons', icon: '🎫' },
    { id: 'banners' as TabType, label: 'Banners', icon: '🎨' },
    { id: 'abandoned-carts' as TabType, label: 'Abandoned Carts', icon: '🛒' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'coupons':
        return <CouponManagement />;
      case 'banners':
        return <BannerManagement />;
      case 'abandoned-carts':
        return <AbandonedCartManagement />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;