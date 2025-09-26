const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const crypto = require('crypto');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configure storage for different types of uploads
const createStorage = (uploadPath) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(__dirname, '..', 'uploads', uploadPath);
      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      cb(null, filename);
    }
  });
};

// Enhanced file filter for images with security checks
const imageFilter = (req, file, cb) => {
  // Check if file is an image
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  
  // Check allowed image types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed!'), false);
  }
  
  // Check file extension matches MIME type
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Invalid file extension!'), false);
  }
  
  cb(null, true);
};

// Image optimization function
const optimizeImage = async (inputPath, outputPath, options = {}) => {
  try {
    const { width = 800, quality = 80, format = 'webp' } = options;
    
    await sharp(inputPath)
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality })
      .toFile(outputPath);
      
    // Delete original file after optimization
    fs.unlinkSync(inputPath);
    return true;
  } catch (error) {
    console.error('Image optimization error:', error);
    return false;
  }
};

// Configure multer for different upload types with optimization
const productImageUpload = multer({
  storage: createStorage('products'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (before optimization)
    files: 5, // Maximum 5 files for products
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

const bannerImageUpload = multer({
  storage: createStorage('banners'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for banners (before optimization)
    files: 1, // Single banner image
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

const avatarImageUpload = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars (before optimization)
    files: 1, // Single avatar image
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

// Helper function to get file URL
const getFileUrl = (req, filename, uploadType) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${uploadType}/${filename}`;
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to extract filename from URL
const getFilenameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Check if it's a local upload URL
  const uploadMatch = url.match(/\/uploads\/[^/]+\/(.+)$/);
  if (uploadMatch) {
    return uploadMatch[1];
  }
  
  return null;
};

// Generate secure filename
const generateSecureFilename = (originalname, uploadType) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const sanitizedName = path.parse(originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
  return `${uploadType}_${sanitizedName}_${timestamp}_${randomBytes}.webp`;
};

// Clean up old files (for maintenance)
const cleanupOldFiles = (uploadType, daysOld = 30) => {
  const uploadDir = path.join(__dirname, '..', 'uploads', uploadType);
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  try {
    const files = fs.readdirSync(uploadDir);
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

module.exports = {
  productImageUpload,
  bannerImageUpload,
  avatarImageUpload,
  getFileUrl,
  deleteFile,
  getFilenameFromUrl,
  optimizeImage,
  generateSecureFilename,
  cleanupOldFiles
};