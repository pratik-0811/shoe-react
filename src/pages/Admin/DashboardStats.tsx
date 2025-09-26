import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Stats {
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
    categories: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  };
  abandonedCarts: {
    total: number;
    recovered: number;
    totalValue: number;
    recoveryRate: number;
  };
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [productStats, orderStats, abandonedCartStats] = await Promise.all([
        api.get('/products/admin/stats'),
        api.get('/orders/admin/stats'),
        api.get('/abandoned-carts/admin/stats')
      ]);

      setStats({
        products: productStats.data,
        orders: orderStats.data,
        abandonedCarts: abandonedCartStats.data
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Products',
      value: stats.products.total,
      icon: '👟',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'In Stock',
      value: stats.products.inStock,
      icon: '✅',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Out of Stock',
      value: stats.products.outOfStock,
      icon: '❌',
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Low Stock',
      value: stats.products.lowStock,
      icon: '⚠️',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Orders',
      value: stats.orders.total,
      icon: '📦',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pending Orders',
      value: stats.orders.pending,
      icon: '⏳',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.orders.totalRevenue.toLocaleString()}`,
      icon: '💰',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    {
      title: 'Abandoned Carts',
      value: stats.abandonedCarts.total,
      icon: '🛒',
      color: 'bg-gray-500',
      textColor: 'text-gray-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
        <p className="text-gray-600">Monitor your store's performance and key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', value: stats.orders.pending, color: 'bg-yellow-500' },
              { label: 'Processing', value: stats.orders.processing, color: 'bg-blue-500' },
              { label: 'Shipped', value: stats.orders.shipped, color: 'bg-purple-500' },
              { label: 'Delivered', value: stats.orders.delivered, color: 'bg-green-500' },
              { label: 'Cancelled', value: stats.orders.cancelled, color: 'bg-red-500' }
            ].map((status) => (
              <div key={status.label} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-700">{status.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{status.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Abandoned Cart Recovery</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Abandoned</span>
              <span className="text-lg font-semibold text-gray-900">{stats.abandonedCarts.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Recovered</span>
              <span className="text-lg font-semibold text-green-600">{stats.abandonedCarts.recovered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Recovery Rate</span>
              <span className="text-lg font-semibold text-blue-600">
                {stats.abandonedCarts.recoveryRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Value</span>
              <span className="text-lg font-semibold text-purple-600">
                ${stats.abandonedCarts.totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;