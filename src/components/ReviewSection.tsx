import React, { useState, useEffect, useCallback } from 'react';
import { Star, ThumbsUp, User, Calendar, CheckCircle, AlertCircle, LogIn, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

interface Review {
  _id: string;
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
  createdAt: string;
  formattedDate: string;
  timeAgo: string;
}

interface ReviewSectionProps {
  productId: string;
  averageRating?: number;
  totalReviews?: number;
  onReviewUpdate?: (stats: { averageRating: number; totalReviews: number }) => void;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  images: File[];
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  productId, 
  averageRating = 0, 
  totalReviews = 0,
  onReviewUpdate
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({});
  const { success, error: showError } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    images: []
  });
  
  const [formErrors, setFormErrors] = useState<Partial<ReviewFormData>>({});
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (formData.images.length + files.length > maxImages) {
      showError('Too Many Images', `You can only upload up to ${maxImages} images`);
      return;
    }
    
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        showError('File Too Large', `${file.name} is too large. Maximum size is 5MB`);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        showError('Invalid File Type', `${file.name} is not an image file`);
        return;
      }
      
      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
    
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // Remove image
  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Fetch reviews
  const fetchReviews = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/reviews/product/${productId}?page=${page}&limit=10&sort=-createdAt`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setReviews(data.data.reviews);
        } else {
          setReviews(prev => [...prev, ...data.data.reviews]);
        }
        
        setCurrentPage(data.data.pagination.currentPage);
        setTotalPages(data.data.pagination.totalPages);
        setHasNextPage(data.data.pagination.hasNextPage);
        setRatingDistribution(data.data.ratingDistribution || {});
      }
    } catch (error) {
      showError('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, showError]);

  useEffect(() => {
    if (productId) {
      fetchReviews(1);
    }
  }, [productId, fetchReviews]);

  // Load more reviews
  const loadMoreReviews = () => {
    if (hasNextPage && !loading) {
      fetchReviews(currentPage + 1);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<ReviewFormData> = {};
    
    if (!formData.comment.trim()) {
      errors.comment = 'Review comment is required';
    } else if (formData.comment.trim().length < 10) {
      errors.comment = 'Review must be at least 10 characters long';
    } else if (formData.comment.length > 2000) {
      errors.comment = 'Review cannot exceed 2000 characters';
    }
    
    if (formData.title && formData.title.length > 200) {
      errors.title = 'Title cannot exceed 200 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      showError('Authentication Required', 'Please log in to submit a review');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('productId', productId);
      formDataToSend.append('userId', user._id);
      formDataToSend.append('userName', user.name);
      formDataToSend.append('userEmail', user.email);
      formDataToSend.append('rating', formData.rating.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('comment', formData.comment);
      
      // Add images to FormData
      formData.images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });
      
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (data.success) {
        success('Review Submitted', 'Your review has been submitted and is pending approval');
        setShowForm(false);
        
        // Clean up preview URLs
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        
        setFormData({
          rating: 5,
          title: '',
          comment: '',
          images: []
        });
        setImagePreviewUrls([]);
        setFormErrors({});
        
        // Notify parent component of potential review stats change
        if (onReviewUpdate) {
          // Since the review is pending approval, we don't immediately update stats
          // But we could trigger a refetch of stats in the parent
          onReviewUpdate({ averageRating, totalReviews });
        }
      } else {
        showError('Error', data.message || 'Failed to submit review');
      }
    } catch (error) {
      showError('Error', 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark review as helpful
  const markHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/helpful`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(prev => prev.map(review => 
          review._id === reviewId 
            ? { ...review, helpful: data.data.helpful }
            : review
        ));
      }
    } catch (error) {
      // Silent fail for helpful marking
    }
  };

  // Render star rating
  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${size} ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution
  const renderRatingDistribution = () => {
    const total = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
    const safeAverageRating = averageRating || 0;
    const safeTotalReviews = totalReviews || 0;
    
    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{safeAverageRating.toFixed(1)}</div>
            <div className="flex items-center justify-center mb-1">
              {renderStars(Math.round(safeAverageRating), 'w-5 h-5')}
            </div>
            <div className="text-sm text-gray-600">{safeTotalReviews} reviews</div>
          </div>
          
          <div className="flex-1 max-w-md ml-8">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingDistribution[rating] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 w-8">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current mx-1" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-gray-800">Customer Reviews</h3>
        {isAuthenticated ? (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        ) : (
          <Link 
            to="/login"
            className="px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors flex items-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Login to Review</span>
          </Link>
        )}
      </div>

      {/* Rating Distribution */}
      {totalReviews > 0 && renderRatingDistribution()}

      {/* Review Form */}
      {showForm && isAuthenticated && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Write Your Review</h4>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Reviewing as:</span> {user?.name} ({user?.email})
            </p>
          </div>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating }))}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= formData.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Title (Optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Summarize your review"
                maxLength={200}
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Review *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  formErrors.comment ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Share your experience with this product..."
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                {formErrors.comment ? (
                  <p className="text-red-500 text-sm">{formErrors.comment}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Minimum 10 characters</p>
                )}
                <p className="text-gray-500 text-sm">
                  {formData.comment.length}/2000
                </p>
              </div>
            </div>
            
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Optional)
              </label>
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB (Max 5 images)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={formData.images.length >= 5}
                    />
                  </label>
                </div>
                
                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <OptimizedImage
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {formData.images.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {formData.images.length}/5 images selected
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary-950 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-800">{review.userName}</h4>
                        {review.userIsVerified && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified Customer</span>
                          </span>
                        )}
                        {review.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Verified Purchase</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                        {review.userJoinDate && (
                          <span>Member since {review.userJoinDate}</span>
                        )}
                        {review.userOrderCount > 0 && (
                          <span>{review.userOrderCount} orders</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{review.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                  )}
                  
                  <p className="text-gray-600 mb-3 whitespace-pre-wrap">{review.comment}</p>
                  
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => markHelpful(review._id)}
                      className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Load More Button */}
          {hasNextPage && (
            <div className="text-center pt-6">
              <button
                onClick={loadMoreReviews}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More Reviews</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No reviews yet. Be the first to write one!</p>
          {isAuthenticated ? (
            <button 
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              Write the First Review
            </button>
          ) : (
            <Link 
              to="/login"
              className="inline-flex items-center space-x-2 px-6 py-2 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to Write Review</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;