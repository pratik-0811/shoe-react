const Review = require('../models/review.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// Helper function for sending consistent JSON responses
const sendResponse = (res, statusCode, success, message, data = {}) => {
  res.status(statusCode).json({ success, message, ...data });
};
 
// Create a new review
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const user = req.user;

    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', { errors: errors.array() });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ userId: user._id, productId });
    if (existingReview) {
      return sendResponse(res, 400, false, 'You have already reviewed this product');
    }

    // Process uploaded images
    const processedImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        processedImages.push({
          url: `/uploads/reviews/${file.filename}`,
          alt: `Review image for ${product.name}`,
          caption: ''
        });
      });
    }

    // Create new review with comprehensive user details
    const review = new Review({
      productId,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userAvatar: user?.avatar,
      rating,
      title,
      comment,
      images: processedImages,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userJoinDate: user?.joinDate,
      userOrderCount: user?.orders?.length || 0,
      userIsVerified: (user?.orders?.length || 0) > 0,
    });

    await review.save();

    // Update product rating if review is auto-approved
    if (review.status === 'approved') {
      await Product.updateProductRating(review.productId);
    }

    sendResponse(res, 201, true, 'Review submitted successfully and is pending approval', { data: review });
  } catch (error) {
    console.error('Error creating review:', error);
    sendResponse(res, 500, false, 'Failed to create review', { error: error.message });
  }
};

// Get reviews for a product (only approved reviews for public)
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return sendResponse(res, 400, false, 'Invalid product ID');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ productId, status: 'approved' })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-ipAddress -userAgent -moderatorNotes -editHistory');

    const totalReviews = await Review.countDocuments({ productId, status: 'approved' });
    const [averageData, ratingDistribution] = await Promise.all([
      Review.getAverageRating(productId),
      Review.getRatingDistribution(productId),
    ]);

    sendResponse(res, 200, true, 'Reviews fetched successfully', {
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasNextPage: skip + reviews.length < totalReviews,
          hasPrevPage: parseInt(page) > 1,
        },
        averageRating: averageData?.averageRating || 0,
        totalApprovedReviews: averageData?.totalReviews || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    sendResponse(res, 500, false, 'Failed to fetch reviews', { error: error.message });
  }
};

// Get review statistics for a product
const getProductReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return sendResponse(res, 400, false, 'Invalid product ID');
    }

    const [averageData, ratingDistribution] = await Promise.all([
      Review.getAverageRating(productId),
      Review.getRatingDistribution(productId),
    ]);

    sendResponse(res, 200, true, 'Review stats fetched successfully', {
      data: {
        averageRating: averageData?.averageRating || 0,
        totalReviews: averageData?.totalReviews || 0,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching product review stats:', error);
    sendResponse(res, 500, false, 'Failed to fetch review stats', { error: error.message });
  }
};

// Get bulk review statistics for multiple products
const getBulkProductReviewStats = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return sendResponse(res, 400, false, 'Product IDs array is required');
    }

    const validProductIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validProductIds.length === 0) {
      return sendResponse(res, 400, false, 'No valid product IDs provided');
    }

    const stats = {};
    await Promise.all(
      validProductIds.map(async (productId) => {
        try {
          const averageData = await Review.getAverageRating(productId);
          stats[productId] = {
            averageRating: averageData?.averageRating || 0,
            totalReviews: averageData?.totalReviews || 0,
          };
        } catch (error) {
          console.error(`Error getting stats for product ${productId}:`, error);
          stats[productId] = { averageRating: 0, totalReviews: 0 };
        }
      })
    );

    sendResponse(res, 200, true, 'Bulk review stats fetched successfully', { data: stats });
  } catch (error) {
    console.error('Error fetching bulk review stats:', error);
    sendResponse(res, 500, false, 'Failed to fetch bulk review stats', { error: error.message });
  }
};

// Get all reviews for admin (with filtering)
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, productId, rating, sort = '-createdAt' } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      filter.productId = productId;
    }
    if (rating) filter.rating = parseInt(rating);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalReviews, statusCounts] = await Promise.all([
      Review.find(filter)
        .populate({
          path: 'productId',
          select: 'name image brand',
          match: { _id: { $ne: null } }
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments(filter),
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const counts = { pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach((item) => (counts[item._id] = item.count));

    sendResponse(res, 200, true, 'All reviews fetched successfully', {
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasNextPage: skip + reviews.length < totalReviews,
          hasPrevPage: parseInt(page) > 1,
        },
        statusCounts: counts,
      },
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    sendResponse(res, 500, false, 'Failed to fetch reviews', { error: error.message });
  }
};

// Update review status (approve/reject)
const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderatorNotes } = req.body;
    const moderatorId = req.user?.id || req.body.moderatorId;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status. Must be approved, rejected, or pending');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    const oldStatus = review.status;
    review.status = status;
    review.moderatorId = moderatorId;
    if (moderatorNotes) {
      review.moderatorNotes = moderatorNotes;
    }

    await review.save();

    // Only update product rating if status has changed to or from approved
    if (oldStatus !== status && (oldStatus === 'approved' || status === 'approved')) {
      await Product.updateProductRating(review.productId);
    }

    sendResponse(res, 200, true, `Review ${status} successfully`, { data: review });
  } catch (error) {
    console.error('Error updating review status:', error);
    sendResponse(res, 500, false, 'Failed to update review status', { error: error.message });
  }
};

// Edit review content (admin only)
const editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, reason } = req.body;
    const editorId = req.user?.id || req.body.editorId;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    const editRecord = {
      editedAt: new Date(),
      editedBy: editorId,
      previousComment: review.comment,
      previousRating: review.rating,
      reason: reason || 'Admin edit',
    };

    review.editHistory.push(editRecord);

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    
    // Recalculate rating if the review being edited is approved
    if (review.status === 'approved') {
      await Product.updateProductRating(review.productId);
    }

    sendResponse(res, 200, true, 'Review updated successfully', { data: review });
  } catch (error) {
    console.error('Error editing review:', error);
    sendResponse(res, 500, false, 'Failed to edit review', { error: error.message });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    // Update product rating after deletion if the deleted review was approved
    if (review.status === 'approved') {
      await Product.updateProductRating(review.productId);
    }

    sendResponse(res, 200, true, 'Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    sendResponse(res, 500, false, 'Failed to delete review', { error: error.message });
  }
};

// Get single review by ID
const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    const review = await Review.findById(reviewId).populate({
      path: 'productId',
      select: 'name image brand',
      match: { _id: { $ne: null } }
    });
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    sendResponse(res, 200, true, 'Review fetched successfully', { data: review });
  } catch (error) {
    console.error('Error fetching review:', error);
    sendResponse(res, 500, false, 'Failed to fetch review', { error: error.message });
  }
};

// Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return sendResponse(res, 404, false, 'Review not found');
    }

    if (review.status !== 'approved') {
      return sendResponse(res, 400, false, 'Can only mark approved reviews as helpful');
    }

    review.helpful += 1;
    await review.save();

    sendResponse(res, 200, true, 'Review marked as helpful', { data: { helpful: review.helpful } });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    sendResponse(res, 500, false, 'Failed to mark review as helpful', { error: error.message });
  }
};

// Get user's own reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    // Build query
    const query = { userId };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Get reviews with product details
    const reviews = await Review.find(query)
      .populate({
        path: 'productId',
        select: 'name images price',
        match: { _id: { $exists: true, $ne: null } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);
    
    // Format reviews to match frontend expectations
    const formattedReviews = reviews.map(review => ({
      ...review,
      product: review.productId
    }));
    
    sendResponse(res, 200, true, 'User reviews fetched successfully', {
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    sendResponse(res, 500, false, 'Failed to fetch user reviews', { error: error.message });
  }
};

// Get user's review count
const getUserReviewCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Review.countDocuments({ userId });
    
    sendResponse(res, 200, true, 'User review count fetched successfully', {
      count
    });
    
  } catch (error) {
    console.error('Error fetching user review count:', error);
    sendResponse(res, 500, false, 'Failed to fetch user review count', { error: error.message });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getProductReviewStats,
  getBulkProductReviewStats,
  getAllReviews,
  updateReviewStatus,
  editReview,
  deleteReview,
  getReviewById,
  markHelpful,
  getUserReviews,
  getUserReviewCount,
};