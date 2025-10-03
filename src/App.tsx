import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AuthProvider } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import { PageLoading } from './components/Loading';
import PerformanceMonitor from './components/PerformanceMonitor';

import { setupGlobalErrorHandlers } from './utils/errorHandler';
import { logger } from './services/logger';


// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Collections = lazy(() => import('./pages/Collections'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const PaymentFailed = lazy(() => import('./pages/PaymentFailed'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  // Initialize global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers();
    
    // Initialize logger and global error handling
    logger.info('Application started', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logger.info('Page hidden');
      } else {
        logger.info('Page visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <PerformanceMonitor enabled={true} />
        <AuthProvider>
          <ToastProvider>
            <WishlistProvider>
              <CartProvider>
                <Router>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<PageLoading text="Loading page..." />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/collections" element={<Collections />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                      <Route path="/order/:orderId" element={<OrderDetail />} />
                      <Route path="/thank-you" element={<ThankYou />} />
                      <Route path="/thank-you/:orderId" element={<ThankYou />} />
                      <Route path="/payment-failed" element={<PaymentFailed />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/admin" element={<Dashboard />} />
                      <Route path="/admin/*" element={<Dashboard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />

        </div>
                </Router>
              </CartProvider>
            </WishlistProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;