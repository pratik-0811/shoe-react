const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { bannerImageUpload } = require('../config/multer.config');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Admin only routes
router.post('/', verifyToken, isAdmin, bannerImageUpload.single('image'), categoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, bannerImageUpload.single('image'), categoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory);
router.get('/admin/stats', verifyToken, isAdmin, categoryController.getCategoryStats);
router.patch('/bulk-update', verifyToken, isAdmin, categoryController.bulkUpdateCategories);

module.exports = router;