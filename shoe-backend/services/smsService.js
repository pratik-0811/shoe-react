const axios = require('axios');
const logger = require('../config/logger');
require('dotenv').config();

class SMSService {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.senderId = process.env.MSG91_SENDER_ID || 'OTPIND';
    this.baseUrl = 'https://control.msg91.com/api/v5';
    
    if (!this.authKey) {
      logger.warn('MSG91_AUTH_KEY not found in environment variables. SMS functionality will be disabled.');
    }
  }

  /**
   * Send OTP SMS using MSG91
   * @param {string} phone - Phone number with country code
   * @param {string} otp - OTP code to send
   * @param {string} templateId - Optional template ID override
   * @returns {Promise<boolean>} - Success status
   */
  async sendOTP(phone, otp, templateId = null) {
    try {
      // If no auth key, fall back to console logging for development
      if (!this.authKey) {
        logger.info(`[DEV MODE] SMS to ${phone}: Your OTP is ${otp}. Valid for 10 minutes.`);
        return true;
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[^+\d]/g, '');
      
      // Remove + if present for MSG91 API
      const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;

      const payload = {
        sender: this.senderId,
        route: '4',
        country: '91',
        sms: [
          {
            message: `Your login OTP is: ${otp}. Valid for 10 minutes.`,
            to: [phoneNumber]
          }
        ]
      };

      // If template ID is provided, use OTP API instead
      if (templateId || this.templateId) {
        const otpPayload = {
          template_id: templateId || this.templateId,
          sender: this.senderId,
          short_url: '0',
          mobiles: phoneNumber,
          otp: otp
        };
        
        const otpConfig = {
          method: 'POST',
          url: `${this.baseUrl}/otp`,
          headers: {
            'Authkey': this.authKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data: otpPayload
        };

        const response = await axios(otpConfig);
        
        if (response.data && response.data.type === 'success') {
          logger.info(`OTP sent successfully to ${phoneNumber}`);
          return true;
        } else {
          logger.error('MSG91 OTP API error:', response.data);
          return false;
        }
      }

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/flow/`,
        headers: {
          'Authkey': this.authKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: payload
      };

      logger.info(`Sending OTP to ${phoneNumber} via MSG91`);
      const response = await axios(config);
      
      if (response.data && response.data.type === 'success') {
        logger.info(`OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        logger.error('MSG91 API error:', response.data);
        return false;
      }

    } catch (error) {
      logger.error('SMS sending failed:', {
        error: error.message,
        phone: phone,
        response: error.response?.data
      });
      return false;
    }
  }

  /**
   * Send custom SMS message using MSG91
   * @param {string} phone - Phone number with country code
   * @param {string} message - Message content
   * @returns {Promise<boolean>} - Success status
   */
  async sendSMS(phone, message) {
    try {
      // If no auth key, fall back to console logging for development
      if (!this.authKey) {
        logger.info(`[DEV MODE] SMS to ${phone}: ${message}`);
        return true;
      }

      // Clean phone number
      const cleanPhone = phone.replace(/[^+\d]/g, '');
      const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;

      const payload = {
        sender: this.senderId,
        route: '4', // Transactional route
        country: '91', // India country code
        sms: [
          {
            message: message,
            to: [phoneNumber]
          }
        ]
      };

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/flow/`,
        headers: {
          'Authkey': this.authKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: payload
      };

      logger.info(`Sending SMS to ${phoneNumber} via MSG91`);
      const response = await axios(config);
      
      if (response.data && response.data.type === 'success') {
        logger.info(`SMS sent successfully to ${phoneNumber}`);
        return true;
      } else {
        logger.error('MSG91 SMS API error:', response.data);
        return false;
      }

    } catch (error) {
      logger.error('SMS sending failed:', {
        error: error.message,
        phone: phone,
        response: error.response?.data
      });
      return false;
    }
  }

  /**
   * Verify OTP using MSG91 (if using MSG91's OTP verification)
   * @param {string} phone - Phone number
   * @param {string} otp - OTP to verify
   * @returns {Promise<boolean>} - Verification status
   */
  async verifyOTP(phone, otp) {
    try {
      if (!this.authKey) {
        logger.warn('MSG91_AUTH_KEY not found. Cannot verify OTP via MSG91.');
        return false;
      }

      const cleanPhone = phone.replace(/[^+\d]/g, '');
      const phoneNumber = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;

      const config = {
        method: 'POST',
        url: `${this.baseUrl}/otp/verify`,
        headers: {
          'Authkey': this.authKey,
          'Content-Type': 'application/json'
        },
        data: {
          otp: otp,
          mobile: phoneNumber
        }
      };

      const response = await axios(config);
      
      if (response.data && response.data.type === 'success') {
        logger.info(`OTP verified successfully for ${phoneNumber}`);
        return true;
      } else {
        logger.warn(`OTP verification failed for ${phoneNumber}:`, response.data);
        return false;
      }

    } catch (error) {
      logger.error('OTP verification failed:', {
        error: error.message,
        phone: phone,
        response: error.response?.data
      });
      return false;
    }
  }

  /**
   * Get SMS delivery status
   * @param {string} requestId - MSG91 request ID
   * @returns {Promise<Object>} - Delivery status
   */
  async getDeliveryStatus(requestId) {
    try {
      if (!this.authKey) {
        return { status: 'unknown', message: 'MSG91 not configured' };
      }

      const config = {
        method: 'GET',
        url: `${this.baseUrl}/report/${requestId}`,
        headers: {
          'Authkey': this.authKey
        }
      };

      const response = await axios(config);
      return response.data;

    } catch (error) {
      logger.error('Failed to get delivery status:', error.message);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Test SMS service configuration
   * @returns {Promise<boolean>} - Configuration test result
   */
  async testConfiguration() {
    try {
      if (!this.authKey) {
        logger.warn('MSG91 configuration test: AUTH_KEY missing');
        return false;
      }

      // Test with a simple balance check API call
      const config = {
        method: 'POST',
        url: 'https://control.msg91.com/api/balance.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `authkey=${this.authKey}&type=4`
      };

      const response = await axios(config);
      
      if (response.data && !response.data.includes('ERROR')) {
        logger.info('MSG91 configuration test successful. Balance:', response.data);
        return true;
      } else {
        logger.error('MSG91 configuration test failed:', response.data);
        return false;
      }

    } catch (error) {
      logger.error('MSG91 configuration test error:', error.message);
      return false;
    }
  }
}

module.exports = new SMSService();