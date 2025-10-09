const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const logger = require('../config/logger');

// Test endpoint to send order confirmation email
router.post('/send-test-email', async (req, res) => {
  try {
    const { email = 'pratik2017hosmani@gmail.com' } = req.body;
    
    // Create test invoice data
    const testInvoiceData = {
      orderNumber: `TEST-${Date.now()}`,
      orderDate: new Date().toLocaleDateString(),
      customerName: 'Test Customer',
      customerEmail: email,
      items: [
        {
          name: 'Test Shoe',
          quantity: 1,
          price: 2999,
          total: 2999
        }
      ],
      subtotal: 2999,
      shippingCost: 0,
      discount: 0,
      tax: 0,
      total: 2999,
      totalAmount: 2999,
      paymentMethod: 'cash_on_delivery',
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'India'
      }
    };

    // Send test email
    const result = await emailService.sendInvoiceEmail(email, testInvoiceData, 'Test Customer');
    
    if (result) {
      logger.info(`Test order confirmation email sent successfully to ${email}`);
      res.json({ 
        success: true, 
        message: 'Test order confirmation email sent successfully',
        orderNumber: testInvoiceData.orderNumber
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email' 
      });
    }
  } catch (error) {
    logger.error('Error in test email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;