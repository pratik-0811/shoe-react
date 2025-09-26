import React, { useState, useEffect } from 'react';
import { Star, Eye, Check, X, Edit, Trash2, MessageSquare, User, Calendar, Filter, Search, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface Review {
  _id: string;
  productId: {
    _id: string;
    name: string;
    image: string;
  };
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  helpful: number;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  moderatorId?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  formattedDate: string;
  timeAgo: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}

const ReviewManagement: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    // Only make API calls if authentication is loaded and user is authenticated admin
    if (!authLoading && isAuthenticated && user?.isAdmin) {
      fetchReviews();
      fetchStats();
    }
  }, [currentPage, searchTerm, statusFilter, ratingFilter, isAuthenticated, user, authLoading]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sort: '-createdAt'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter !== 'all') params.append('rating', ratingFilter);

      const response = await api.get(`/reviews/admin/all?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setReviews(response.data.data.reviews);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      // Silent fail - error handled by UI state
      setError('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/reviews/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      // Silent fail - stats not critical for UI
    }
  };

  const updateReviewStatus = async (reviewId: string, status: 'approved' | 'rejected', notes = '') => {
    try {
      const response = await api.put(`/reviews/admin/${reviewId}/status`, {
        status,
        moderatorNotes: notes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        fetchReviews();
        fetchStats();
        setSelectedReviews([]);
      }
    } catch (error) {
      // Silent fail - error handled by UI state
      setError('Failed to update review status');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        fetchReviews();
        fetchStats();
        setSelectedReviews([]);
      }
    } catch (error) {
      // Silent fail - error handled by UI state
      setError('Failed to delete review');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedReviews.length === 0) return;

    if (bulkAction === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedReviews.length} reviews? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      const endpoint = bulkAction === 'approve' ? '/reviews/admin/bulk/approve' : '/reviews/admin/bulk/reject';
      const response = await api.put(endpoint, {
        reviewIds: selectedReviews,
        moderatorNotes: moderatorNotes
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        fetchReviews();
        fetchStats();
        setSelectedReviews([]);
        setBulkAction('');
        setModeratorNotes('');
      }
    } catch (error) {
      // Silent fail - error handled by UI state
      setError('Failed to perform bulk action');
    }
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(review => review._id));
    }
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Management</h1>
        <p className="text-gray-600">Manage customer reviews and ratings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRatingFilter('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
          
          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedReviews.length} review{selectedReviews.length !== 1 ? 's' : ''} selected
              </span>
              
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Action</option>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
                <option value="delete">Delete</option>
              </select>
              
              {(bulkAction === 'approve' || bulkAction === 'reject') && (
                <input
                  type="text"
                  placeholder="Moderator notes (optional)"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  className="px-3 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              
              <button
                onClick={() => {
                  setSelectedReviews([]);
                  setBulkAction('');
                  setModeratorNotes('');
                }}
                className="px-4 py-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Loading reviews...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchReviews}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === reviews.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review._id)}
                          onChange={() => handleSelectReview(review._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {review.productId ? (
                            <>
                              <img
                                src={review.productId.image}
                                alt={review.productId.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                  {review.productId.name}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-gray-200 mr-3 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">N/A</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500 truncate max-w-xs">
                                  Product not found
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {review.userAvatar ? (
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                            <p className="text-xs text-gray-500">{review.userEmail}</p>
                            {review.verified && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">({review.rating})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {review.title && (
                            <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                              {review.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {review.comment}
                          </p>
                          {review.helpful > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {review.helpful} found helpful
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(review.status)}
                        {review.moderatorNotes && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            Note: {review.moderatorNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{review.formattedDate}</div>
                        <div className="text-xs text-gray-500">{review.timeAgo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateReviewStatus(review._id, 'approved')}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateReviewStatus(review._id, 'rejected')}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setEditingReview(review);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteReview(review._id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewManagement;