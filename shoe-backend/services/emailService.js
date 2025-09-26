const nodemailer = require('nodemailer');
const logger = require('../config/logger');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter with SMTP configuration
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('SMTP connection error:', error);
          logger.warn('Email service will continue but emails may fail to send');
        } else {
          logger.info('SMTP server is ready to take our messages');
        }
      });
    } catch (error) {
      logger.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email address
   * @param {string} resetToken - Password reset token
   * @param {string} userName - User's name
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(email, resetToken, userName = 'User') {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized, attempting to reinitialize...');
        this.initializeTransporter();
        if (!this.transporter) {
          throw new Error('Email transporter not initialized');
        }
      }

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Solewaale',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: 'Password Reset Request - Solewaale',
        html: this.getPasswordResetTemplate(userName, resetUrl, resetToken)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent successfully to ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      return false;
    }
  }

  /**
   * Send password reset confirmation email
   * @param {string} email - Recipient email address
   * @param {string} userName - User's name
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetConfirmation(email, userName = 'User') {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'Solewaale',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: email,
        subject: 'Password Reset Successful - Solewaale',
        html: this.getPasswordResetConfirmationTemplate(userName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset confirmation email sent successfully to ${email}`);
      return true;
    } catch (error) {
      logger.error('Error sending password reset confirmation email:', error);
      return false;
    }
  }

  /**
   * Get HTML template for password reset email
   * @param {string} userName - User's name
   * @param {string} resetUrl - Password reset URL
   * @param {string} resetToken - Reset token for reference
   * @returns {string} HTML template
   */
  getPasswordResetTemplate(userName, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #1f2937;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e5e7eb;
            }
            .button {
                display: inline-block;
                background-color: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
            }
            .button:hover {
                background-color: #2563eb;
            }
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your Solewaale account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
            
            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                    <li>This link will expire in <strong>1 hour</strong> for your security</li>
                    <li>If you didn't request this password reset, please ignore this email</li>
                    <li>Your password will remain unchanged if you don't click the link</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If you're having trouble clicking the button, you can also visit our website and use the "Forgot Password" option with this reset code:</p>
            <p style="font-family: monospace; background-color: #f3f4f6; padding: 10px; border-radius: 4px; text-align: center; font-size: 18px; font-weight: bold;">${resetToken.slice(-8).toUpperCase()}</p>
        </div>
        <div class="footer">
            <p>This email was sent by Solewaale. If you have any questions, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} Solewaale. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get HTML template for password reset confirmation email
   * @param {string} userName - User's name
   * @returns {string} HTML template
   */
  getPasswordResetConfirmationTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #10b981;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: #f9fafb;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                border: 1px solid #e5e7eb;
            }
            .success {
                background-color: #d1fae5;
                border: 1px solid #10b981;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                text-align: center;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✅ Password Reset Successful</h1>
        </div>
        <div class="content">
            <h2>Hello ${userName},</h2>
            <div class="success">
                <h3>🎉 Your password has been successfully reset!</h3>
                <p>You can now log in to your Solewaale account with your new password.</p>
            </div>
            
            <p>For your security, here are some important reminders:</p>
            <ul>
                <li>Keep your password secure and don't share it with anyone</li>
                <li>Use a strong, unique password for your account</li>
                <li>If you notice any suspicious activity, contact us immediately</li>
            </ul>
            
            <p>If you didn't make this change or have any concerns about your account security, please contact our support team right away.</p>
        </div>
        <div class="footer">
            <p>This email was sent by Solewaale. If you have any questions, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} Solewaale. All rights reserved.</p>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Success status
   */
  async testEmailConfiguration() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      await this.transporter.verify();
      logger.info('Email configuration test successful');
      return true;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();