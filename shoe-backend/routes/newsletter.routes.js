const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getAllSubscribers, getStats } = require('../controllers/newsletter.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { validateNewsletter } = require('../middleware/validation.middleware');
const rateLimit = require('express-rate-limit');

// Rate limiting for newsletter operations
const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many newsletter requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/subscribe', newsletterLimiter, validateNewsletter, subscribe);
router.post('/unsubscribe', newsletterLimiter, unsubscribe);

// Admin routes
router.get('/subscribers', verifyToken, isAdmin, getAllSubscribers);
router.get('/stats', verifyToken, isAdmin, getStats);

module.exports = router;