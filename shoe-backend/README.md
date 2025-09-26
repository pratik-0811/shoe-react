# Shoe Store Backend - Production Ready

A comprehensive Node.js backend API for an e-commerce shoe store with production-grade features including logging, monitoring, security, and deployment automation.

## 🚀 Features

### Core Functionality
- **Product Management**: Full CRUD operations for products with categories, variants, and inventory
- **User Authentication**: JWT-based auth with role-based access control
- **Order Management**: Complete order processing with payment integration
- **Shopping Cart**: Persistent cart functionality
- **Wishlist**: User wishlist management
- **Reviews & Ratings**: Product review system
- **File Upload**: Image upload with optimization
- **Payment Integration**: Razorpay payment gateway

### Production Features
- **Comprehensive Logging**: Winston-based logging with rotation
- **Health Monitoring**: Health checks and metrics endpoints
- **Security**: Helmet, rate limiting, input sanitization
- **Performance**: Compression, caching, database optimization
- **Error Handling**: Centralized error handling with proper logging
- **Validation**: Comprehensive input validation
- **Docker Support**: Full containerization with Docker Compose
- **Backup System**: Automated MongoDB backups
- **Deployment Scripts**: Automated deployment with rollback

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 6.0+
- Docker & Docker Compose (for containerized deployment)
- Redis (optional, for caching)
- SSL certificates (for HTTPS in production)

## 🛠️ Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shoe-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.production .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

#### Option 1: Docker Compose (Recommended)

1. **Prepare environment**
   ```bash
   cp .env.production .env
   # Configure all production variables
   ```

2. **Deploy with script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh production deploy
   ```

3. **Verify deployment**
   ```bash
   ./deploy.sh production health
   ```

#### Option 2: Manual Deployment

1. **Build Docker image**
   ```bash
   npm run docker:build
   ```

2. **Start services**
   ```bash
   npm run docker:compose:up
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shoe-store

# Security
JWT_SECRET=your-super-secure-secret-key
BCRYPT_ROUNDS=12

# Payment
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### SSL Configuration

For HTTPS in production:

1. Place SSL certificates in `./ssl/` directory:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key

2. Update `nginx.conf` with your domain name

## 📊 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Products
- `GET /api/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/new-arrivals` - Get new arrivals
- `GET /api/products/search` - Search products

#### Users
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/forgot-password` - Password reset

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/status` - Update order status (Admin)

#### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove item from cart

### Query Parameters

#### Products Filtering
```
GET /api/products?
  page=1&
  limit=10&
  sortBy=price&
  sortOrder=asc&
  category=sneakers&
  minPrice=50&
  maxPrice=200&
  inStock=true&
  search=nike
```

## 🔍 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /ready` - Readiness probe (Kubernetes)
- `GET /live` - Liveness probe (Kubernetes)
- `GET /metrics` - Prometheus-style metrics

### Logging

Logs are stored in `./logs/` directory:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- `access-YYYY-MM-DD.log` - HTTP access logs

### Log Levels
- `error` - Error messages
- `warn` - Warning messages
- `info` - General information
- `http` - HTTP requests
- `debug` - Debug information

## 🔒 Security Features

### Implemented Security Measures
- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting
- **Input Sanitization**: XSS protection
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **CORS**: Configurable cross-origin requests
- **File Upload Security**: Type and size validation
- **Account Lockout**: Brute force protection

### Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy
- Referrer-Policy

## 📦 Backup & Recovery

### Automated Backups
Backups run automatically via cron job (default: daily at 2 AM):

```bash
# Manual backup
./deploy.sh production backup

# List backups
docker-compose -f docker-compose.prod.yml exec mongo-backup /backup-script.sh list

# Restore from backup
docker-compose -f docker-compose.prod.yml exec mongo-backup /backup-script.sh restore /backups/backup_file.gz
```

### Backup Configuration
- **Schedule**: Configurable via `BACKUP_SCHEDULE` env var
- **Retention**: Configurable via `BACKUP_RETENTION_DAYS` env var
- **Location**: `./backups/` directory
- **Format**: Compressed MongoDB archives

## 🚀 Deployment Commands

### Using Deployment Script
```bash
# Deploy to production
./deploy.sh production deploy

# Check health
./deploy.sh production health

# View logs
./deploy.sh production logs

# Show status
./deploy.sh production status

# Rollback
./deploy.sh production rollback

# Cleanup
./deploy.sh production cleanup
```

### Using NPM Scripts
```bash
# Production start
npm run prod

# Docker build
npm run docker:build

# Docker compose up
npm run docker:compose:up

# Health check
npm run health

# View logs
npm run logs
```

## 🔧 Performance Optimization

### Database Optimization
- **Indexes**: Optimized indexes for common queries
- **Connection Pooling**: Configured connection pool
- **Query Optimization**: Efficient aggregation pipelines

### Caching Strategy
- **Redis Integration**: Optional Redis caching
- **HTTP Caching**: Proper cache headers
- **Static File Caching**: Nginx static file caching

### Compression
- **Gzip Compression**: Response compression
- **Image Optimization**: Sharp-based image processing

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check MongoDB status
   docker-compose -f docker-compose.prod.yml logs mongo
   
   # Verify connection string
   echo $MONGODB_URI
   ```

2. **Health Check Failing**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs app
   
   # Manual health check
   curl -f http://localhost:5000/health
   ```

3. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # View detailed metrics
   curl http://localhost:5000/metrics
   ```

### Log Analysis
```bash
# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# View access logs
tail -f logs/access-$(date +%Y-%m-%d).log

# Search for specific errors
grep "ERROR" logs/combined-$(date +%Y-%m-%d).log
```

## 📈 Monitoring Integration

### Prometheus Metrics
Metrics available at `/metrics` endpoint:
- Node.js memory usage
- CPU usage
- Process uptime
- Database connection status
- Custom application metrics

### Log Aggregation
Supports integration with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd
- Splunk
- CloudWatch Logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the logs for error details

---

**Note**: This backend is production-ready with comprehensive logging, monitoring, security, and deployment automation. Make sure to configure all environment variables properly before deploying to production.