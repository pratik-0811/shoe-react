const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { getFilenameFromUrl, deleteFile } = require("../config/multer.config");
const path = require('path');

// Get all products with filtering, sorting, and pagination
exports.getAllProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const category = req.query.category;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    const inStock = req.query.inStock;
    const search = req.query.search;
    
    // Build filter object
    const filter = {};
    if (category) {
      // If category is provided, find the category by slug and use its ObjectId
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      } else {
        // If category slug not found, return empty results
        return res.status(200).json({
          products: [],
          totalPages: 0,
          currentPage: page,
          total: 0
        });
      }
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (inStock !== undefined) filter.inStock = inStock === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Use Promise.all for parallel execution
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug description image')
        .sort({ [sortBy]: sortOrder })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-reviews') // Exclude reviews for performance but include all other fields
        .lean(), // Use lean() for better performance
      Product.countDocuments(filter)
    ]);
    
    // Ensure all product fields are included in the response
    const productsWithAllFields = products.map(product => ({
      ...product,
      // Ensure these fields are explicitly included even if they're empty arrays/null
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      features: product.features || [],
      material: product.material || null,
      gender: product.gender || null,
      style: product.style || null,
      season: product.season || null,
      badge: product.badge || null
    }));
    
    res.status(200).json({
      products: productsWithAllFields,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching products", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug description image');
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    // Handle uploaded images if any
    const productData = { ...req.body };
    
    // If images were uploaded via the upload endpoint, they should be in req.body.images
    // If no images provided, use empty array
    if (!productData.images) {
      productData.images = [];
    }
    
    // Ensure main image is set (use first image if available)
    if (!productData.image && productData.images.length > 0) {
      productData.image = productData.images[0];
    }
    
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error creating product", error: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const updateData = { ...req.body };
    
    // Handle image updates
    if (updateData.images) {
      // Delete old images if they're being replaced
      if (existingProduct.images && existingProduct.images.length > 0) {
        existingProduct.images.forEach(imageUrl => {
          if (imageUrl.includes('/uploads/products/')) {
            const filename = getFilenameFromUrl(imageUrl);
            const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
            deleteFile(filePath);
          }
        });
      }
      
      // Ensure main image is updated if images array changed
      if (!updateData.image && updateData.images.length > 0) {
        updateData.image = updateData.images[0];
      }
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: "Error updating product", error: error.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    // Delete associated image files
    if (product.images && product.images.length > 0) {
      product.images.forEach(imageUrl => {
        if (imageUrl.includes('/uploads/products/')) {
          const filename = getFilenameFromUrl(imageUrl);
          const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
          deleteFile(filePath);
        }
      });
    }
    
    // Delete main image if it's different from images array
    if (product.image && product.image.includes('/uploads/products/') && 
        (!product.images || !product.images.includes(product.image))) {
      const filename = getFilenameFromUrl(product.image);
      const filePath = path.join(__dirname, '..', 'uploads', 'products', filename);
      deleteFile(filePath);
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error.message });
  }
};

// Add a review to a product
exports.addReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const review = {
      userId: req.body.userId,
      userName: req.body.userName,
      userAvatar: req.body.userAvatar,
      rating: req.body.rating,
      comment: req.body.comment,
      date: new Date().toISOString().split("T")[0],
      helpful: 0,
      verified: req.body.verified || false
    };
    
    product.reviews.push(review);
    
    // Update product rating
    const totalRatings = product.reviews.reduce((sum, item) => sum + item.rating, 0);
    product.rating = totalRatings / product.reviews.length;
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: "Error adding review", error: error.message });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.find({ 
      inStock: true,
      isFeatured: true
    })
    .populate('category', 'name slug')
    .sort({ rating: -1, createdAt: -1 })
    .limit(limit)
    .select('-reviews')
    .lean();
    
    // Ensure all product fields are included in the response
    const productsWithAllFields = products.map(product => ({
      ...product,
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      features: product.features || [],
      material: product.material || null,
      gender: product.gender || null,
      style: product.style || null,
      season: product.season || null,
      badge: product.badge || null
    }));
    
    res.status(200).json(productsWithAllFields);
  } catch (error) {
    res.status(500).json({ message: "Error fetching featured products", error: error.message });
  }
};

// Get new arrivals
exports.getNewArrivals = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const products = await Product.find({ inStock: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-reviews')
      .lean();
    
    // Ensure all product fields are included in the response
    const productsWithAllFields = products.map(product => ({
      ...product,
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      features: product.features || [],
      material: product.material || null,
      gender: product.gender || null,
      style: product.style || null,
      season: product.season || null,
      badge: product.badge || null
    }));
    
    res.status(200).json(productsWithAllFields);
  } catch (error) {
    res.status(500).json({ message: "Error fetching new arrivals", error: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const products = await Product.find({ category })
      .populate('category', 'name slug description image')
      .sort({ [sortBy]: sortOrder })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-reviews')
      .lean();
    
    const total = await Product.countDocuments({ category });
    
    // Ensure all product fields are included in the response
    const productsWithAllFields = products.map(product => ({
      ...product,
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      features: product.features || [],
      material: product.material || null,
      gender: product.gender || null,
      style: product.style || null,
      season: product.season || null,
      badge: product.badge || null
    }));
    
    res.status(200).json({
      products: productsWithAllFields,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      category
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products by category", error: error.message });
  }
};

// Get all categories (deprecated - use /api/categories instead)
exports.getCategories = async (req, res) => {
  try {
    const Category = require('../models/category.model');
    const categories = await Category.find({ isActive: true }).select('name slug description image');
    
    const categoryStats = await Product.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $unwind: '$categoryInfo'
      },
      {
        $group: {
          _id: '$category',
          name: { $first: '$categoryInfo.name' },
          slug: { $first: '$categoryInfo.slug' },
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          inStockCount: {
            $sum: { $cond: [{ $eq: ['$inStock', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json({
      categories,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error: error.message });
  }
};

// Bulk update products (admin only)
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updateData } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      updateData,
      { runValidators: true }
    );
    
    res.status(200).json({
      message: "Products updated successfully",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    res.status(400).json({ message: "Error bulk updating products", error: error.message });
  }
};

// Bulk delete products (admin only)
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: "Product IDs array is required" });
    }
    
    const result = await Product.deleteMany({ _id: { $in: productIds } });
    
    res.status(200).json({
      message: "Products deleted successfully",
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: "Error bulk deleting products", error: error.message });
  }
};

// Get product statistics (admin only)
exports.getProductStats = async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const inStock = await Product.countDocuments({ inStock: true });
    const outOfStock = total - inStock;
    const lowStock = await Product.countDocuments({ 
      inStock: true, 
      stockCount: { $lte: 10 } 
    });
    
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    res.status(200).json({
      total,
      inStock,
      outOfStock,
      lowStock,
      categoryStats,
      priceStats: priceStats[0] || { avgPrice: 0, minPrice: 0, maxPrice: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching product statistics", error: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 2 characters long" 
      });
    }
    
    const searchTerm = q.trim();
    const searchFilter = {
      $and: [
        { inStock: true }, // Only search in-stock products
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { features: { $in: [new RegExp(searchTerm, 'i')] } }
          ]
        }
      ]
    };
    
    // Use Promise.all for parallel execution
    const [products, total] = await Promise.all([
      Product.find(searchFilter)
        .populate('category', 'name slug')
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .select('-reviews')
        .lean(),
      Product.countDocuments(searchFilter)
    ]);
    
    // Ensure all product fields are included in the response
    const productsWithAllFields = products.map(product => ({
      ...product,
      sizes: product.sizes || [],
      colors: product.colors || [],
      images: product.images || [],
      features: product.features || [],
      material: product.material || null,
      gender: product.gender || null,
      style: product.style || null,
      season: product.season || null,
      badge: product.badge || null
    }));
    
    res.status(200).json({
      success: true,
      products: productsWithAllFields,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      searchQuery: searchTerm
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      success: false,
      message: "Error searching products", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
};
