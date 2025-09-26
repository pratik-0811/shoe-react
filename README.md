# Solewaale

A full-stack e-commerce application for a premium shoe store built with React, TypeScript, and Node.js.

## Features

- Responsive design with Tailwind CSS
- User authentication and profile management
- Product browsing and filtering
- Shopping cart functionality
- Wishlist management
- Order processing
- Admin dashboard (coming soon)

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Axios for API requests
- React Router for navigation

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd shoe-react
```

2. Install dependencies for frontend

```bash
npm install
```

3. Install dependencies for backend

```bash
cd shoe-backend
npm install
```

4. Create a `.env` file in the root directory with the following variables:

```
VITE_APP_API_URL=http://localhost:5000/api
VITE_APP_TITLE=Solewaale
VITE_APP_DESCRIPTION=Premium shoe store with the latest styles and brands
```

5. Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shoe-store
JWT_SECRET=your_jwt_secret_key
```

### Running the Application

1. Start the backend server

```bash
cd shoe-backend
npm run dev
```

2. Start the frontend development server

```bash
# From the root directory
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
├── public/              # Static files
├── src/                 # Frontend source code
│   ├── components/      # Reusable components
│   ├── config/          # Configuration files
│   ├── data/            # Static data
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Entry point
├── shoe-backend/        # Backend source code
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── data/            # Seed data
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── tests/           # Backend tests
│   └── server.js        # Express server
└── package.json         # Project dependencies and scripts
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)
- `POST /api/products/:id/reviews` - Add a review to a product

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

## License

This project is licensed under the MIT License.