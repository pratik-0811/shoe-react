import { api } from './api';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: Record<number, number>;
}

export interface ReviewImage {
  url: string;
  alt?: string;
  caption?: string;
  uploadedAt?: string;
  size?: number;
  mimeType?: string;
}

export interface ReviewData {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: ReviewImage[];
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  helpful: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  success: boolean;
  data: {
    reviews: ReviewData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalReviews: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
}

class ReviewService {
  // Get review statistics for a product
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    try {
      const response = await api.get(`/reviews/product/${productId}/stats`);
      return response.data.data;
    } catch (error) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {}
      };
    }
  }

  // Get reviews for a product with pagination
  async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 10,
    sort: string = '-createdAt'
  ): Promise<ReviewResponse> {
    try {
      const response = await api.get(
        `/reviews/product/${productId}?page=${page}&limit=${limit}&sort=${sort}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Submit a new review
  async submitReview(reviewData: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }): Promise<any> {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId: string): Promise<any> {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get bulk review stats for multiple products
  async getBulkProductReviewStats(productIds: string[]): Promise<Record<string, ReviewStats>> {
    try {
      const response = await api.post('/reviews/bulk/stats', { productIds });
      return response.data.data;
    } catch (error) {
      // Return empty stats for all products on error
      return productIds.reduce((acc, id) => {
        acc[id] = { averageRating: 0, totalReviews: 0 };
        return acc;
      }, {} as Record<string, ReviewStats>);
    }
  }

  // Get user's own reviews
  async getUserReviews(
    page: number = 1,
    limit: number = 10,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<{
    reviews: ReviewData[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalReviews: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    try {
      let url = `/reviews/my-reviews?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return {
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalReviews: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }

  // Get user's review count
  async getUserReviewCount(): Promise<number> {
    try {
      const response = await api.get('/reviews/my-reviews/count');
      return response.data.count;
    } catch (error) {
      return 0;
    }
  }

  // Update user's review
  async updateReview(
    reviewId: string,
    updateData: {
      rating?: number;
      title?: string;
      comment?: string;
    }
  ): Promise<ReviewData> {
    try {
      const response = await api.put(`/reviews/${reviewId}`, updateData);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete user's review
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get reviews with images only
  async getReviewsWithImages(
    page: number = 1,
    limit: number = 10,
    productId?: string
  ): Promise<ReviewData[]> {
    try {
      let endpoint = '/reviews/admin/all';
      const params: any = { page, limit, sort: '-createdAt', status: 'approved' };
      
      if (productId) {
        endpoint = `/reviews/product/${productId}`;
      }

      const response = await api.get(endpoint, { params });
      
      // Filter reviews that have images
      const reviews = response.data.data?.reviews || [];
      return reviews.filter((review: ReviewData) => 
        review.images && review.images.length > 0
      );
    } catch (error) {
      return [];
    }
  }

  // Create a new review with images
  async createReviewWithImages(
    reviewData: {
      productId: string;
      rating: number;
      title?: string;
      comment: string;
      images?: File[];
    }
  ): Promise<ReviewData> {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('productId', reviewData.productId);
      formData.append('rating', reviewData.rating.toString());
      formData.append('comment', reviewData.comment);
      
      if (reviewData.title) {
        formData.append('title', reviewData.title);
      }
      
      // Add image files
      if (reviewData.images && reviewData.images.length > 0) {
        reviewData.images.forEach((image) => {
          formData.append('images', image);
        });
      }
      
      const response = await api.post('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Validate image file
  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB'
      };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only JPEG, PNG, WebP, and GIF images are allowed'
      };
    }
    
    return { isValid: true };
  }

  // Validate multiple image files
  validateImageFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length > 5) {
      errors.push('Maximum 5 images allowed');
    }
    
    files.forEach((file, index) => {
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        errors.push(`Image ${index + 1}: ${validation.error}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

const reviewService = new ReviewService();
export default reviewService;