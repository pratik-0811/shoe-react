const Category = require('../models/category.model');
const Product = require('../models/product.model');
const { getFileUrl } = require('../config/multer.config');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const { active, includeProducts } = req.query;
    
    let filter = {};
    if (active === 'true') {
      filter.isActive = true;
    }
    
    let categories = await Category.find(filter)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 });
    
    // Include product count if requested
    if (includeProducts === 'true') {
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const productCount = await Product.countDocuments({ 
            category: category._id,
            inStock: true 
          });
          return {
            ...category.toObject(),
            productCount
          };
        })
      );
      categories = categoriesWithCount;
    }
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching categories", 
      error: error.message 
    });
  }
};

// Get hierarchical categories with subcategories
exports.getHierarchicalCategories = async (req, res) => {
  try {
    const { active, includeProducts } = req.query;
    
    let filter = {};
    if (active === 'true') {
      filter.isActive = true;
    }
    
    // Get all categories
    let allCategories = await Category.find(filter)
      .sort({ sortOrder: 1, name: 1 });
    
    // Include product count if requested
    if (includeProducts === 'true') {
      allCategories = await Promise.all(
        allCategories.map(async (category) => {
          const productCount = await Product.countDocuments({ 
            category: category._id,
            inStock: true 
          });
          return {
            ...category.toObject(),
            productCount
          };
        })
      );
    }
    
    // Build hierarchical structure
    const categoryMap = new Map();
    const rootCategories = [];
    
    // First pass: create map of all categories
    allCategories.forEach(category => {
      const categoryObj = category.toObject ? category.toObject() : category;
      categoryObj.subcategories = [];
      categoryMap.set(categoryObj._id.toString(), categoryObj);
    });
    
    // Second pass: build hierarchy
    allCategories.forEach(category => {
      const categoryObj = categoryMap.get(category._id.toString());
      
      if (category.parentCategory) {
        const parentId = category.parentCategory.toString();
        const parent = categoryMap.get(parentId);
        if (parent) {
          parent.subcategories.push(categoryObj);
        } else {
          // Parent not found or not active, treat as root
          rootCategories.push(categoryObj);
        }
      } else {
        // Root category
        rootCategories.push(categoryObj);
      }
    });
    
    res.status(200).json({
      success: true,
      categories: rootCategories
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching hierarchical categories", 
      error: error.message 
    });
  }
};

// Get category by ID or slug
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let category = await Category.findById(id).populate('parentCategory', 'name slug');
    
    if (!category) {
      category = await Category.findOne({ slug: id }).populate('parentCategory', 'name slug');
    }
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    
    // Get product count for this category
    const productCount = await Product.countDocuments({ 
      category: category._id,
      inStock: true 
    });
    
    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching category", 
      error: error.message 
    });
  }
};

// Create new category (admin only)
exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Handle image upload if file is provided
    if (req.file) {
      categoryData.image = getFileUrl(req, req.file.filename, 'banners');
    }
    
    // Convert empty parentCategory string to null
    if (categoryData.parentCategory === '') {
      categoryData.parentCategory = null;
    }
    
    // Generate slug if not provided
    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `Category ${field} already exists` 
      });
    }
    res.status(400).json({ 
      success: false,
      message: "Error creating category", 
      error: error.message 
    });
  }
};

// Update category (admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Handle image upload if file is provided
    if (req.file) {
      updateData.image = getFileUrl(req, req.file.filename, 'banners');
    }
    
    // Convert empty parentCategory string to null
    if (updateData.parentCategory === '') {
      updateData.parentCategory = null;
    }
    
    // Generate slug if name is being updated
    if (updateData.name && !updateData.slug) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    const category = await Category.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('parentCategory', 'name slug');
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `Category ${field} already exists` 
      });
    }
    res.status(400).json({ 
      success: false,
      message: "Error updating category", 
      error: error.message 
    });
  }
};

// Delete category (admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete category. It has ${productCount} products associated with it.` 
      });
    }
    
    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: id });
    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete category. It has ${subcategoryCount} subcategories.` 
      });
    }
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting category", 
      error: error.message 
    });
  }
};

// Get category statistics (admin only)
exports.getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          isActive: 1,
          productCount: { $size: '$products' },
          inStockProducts: {
            $size: {
              $filter: {
                input: '$products',
                cond: { $eq: ['$$this.inStock', true] }
              }
            }
          },
          avgPrice: { $avg: '$products.price' },
          totalValue: { $sum: '$products.price' }
        }
      },
      { $sort: { productCount: -1 } }
    ]);
    
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    
    res.status(200).json({
      success: true,
      stats: {
        totalCategories,
        activeCategories,
        categoryDetails: stats
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching category statistics", 
      error: error.message 
    });
  }
};

// Bulk update categories (admin only)
exports.bulkUpdateCategories = async (req, res) => {
  try {
    const { categoryIds, updateData } = req.body;
    
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Category IDs array is required" 
      });
    }
    
    const result = await Category.updateMany(
      { _id: { $in: categoryIds } },
      updateData,
      { runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Categories updated successfully",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Error bulk updating categories", 
      error: error.message 
    });
  }
};