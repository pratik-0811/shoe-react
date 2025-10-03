const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }))
    });
  }
  next();
};

// Product validation rules
exports.validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('image')
    .optional()
    .isString()
    .withMessage('Product image must be a string'),
  body('category')
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),
  body('brand')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('gender')
    .isIn(['Men', 'Women', 'Unisex', 'Kids'])
    .withMessage('Gender must be one of: Men, Women, Unisex, Kids'),
  body('material')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Material cannot exceed 100 characters'),
  body('style')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Style cannot exceed 100 characters'),
  body('season')
    .optional()
    .isIn(['Spring', 'Summer', 'Fall', 'Winter', 'All Season'])
    .withMessage('Season must be one of: Spring, Summer, Fall, Winter, All Season'),
  body('sizes')
    .optional()
    .isArray()
    .withMessage('Sizes must be an array'),
  body('sizes.*.size')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Size value is required'),
  body('sizes.*.stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Size stock must be a non-negative integer'),
  body('colors')
    .optional()
    .isArray()
    .withMessage('Colors must be an array'),
  body('colors.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Color name is required'),
  body('colors.*.hexCode')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color hex code must be a valid hex color (e.g., #FF0000)'),
  body('colors.*.stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Color stock must be a non-negative integer'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('countInStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock count must be a non-negative integer'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be between 0 and 5'),
  body('badge')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Badge cannot exceed 50 characters'),
  exports.handleValidationErrors
];

// User registration validation
exports.validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  exports.handleValidationErrors
];

// User login validation
exports.validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  exports.handleValidationErrors
];

// Category validation
exports.validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('parentCategory')
    .optional()
    .custom(value => {
      if (value && value !== '' && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Parent category must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  exports.handleValidationErrors
];

// Order validation
exports.validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('items.*.size')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Size must be between 1 and 10 characters'),
  body('items.*.color')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Color must be between 1 and 50 characters'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('shippingAddress.postalCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  exports.handleValidationErrors
];

// Review validation
exports.validateReview = [
  body('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Comment must be between 10 and 2000 characters'),
  exports.handleValidationErrors
];

// MongoDB ObjectId validation
exports.validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  exports.handleValidationErrors
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  exports.handleValidationErrors
];

// Payment validation
exports.validatePayment = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Razorpay order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Razorpay payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Razorpay signature is required'),
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address is required'),
  body('shippingAddress.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Street address must be between 5 and 200 characters'),
  body('shippingAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('shippingAddress.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('shippingAddress.zipCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Zip code must be between 3 and 20 characters'),
  body('shippingAddress.country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  exports.handleValidationErrors
];

// Search validation
exports.validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  exports.handleValidationErrors
];

// Newsletter validation
exports.validateNewsletter = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  exports.handleValidationErrors
];

// Coupon validation
exports.validateCoupon = [
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Coupon code must be 3-20 characters, uppercase letters and numbers only'),
  body('type')
    .isIn(['flat', 'percentage'])
    .withMessage('Coupon type must be either flat or percentage'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Coupon value must be a positive number'),
  body('minPurchaseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase amount must be a positive number'),
  body('maxDiscountAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount amount must be a positive number'),
  body('expiryDate')
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  exports.handleValidationErrors
];

// Address validation
exports.validateAddress = [
  body('type')
    .isIn(['home', 'office', 'other'])
    .withMessage('Address type must be home, office, or other'),
  body('label')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Address label must be between 1 and 50 characters'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  body('addressLine1')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),
  body('addressLine2')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 cannot exceed 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('postalCode')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Postal code must be between 3 and 20 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),
  exports.handleValidationErrors
];

// File upload validation
exports.validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const file = req.file || (req.files && req.files[0]);
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed' 
    });
  }
  
  if (file.size > maxSize) {
    return res.status(400).json({ 
      message: 'File too large. Maximum size is 5MB' 
    });
  }
  
  next();
};