const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");
const { uploadRateLimit, checkTokenBlacklist } = require("../middleware/security.middleware");
const {
  productImageUpload,
  bannerImageUpload,
  avatarImageUpload,
  getFileUrl,
  deleteFile,
  getFilenameFromUrl,
  optimizeImage,
  generateSecureFilename
} = require("../config/multer.config");
const path = require('path');

// Product image upload (Admin only)
router.post('/products', uploadRateLimit, checkTokenBlacklist, verifyToken, isAdmin, asyncHandler(async (req, res) => {
  productImageUpload.array('images', 5)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading product images' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No images uploaded' 
      });
    }

    try {
      // Optimize images
      const optimizedFiles = [];
      for (const file of req.files) {
        const originalPath = file.path;
        const optimizedFilename = generateSecureFilename(file.originalname, 'product');
        const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
        
        const optimized = await optimizeImage(originalPath, optimizedPath, {
          width: 800,
          quality: 85
        });
        
        if (optimized) {
          optimizedFiles.push({
            filename: optimizedFilename,
            originalName: file.originalname,
            size: file.size,
            url: getFileUrl(req, optimizedFilename, 'products')
          });
        }
      }
      
      const imageUrls = optimizedFiles.map(file => file.url);
      
      res.json({
        success: true,
        message: 'Product images uploaded and optimized successfully',
        images: imageUrls,
        files: optimizedFiles
      });
    } catch (error) {
      console.error('Image optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error optimizing images'
      });
    }
  });
}));

// Banner image upload (Admin only)
router.post('/banners', uploadRateLimit, checkTokenBlacklist, verifyToken, isAdmin, asyncHandler(async (req, res) => {
  bannerImageUpload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading banner image' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    try {
      const originalPath = req.file.path;
      const optimizedFilename = generateSecureFilename(req.file.originalname, 'banner');
      const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
      
      const optimized = await optimizeImage(originalPath, optimizedPath, {
        width: 1200,
        quality: 90
      });
      
      if (!optimized) {
        return res.status(500).json({
          success: false,
          message: 'Error optimizing banner image'
        });
      }
      
      const imageUrl = getFileUrl(req, optimizedFilename, 'banners');
      
      res.json({
        success: true,
        message: 'Banner image uploaded and optimized successfully',
        image: imageUrl,
        file: {
          filename: optimizedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: imageUrl
        }
      });
    } catch (error) {
      console.error('Banner optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error optimizing banner image'
      });
    }
  });
}));

// Category image upload (Admin only)
router.post('/categories', uploadRateLimit, checkTokenBlacklist, verifyToken, isAdmin, asyncHandler(async (req, res) => {
  bannerImageUpload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading category image' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    try {
      const originalPath = req.file.path;
      const optimizedFilename = generateSecureFilename(req.file.originalname, 'category');
      const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
      
      const optimized = await optimizeImage(originalPath, optimizedPath, {
        width: 600,
        quality: 85
      });
      
      if (!optimized) {
        return res.status(500).json({
          success: false,
          message: 'Error optimizing category image'
        });
      }
      
      const imageUrl = getFileUrl(req, optimizedFilename, 'banners');
      
      res.json({
        success: true,
        message: 'Category image uploaded and optimized successfully',
        image: imageUrl,
        file: {
          filename: optimizedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: imageUrl
        }
      });
    } catch (error) {
      console.error('Category optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error optimizing category image'
      });
    }
  });
}));

// Avatar image upload (Authenticated users)
router.post('/avatars', uploadRateLimit, checkTokenBlacklist, verifyToken, asyncHandler(async (req, res) => {
  avatarImageUpload.single('avatar')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'Error uploading avatar image' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    try {
      const originalPath = req.file.path;
      const optimizedFilename = generateSecureFilename(req.file.originalname, 'avatar');
      const optimizedPath = path.join(path.dirname(originalPath), optimizedFilename);
      
      const optimized = await optimizeImage(originalPath, optimizedPath, {
        width: 200,
        quality: 80
      });
      
      if (!optimized) {
        return res.status(500).json({
          success: false,
          message: 'Error optimizing avatar image'
        });
      }
      
      const imageUrl = getFileUrl(req, optimizedFilename, 'avatars');
      
      res.json({
        success: true,
        message: 'Avatar image uploaded and optimized successfully',
        image: imageUrl,
        file: {
          filename: optimizedFilename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: imageUrl
        }
      });
    } catch (error) {
      console.error('Avatar optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Error optimizing avatar image'
      });
    }
  });
}));

// Delete uploaded image (Admin only for products/banners, users for their avatars)
router.delete('/:type/:filename', verifyToken, asyncHandler(async (req, res) => {
  const { type, filename } = req.params;
  const { user } = req;

  // Validate upload type
  if (!['products', 'banners', 'avatars', 'categories'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload type'
    });
  }

  // Check permissions
  if ((type === 'products' || type === 'banners' || type === 'categories') && !user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  const filePath = path.join(__dirname, '..', 'uploads', type, filename);
  const deleted = deleteFile(filePath);

  if (deleted) {
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Image not found or could not be deleted'
    });
  }
}));

// Get upload info
router.get('/info', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    limits: {
      products: {
        maxFiles: 5,
        maxSize: '5MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      banners: {
        maxFiles: 1,
        maxSize: '10MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      avatars: {
        maxFiles: 1,
        maxSize: '2MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      categories: {
        maxFiles: 1,
        maxSize: '5MB',
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    }
  });
}));

module.exports = router;