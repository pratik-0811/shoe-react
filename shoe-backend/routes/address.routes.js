const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { validateAddress } = require('../middleware/validation.middleware');

// User routes - require user authentication
router.use(verifyToken);

// User: Get all user addresses
router.get('/', addressController.getUserAddresses);

// User: Get single address by ID
router.get('/:id', addressController.getAddressById);

// User: Create new address
router.post('/', validateAddress, addressController.createAddress);

// User: Update address
router.put('/:id', validateAddress, addressController.updateAddress);

// User: Set address as default
router.patch('/:id/set-default', addressController.setDefaultAddress);

// User: Soft delete address (mark as inactive)
router.delete('/:id', addressController.deleteAddress);

// Admin routes - require admin authentication
router.use('/admin', verifyToken, isAdmin);

// Admin: Get all addresses with user info
router.get('/admin', addressController.getAllAddresses);

// Admin: Get address statistics
router.get('/admin/stats', addressController.getAddressStats);

// Admin: Get addresses by user ID
router.get('/admin/user/:userId', addressController.getAddressesByUser);

// Admin: Permanently delete address
router.delete('/admin/:id/permanent', addressController.permanentDeleteAddress);

module.exports = router;