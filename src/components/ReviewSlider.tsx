import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, User, Calendar, Image as ImageIcon } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import reviewService from '../services/reviewService';

interface ReviewImage {
  url: string;
  alt?: string;
  caption?: string;
  uploadedAt?: string;
  size?: number;
  mimeType?: string;
}

interface Review {
  _id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: ReviewImage[];
  createdAt: string;
  helpful: number;
  verified: boolean;
  productId: string;
}

interface ReviewSliderProps {
  productId?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const ReviewSlider: React.FC<ReviewSliderProps> = ({
  productId,
  autoPlay = true,
  autoPlayInterval = 5000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedReviewIndex, setSelectedReviewIndex] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews with images
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const reviewsWithImages = await reviewService.getReviewsWithImages(1, 20, productId);
        setReviews(reviewsWithImages);
        setError(null);
      } catch (err) {
        setError('Failed to load reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const filteredReviews = reviews;

  const totalReviews = filteredReviews.length;

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || totalReviews <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalReviews);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, totalReviews]);

  // Show loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading reviews</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (totalReviews === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reviews with Images Yet</h3>
          <p className="text-gray-600">Be the first to share your experience with photos!</p>
        </div>
      </div>
    );
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalReviews);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalReviews) % totalReviews);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const openImageModal = (reviewIndex: number, imageIndex: number) => {
    setSelectedReviewIndex(reviewIndex);
    setSelectedImageIndex(imageIndex);
  };

  const closeImageModal = () => {
    setSelectedReviewIndex(null);
    setSelectedImageIndex(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (totalReviews === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">
          {showOnlyWithImages 
            ? 'No reviews with images yet. Be the first to share your photos!'
            : 'No reviews available yet.'}
        </p>
      </div>
    );
  }

  const currentReview = filteredReviews[currentIndex];

  const reviewsPerPage = 3;
  const totalPages = Math.ceil(totalReviews / reviewsPerPage);
  const currentPage = Math.floor(currentIndex / reviewsPerPage);
  const startIndex = currentPage * reviewsPerPage;
  const endIndex = Math.min(startIndex + reviewsPerPage, totalReviews);
  const currentReviews = filteredReviews.slice(startIndex, endIndex);

  return (
    <div className={`relative ${className}`}>
      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {currentReviews.map((review, index) => (
          <div key={review._id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
            {/* User Info */}
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                {review.userAvatar ? (
                  <OptimizedImage
                    src={review.userAvatar}
                    alt={review.userName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm truncate">{review.userName}</h4>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">{renderStars(review.rating)}</div>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h5 className="font-medium text-gray-900 mb-2 text-sm line-clamp-1">{review.title}</h5>
            )}

            {/* Review Comment */}
            <p className="text-gray-700 mb-3 text-sm leading-relaxed line-clamp-3">{review.comment}</p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {review.images.slice(0, 2).map((image, imageIndex) => (
                  <div
                    key={imageIndex}
                    className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openImageModal(startIndex + index, imageIndex)}
                  >
                    <OptimizedImage
                      src={`${(import.meta.env.VITE_APP_API_URL || 'http://localhost:5000')}${image.url}`}
                      alt={image.alt || `Review image ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {review.images!.length > 2 && imageIndex === 1 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium text-xs">
                          +{review.images!.length - 2}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Helpful Count */}
            {review.helpful > 0 && (
              <div className="text-xs text-gray-500">
                {review.helpful} people found this helpful
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {totalPages > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={() => setCurrentIndex(Math.max(0, (currentPage - 1) * reviewsPerPage))}
            disabled={currentPage === 0}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentIndex(Math.min(totalReviews - 1, (currentPage + 1) * reviewsPerPage))}
            disabled={currentPage === totalPages - 1}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* Page Indicator */}
          <div className="flex justify-center items-center space-x-2 mt-4">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * reviewsPerPage)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentPage ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-2">
              {currentPage + 1} of {totalPages}
            </span>
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedReviewIndex !== null && selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              aria-label="Close image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <OptimizedImage
              src={`${(import.meta.env.VITE_APP_API_URL || 'http://localhost:5000')}${filteredReviews[selectedReviewIndex].images![selectedImageIndex].url}`}
              alt={filteredReviews[selectedReviewIndex].images![selectedImageIndex].alt || 'Review image'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {filteredReviews[selectedReviewIndex].images![selectedImageIndex].caption && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded">
                {filteredReviews[selectedReviewIndex].images![selectedImageIndex].caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSlider;