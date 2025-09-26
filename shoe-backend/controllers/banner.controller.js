const Banner = require("../models/banner.model");
const { getFilenameFromUrl, deleteFile } = require("../config/multer.config");
const path = require('path');

// Get all active banners for public display
exports.getActiveBanners = async (req, res) => {
  try {
    const { position } = req.query;
    const currentDate = new Date();
    
    const filter = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: currentDate } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: currentDate } }
          ]
        }
      ]
    };
    
    if (position) {
      filter.position = position;
    }
    
    const banners = await Banner.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .select('-clickCount -impressionCount');
    
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error: error.message });
  }
};

// Get all banners (admin only)
exports.getAllBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const position = req.query.position;
    const isActive = req.query.isActive;
    
    const filter = {};
    if (position) filter.position = position;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const banners = await Banner.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Banner.countDocuments(filter);
    
    res.status(200).json({
      banners,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error: error.message });
  }
};

// Get single banner
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banner", error: error.message });
  }
};

// Create new banner (admin only)
exports.createBanner = async (req, res) => {
  try {
    const bannerData = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    };
    
    // If image was uploaded via the upload endpoint, it should be in req.body.image
    // Validate that image is provided
    if (!bannerData.image) {
      return res.status(400).json({ message: "Banner image is required" });
    }
    
    const banner = new Banner(bannerData);
    await banner.save();
    
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: "Error creating banner", error: error.message });
  }
};

// Update banner (admin only)
exports.updateBanner = async (req, res) => {
  try {
    const existingBanner = await Banner.findById(req.params.id);
    if (!existingBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    const updateData = {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
    };
    
    // Handle image update
    if (updateData.image && updateData.image !== existingBanner.image) {
      // Delete old image if it's being replaced and it's an uploaded file
      if (existingBanner.image && existingBanner.image.includes('/uploads/banners/')) {
        const filename = getFilenameFromUrl(existingBanner.image);
        const filePath = path.join(__dirname, '..', 'uploads', 'banners', filename);
        deleteFile(filePath);
      }
    }
    
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json(banner);
  } catch (error) {
    res.status(400).json({ message: "Error updating banner", error: error.message });
  }
};

// Delete banner (admin only)
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    // Delete associated image file if it's an uploaded file
    if (banner.image && banner.image.includes('/uploads/banners/')) {
      const filename = getFilenameFromUrl(banner.image);
      const filePath = path.join(__dirname, '..', 'uploads', 'banners', filename);
      deleteFile(filePath);
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error: error.message });
  }
};

// Toggle banner active status (admin only)
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    banner.isActive = !banner.isActive;
    await banner.save();
    
    res.status(200).json(banner);
  } catch (error) {
    res.status(400).json({ message: "Error toggling banner status", error: error.message });
  }
};

// Track banner click
exports.trackBannerClick = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );
    
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    
    res.status(200).json({ message: "Click tracked successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error tracking click", error: error.message });
  }
};

// Track banner impression
exports.trackBannerImpression = async (req, res) => {
  try {
    const { bannerIds } = req.body; // Array of banner IDs
    
    if (!Array.isArray(bannerIds)) {
      return res.status(400).json({ message: "bannerIds must be an array" });
    }
    
    await Banner.updateMany(
      { _id: { $in: bannerIds } },
      { $inc: { impressionCount: 1 } }
    );
    
    res.status(200).json({ message: "Impressions tracked successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error tracking impressions", error: error.message });
  }
};

// Get banner analytics (admin only)
exports.getBannerAnalytics = async (req, res) => {
  try {
    const banners = await Banner.find()
      .select('title position clickCount impressionCount isActive createdAt')
      .sort({ clickCount: -1 });
    
    const analytics = banners.map(banner => ({
      ...banner.toObject(),
      clickThroughRate: banner.impressionCount > 0 
        ? ((banner.clickCount / banner.impressionCount) * 100).toFixed(2)
        : 0
    }));
    
    const totalClicks = banners.reduce((sum, banner) => sum + banner.clickCount, 0);
    const totalImpressions = banners.reduce((sum, banner) => sum + banner.impressionCount, 0);
    const averageCTR = totalImpressions > 0 
      ? ((totalClicks / totalImpressions) * 100).toFixed(2)
      : 0;
    
    res.status(200).json({
      banners: analytics,
      summary: {
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.isActive).length,
        totalClicks,
        totalImpressions,
        averageCTR
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching banner analytics", error: error.message });
  }
};