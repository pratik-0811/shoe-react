const express = require('express');
const router = express.Router();
const path = require('path');

// API Documentation endpoint
router.get('/', (req, res) => {
  const apiDocs = {
    title: 'Solewaale API Documentation',
    version: '1.0.0',
    description: 'RESTful API for the Solewaale e-commerce application',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      authentication: {
        'POST /users/register': {
          description: 'Register a new user',
          body: {
            name: 'string (required, min 2 chars)',
            email: 'string (required, valid email)',
            password: 'string (required, min 6 chars)'
          },
          response: {
            success: 'boolean',
            user: 'object',
            token: 'string'
          }
        },
        'POST /users/login': {
          description: 'Login user',
          body: {
            email: 'string (required)',
            password: 'string (required)'
          },
          response: {
            success: 'boolean',
            user: 'object',
            token: 'string'
          }
        }
      },
      products: {
        'GET /products': {
          description: 'Get all products with filtering and pagination',
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 12, max: 50)',
            sortBy: 'string (default: createdAt)',
            sortOrder: 'asc|desc (default: desc)',
            category: 'string',
            minPrice: 'number',
            maxPrice: 'number',
            inStock: 'boolean',
            search: 'string'
          }
        },
        'GET /products/search': {
          description: 'Search products',
          queryParams: {
            q: 'string (required, min 2 chars)',
            page: 'number (default: 1)',
            limit: 'number (default: 12, max: 50)'
          }
        },
        'GET /products/featured': {
          description: 'Get featured products',
          queryParams: {
            limit: 'number (default: 8)'
          }
        },
        'GET /products/new-arrivals': {
          description: 'Get new arrival products',
          queryParams: {
            limit: 'number (default: 8)'
          }
        },
        'GET /products/:id': {
          description: 'Get product by ID',
          params: {
            id: 'string (MongoDB ObjectId)'
          }
        },
        'POST /products/:id/reviews': {
          description: 'Add review to product (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          params: {
            id: 'string (MongoDB ObjectId)'
          },
          body: {
            rating: 'number (1-5)',
            comment: 'string',
            userName: 'string',
            userAvatar: 'string (optional)'
          }
        }
      },
      orders: {
        'POST /orders': {
          description: 'Create new order (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            shippingAddress: {
              street: 'string',
              city: 'string',
              state: 'string',
              zipCode: 'string',
              country: 'string'
            },
            paymentMethod: 'string',
            notes: 'string (optional)'
          }
        },
        'GET /orders/my-orders': {
          description: 'Get user orders (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          queryParams: {
            page: 'number (default: 1)',
            limit: 'number (default: 10)'
          }
        },
        'GET /orders/:id': {
          description: 'Get order by ID (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          params: {
            id: 'string (MongoDB ObjectId)'
          }
        }
      },
      cart: {
        'GET /cart': {
          description: 'Get user cart (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          }
        },
        'POST /cart/add': {
          description: 'Add item to cart (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            productId: 'string (MongoDB ObjectId)',
            quantity: 'number (default: 1)',
            size: 'string (optional)',
            color: 'string (optional)'
          }
        },
        'PUT /cart/update': {
          description: 'Update cart item (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            productId: 'string (MongoDB ObjectId)',
            quantity: 'number'
          }
        },
        'DELETE /cart/remove': {
          description: 'Remove item from cart (requires authentication)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            productId: 'string (MongoDB ObjectId)'
          }
        }
      },
      categories: {
        'GET /categories': {
          description: 'Get all categories',
          queryParams: {
            active: 'boolean (default: true)'
          }
        }
      },
      uploads: {
        'POST /uploads/product': {
          description: 'Upload product image (requires admin)',
          headers: {
            Authorization: 'Bearer <token>',
            'Content-Type': 'multipart/form-data'
          },
          body: {
            image: 'file (jpg, jpeg, png, webp, max 5MB)'
          }
        }
      }
    },
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Invalid or missing token',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation errors',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    },
    rateLimiting: {
      general: '100 requests per 15 minutes per IP',
      auth: '5 login attempts per 15 minutes per IP',
      uploads: '10 uploads per hour per user'
    },
    authentication: {
      type: 'JWT Bearer Token',
      header: 'Authorization: Bearer <token>',
      expiration: '7 days'
    }
  };

  res.json(apiDocs);
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

module.exports = router;