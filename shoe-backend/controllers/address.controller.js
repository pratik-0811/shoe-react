const Address = require('../models/address.model');
const User = require('../models/user.model');
const logger = require('../config/logger');

// Get all addresses for a user
const getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activeOnly = 'true' } = req.query;

    const addresses = await Address.getUserAddresses(userId, activeOnly === 'true');

    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    logger.error('Error fetching user addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    });
  }
};

// Get address by ID
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const address = await Address.findOne({ 
      _id: id, 
      user: userId,
      isActive: true 
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    logger.error('Error fetching address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address',
      error: error.message
    });
  }
};

// Get default address for a user
const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const defaultAddress = await Address.getDefaultAddress(userId);

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: 'No default address found'
      });
    }

    res.status(200).json({
      success: true,
      data: defaultAddress
    });
  } catch (error) {
    logger.error('Error fetching default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default address',
      error: error.message
    });
  }
};

// Create new address
const createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      isDefault
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if user has reached maximum address limit (optional)
    const addressCount = await Address.countDocuments({ 
      user: userId, 
      isActive: true 
    });
    
    const MAX_ADDRESSES = 10; // Set maximum addresses per user
    if (addressCount >= MAX_ADDRESSES) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_ADDRESSES} addresses allowed per user`
      });
    }

    const address = new Address({
      user: userId,
      type: type || 'home',
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: isDefault || false
    });

    await address.save();

    logger.info(`Address created for user ${userId}: ${address._id}`);

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address
    });
  } catch (error) {
    logger.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.user;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Find the address and ensure it belongs to the user
    const existingAddress = await Address.findOne({ 
      _id: id, 
      user: userId,
      isActive: true 
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update the address
    const address = await Address.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    logger.info(`Address updated for user ${userId}: ${address._id}`);

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    logger.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the address and ensure it belongs to the user
    const address = await Address.findOne({ 
      _id: id, 
      user: userId,
      isActive: true 
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Set this address as default (pre-save middleware will handle removing default from others)
    address.isDefault = true;
    await address.save();

    logger.info(`Default address set for user ${userId}: ${address._id}`);

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: address
    });
  } catch (error) {
    logger.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message
    });
  }
};

// Delete address (soft delete)
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the address and ensure it belongs to the user
    const address = await Address.findOne({ 
      _id: id, 
      user: userId,
      isActive: true 
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Check if this is the only active address
    const activeAddressCount = await Address.countDocuments({ 
      user: userId, 
      isActive: true 
    });

    if (activeAddressCount === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only address. Please add another address first.'
      });
    }

    // If this is the default address, set another address as default
    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ 
        user: userId, 
        _id: { $ne: id },
        isActive: true 
      }).sort({ createdAt: -1 });

      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    // Soft delete the address
    address.isActive = false;
    await address.save();

    logger.info(`Address deleted for user ${userId}: ${address._id}`);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
};

// Permanently delete address (Admin only)
const permanentlyDeleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findById(id);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await Address.findByIdAndDelete(id);

    logger.info(`Address permanently deleted by admin ${req.user.id}: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Address permanently deleted successfully'
    });
  } catch (error) {
    logger.error('Error permanently deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete address',
      error: error.message
    });
  }
};

// Get address statistics (Admin)
const getAddressStats = async (req, res) => {
  try {
    const [totalAddresses, activeAddresses, addressesByType, recentAddresses] = await Promise.all([
      Address.countDocuments(),
      Address.countDocuments({ isActive: true }),
      Address.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Address.find({ isActive: true })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('user type city state createdAt')
    ]);

    const stats = {
      total: totalAddresses,
      active: activeAddresses,
      inactive: totalAddresses - activeAddresses,
      byType: addressesByType,
      recent: recentAddresses
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching address stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address statistics',
      error: error.message
    });
  }
};

// Validate address format
const validateAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country
    } = req.body;

    const errors = [];

    // Basic validation
    if (!fullName || fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    if (!phone || !/^[+]?[0-9]{10,15}$/.test(phone)) {
      errors.push('Please enter a valid phone number');
    }

    if (!addressLine1 || addressLine1.trim().length < 5) {
      errors.push('Address line 1 must be at least 5 characters long');
    }

    if (!city || city.trim().length < 2) {
      errors.push('City must be at least 2 characters long');
    }

    if (!state || state.trim().length < 2) {
      errors.push('State must be at least 2 characters long');
    }

    if (!postalCode || !/^[0-9]{6}$/.test(postalCode)) {
      errors.push('Please enter a valid 6-digit postal code');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Address validation failed',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address is valid'
    });
  } catch (error) {
    logger.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address',
      error: error.message
    });
  }
};

// Admin: Get all addresses with user info
const getAllAddresses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { 'street': { $regex: search, $options: 'i' } },
        { 'city': { $regex: search, $options: 'i' } },
        { 'state': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const addresses = await Address.find(query)
      .populate('user', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Address.countDocuments(query);

    res.json({
      success: true,
      data: addresses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message
    });
  }
};

// Admin: Get addresses by user ID
const getAddressesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const addresses = await Address.find({ user: userId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: addresses,
      total: addresses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user addresses',
      error: error.message
    });
  }
};

module.exports = {
  getUserAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  permanentlyDeleteAddress,
  permanentDeleteAddress: permanentlyDeleteAddress, // Alias for route compatibility
  getAddressStats,
  validateAddress,
  getAllAddresses,
  getAddressesByUser
};