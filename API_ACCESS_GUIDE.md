# API Access Token Guide

## 🔑 Access Token for API Testing

### Admin Credentials
- **Email**: `admin@luxora.com`
- **Password**: `admin123`
- **Server URL**: `http://localhost:5000`

### Current Access Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjgyMTdlNzc3N2M1MWJlOTBkYTU0NCIsImlzQWRtaW4iOnRydWUsImVtYWlsIjoiYWRtaW5AbHV4b3JhLmNvbSIsImlhdCI6MTc1NzQ5NTY0MCwiZXhwIjoxNzU4MTAwNDQwLCJhdWQiOiJzaG9lLXN0b3JlLWNsaWVudCIsImlzcyI6InNob2Utc3RvcmUtYXBpIn0.3Vtru2Gr965Fd5gNfUIHR4F3x6xDiHtHomD0a3xpYlo
```

**Note**: This token expires in 7 days. If expired, use the login endpoint to get a new one.

## 🚀 How to Use the Token

### PowerShell Examples

#### 1. Get User Profile
```powershell
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjgyMTdlNzc3N2M1MWJlOTBkYTU0NCIsImlzQWRtaW4iOnRydWUsImVtYWlsIjoiYWRtaW5AbHV4b3JhLmNvbSIsImlhdCI6MTc1NzQ5NTY0MCwiZXhwIjoxNzU4MTAwNDQwLCJhdWQiOiJzaG9lLXN0b3JlLWNsaWVudCIsImlzcyI6InNob2Utc3RvcmUtYXBpIn0.3Vtru2Gr965Fd5gNfUIHR4F3x6xDiHtHomD0a3xpYlo'
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/users/me' -Method GET -Headers $headers
```

#### 2. Get All Products
```powershell
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/products' -Method GET -Headers $headers
```

#### 3. Get User Cart
```powershell
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/cart' -Method GET -Headers $headers
```

#### 4. Get All Orders (Admin)
```powershell
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/orders' -Method GET -Headers $headers
```

#### 5. Get All Coupons (Admin)
```powershell
$headers = @{ 'Authorization' = "Bearer $token" }
Invoke-RestMethod -Uri 'http://localhost:5000/api/coupons/admin' -Method GET -Headers $headers
```

### cURL Examples (for other terminals)

#### 1. Get User Profile
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjgyMTdlNzc3N2M1MWJlOTBkYTU0NCIsImlzQWRtaW4iOnRydWUsImVtYWlsIjoiYWRtaW5AbHV4b3JhLmNvbSIsImlhdCI6MTc1NzQ5NTY0MCwiZXhwIjoxNzU4MTAwNDQwLCJhdWQiOiJzaG9lLXN0b3JlLWNsaWVudCIsImlzcyI6InNob2Utc3RvcmUtYXBpIn0.3Vtru2Gr965Fd5gNfUIHR4F3x6xDiHtHomD0a3xpYlo" \
  http://localhost:5000/api/users/me
```

#### 2. Get All Products
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjgyMTdlNzc3N2M1MWJlOTBkYTU0NCIsImlzQWRtaW4iOnRydWUsImVtYWlsIjoiYWRtaW5AbHV4b3JhLmNvbSIsImlhdCI6MTc1NzQ5NTY0MCwiZXhwIjoxNzU4MTAwNDQwLCJhdWQiOiJzaG9lLXN0b3JlLWNsaWVudCIsImlzcyI6InNob2Utc3RvcmUtYXBpIn0.3Vtru2Gr965Fd5gNfUIHR4F3x6xDiHtHomD0a3xpYlo" \
  http://localhost:5000/api/products
```

## 🔄 Getting a New Token

If your token expires, use this PowerShell command to get a new one:

```powershell
$body = @{ email = 'admin@luxora.com'; password = 'admin123' } | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:5000/api/users/login' -Method POST -Body $body -ContentType 'application/json'
Write-Host "New Token: $($response.token)"
```

## 📋 Available API Endpoints

### Public Endpoints (No Token Required)
- `GET /api/products` - Get all products
- `GET /api/categories` - Get all categories
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user

### Protected Endpoints (Token Required)
- `GET /api/users/me` - Get current user profile
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/wishlist` - Get user wishlist

### Admin Endpoints (Admin Token Required)
- `GET /api/orders` - Get all orders
- `GET /api/coupons/admin` - Get all coupons
- `POST /api/coupons/admin` - Create new coupon
- `GET /api/users` - Get all users
- `POST /api/products` - Create new product

## 🛡️ Token Information

- **Type**: JWT (JSON Web Token)
- **Expiration**: 7 days from issue
- **Admin Privileges**: Yes (this token has admin access)
- **Format**: Bearer token (include "Bearer " prefix in Authorization header)

## 📝 Notes

1. Always include the "Bearer " prefix when using the token in the Authorization header
2. The token contains user ID, admin status, and email information
3. Admin tokens can access all endpoints including admin-only routes
4. Regular user tokens are limited to user-specific data and public endpoints
5. The backend server is running on port 5000
6. All API endpoints are prefixed with `/api/`