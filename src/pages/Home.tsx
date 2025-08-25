import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck, HeadphonesIcon, Loader, AlertCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import productService from '../services/productService';
import { Product } from '../types';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [featured, newArrivals] = await Promise.all([
          productService.getFeaturedProducts(),
          productService.getNewArrivals()
        ]);
        
        setFeaturedProducts(featured);
        setNewArrivals(newArrivals);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="w-12 h-12 text-primary-700 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading products</h2>
          <p className="text-gray-600 mb-8">Please wait while we fetch our premium collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold text-primary-950 leading-tight mb-6">
                Discover Premium
                <span className="block text-primary-700">Luxury Products</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                Curated collection of exceptional items crafted with attention to detail and timeless design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors group"
                >
                  Shop Collection
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center px-8 py-3 border-2 border-primary-950 text-primary-950 rounded-lg hover:bg-primary-950 hover:text-white transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative animate-slide-up">
              <img
                src="https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Premium Products"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">1000+ Happy Customers</p>
                    <p className="text-xs text-gray-600">Trusted worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Premium Quality', description: 'Carefully curated products' },
              { icon: Truck, title: 'Free Shipping', description: 'On orders over $100' },
              { icon: HeadphonesIcon, title: '24/7 Support', description: 'Always here to help' },
              { icon: Star, title: 'Top Rated', description: '4.9/5 customer rating' },
            ].map((feature, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-950" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 animate-fade-in">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Discover our handpicked selection of premium products that combine style, quality, and functionality.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-gray-500">No featured products available at the moment.</p>
              </div>
            )}
          </div>

          <div className="text-center">
            <Link
              to="/products"
              className="inline-flex items-center px-8 py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors group animate-fade-in"
            >
              View All Products
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-fade-in">
            Stay in the Loop
          </h2>
          <p className="text-primary-100 text-lg mb-8 animate-fade-in">
            Subscribe to get special offers, free giveaways, and exclusive deals.
          </p>
          <div className="max-w-md mx-auto animate-slide-up">
            <div className="flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-primary-800 bg-primary-900 text-white placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <button className="px-6 py-3 bg-white text-primary-950 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;