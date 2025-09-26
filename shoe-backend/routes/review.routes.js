const express = require('express');
const router = express.Router();
const {
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
  getUserReviewCount
} = require('../controllers/review.controller');
const { validateReview } = require('../middleware/validation.middleware');
const { handleReviewImageUpload, cleanupUploadedFiles } = require('../middleware/upload.middleware');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Using proper validation and auth middleware from imported modules

// Public routes

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all approved reviews for a product
 * @access  Public
 * @params  productId (URL parameter)
 * @query   page, limit, sort
 */
router.get('/product/:productId', getProductReviews);

/**
 * @route   GET /api/reviews/product/:productId/stats
 * @desc    Get review statistics for a product
 * @access  Public
 * @params  productId (URL parameter)
 */
router.get('/product/:productId/stats', getProductReviewStats);

/**
 * @route   POST /api/reviews/bulk/stats
 * @desc    Get bulk review statistics for multiple products
 * @access  Public
 * @body    { productIds: string[] }
 */
router.post('/bulk/stats', getBulkProductReviewStats);

// User routes (require authentication)

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 * @body    { productId, rating, title?, comment, images? }
 */
router.post('/', verifyToken, cleanupUploadedFiles, handleReviewImageUpload, validateReview, createReview);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get user's own reviews
 * @access  Private
 * @query   page, limit, status
 */
router.get('/my-reviews', verifyToken, getUserReviews);

/**
 * @route   GET /api/reviews/my-reviews/count
 * @desc    Get user's review count
 * @access  Private
 */
router.get('/my-reviews/count', verifyToken, getUserReviewCount);

/**
 * @route   GET /api/reviews/:reviewId
 * @desc    Get single review by ID
 * @access  Public (only approved reviews)
 */
router.get('/:reviewId', getReviewById);

/**
 * @route   POST /api/reviews/:reviewId/helpful
 * @desc    Mark a review as helpful
 * @access  Public
 */
router.post('/:reviewId/helpful', markHelpful);

// Admin routes (require admin authentication)

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews with filtering (for admin)
 * @access  Admin
 * @query   page, limit, status, productId, rating, sort
 */
router.get('/admin/all', verifyToken, isAdmin, getAllReviews);

/**
 * @route   PUT /api/reviews/admin/:reviewId/status
 * @desc    Update review status (approve/reject/pending)
 * @access  Admin
 * @body    { status, moderatorNotes?, moderatorId?, isAdmin: true }
 */
router.put('/admin/:reviewId/status', verifyToken, isAdmin, updateReviewStatus);

/**
 * @route   PUT /api/reviews/admin/:reviewId/edit
 * @desc    Edit review content
 * @access  Admin
 * @body    { rating?, title?, comment?, reason?, editorId?, isAdmin: true }
 */
router.put('/admin/:reviewId/edit', verifyToken, isAdmin, editReview);

/**
 * @route   DELETE /api/reviews/admin/:reviewId
 * @desc    Delete a review
 * @access  Admin
 * @body    { isAdmin: true }
 */
router.delete('/admin/:reviewId', verifyToken, isAdmin, deleteReview);

// Bulk operations for admin

/**
 * @route   PUT /api/reviews/admin/bulk/approve
 * @desc    Approve multiple reviews
 * @access  Admin
 * @body    { reviewIds: [], moderatorNotes?, isAdmin: true }
 */
router.put('/admin/bulk/approve', verifyToken, isAdmin, async (req, res) => {
  try {
    const { reviewIds, moderatorNotes } = req.body;
    const moderatorId = req.user.id;
    
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'reviewIds array is required'
      });
    }
    
    const Review = require('../models/review.model');
    
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { 
        status: 'approved',
        moderatorId,
        moderatorNotes: moderatorNotes || '',
        approvedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} reviews approved successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
    
  } catch (error) {
    console.error('Error bulk approving reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve reviews',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/reviews/admin/bulk/reject
 * @desc    Reject multiple reviews
 * @access  Admin
 * @body    { reviewIds: [], moderatorNotes?, isAdmin: true }
 */
router.put('/admin/bulk/reject', verifyToken, isAdmin, async (req, res) => {
  try {
    const { reviewIds, moderatorNotes } = req.body;
    const moderatorId = req.user.id;
    
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'reviewIds array is required'
      });
    }
    
    const Review = require('../models/review.model');
    
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { 
        status: 'rejected',
        moderatorId,
        moderatorNotes: moderatorNotes || '',
        rejectedAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} reviews rejected successfully`,
      data: { modifiedCount: result.modifiedCount }
    });
    
  } catch (error) {
    console.error('Error bulk rejecting reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject reviews',
      error: error.message
    });
  }
});

// Statistics endpoint for admin dashboard

/**
 * @route   GET /api/reviews/admin/stats
 * @desc    Get review statistics
 * @access  Admin
 */
router.get('/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const Review = require('../models/review.model');
    
    const stats = await Review.aggregate([
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          ratingCounts: [
            { $match: { status: 'approved' } },
            { $group: { _id: '$rating', count: { $sum: 1 } } }
          ],
          recentReviews: [
            { $match: { status: 'pending' } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
              }
            },
            { $match: { 'product.0': { $exists: true } } }
          ],
          averageRating: [
            { $match: { status: 'approved' } },
            { $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);
    
    const result = stats[0];
    
    // Format status counts
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    result.statusCounts.forEach(item => {
      statusCounts[item._id] = item.count;
    });
    
    // Format rating counts
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result.ratingCounts.forEach(item => {
      ratingCounts[item._id] = item.count;
    });
    
    res.json({
      success: true,
      data: {
        statusCounts,
        ratingCounts,
        recentPendingReviews: result.recentReviews,
        averageRating: result.averageRating[0]?.avgRating || 0,
        totalApprovedReviews: result.averageRating[0]?.totalReviews || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message
    });
  }
});

module.exports = router;