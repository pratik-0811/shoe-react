const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for review images
const reviewImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/reviews');
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
    }
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer for review images
const uploadReviewImages = multer({
  storage: reviewImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  }
});

// Middleware for handling review image uploads
const handleReviewImageUpload = (req, res, next) => {
  const upload = uploadReviewImages.array('images', 5);
  
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum 5MB per image allowed.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 images allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Process uploaded files and add to request body
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: req.body[`alt_${file.fieldname}`] || '',
        caption: req.body[`caption_${file.fieldname}`] || '',
        size: file.size,
        mimeType: file.mimetype,
        originalName: file.originalname
      }));
    }
    
    next();
  });
};

// Middleware for cleaning up uploaded files on error
const cleanupUploadedFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If there's an error and files were uploaded, clean them up
    if (res.statusCode >= 400 && req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Utility function to delete review images
const deleteReviewImages = (images) => {
  if (!images || !Array.isArray(images)) return;
  
  images.forEach(image => {
    if (image.url && image.url.startsWith('/uploads/reviews/')) {
      const filePath = path.join(__dirname, '../', image.url);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Error deleting review image:', err);
        }
      });
    }
  });
};

module.exports = {
  handleReviewImageUpload,
  cleanupUploadedFiles,
  deleteReviewImages
};