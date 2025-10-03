import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart, Zap, ChevronDown, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../contexts/WishlistContext';
import CategoryNavigation from './CategoryNavigation';
import { api } from '../services/api';
import { Category } from '../types';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const isActive = (path: string) => {
    if (path === '/products') {
      return location.pathname === '/products' && !searchParams.get('category');
    }
    if (path.includes('category=')) {
      const categorySlug = path.split('category=')[1];
      return location.pathname === '/products' && searchParams.get('category') === categorySlug;
    }
    return location.pathname === path;
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories/hierarchical?active=true');
        // Handle different response structures
        const categoriesData = response.categories || response.data?.categories || response.data?.data || response.data || [];
        // Only show active categories, limit to 3 for header
        const activeCategories = Array.isArray(categoriesData) ? categoriesData.filter(cat => cat.isActive) : [];
        setCategories(activeCategories.slice(0, 3));
      } catch (error) {
        setCategories([]); // Set empty array on error
      }
    };

    fetchCategories();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add('no-scroll');
      
      // Prevent touch events on background
      const preventTouch = (e: TouchEvent) => {
        if (e.target && !(e.target as Element).closest('.mobile-menu-overlay')) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', preventTouch, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', preventTouch);
      };
    } else {
      document.body.classList.remove('no-scroll');
      const scrollY = document.body.style.top;
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.classList.remove('no-scroll');
      document.body.style.top = '';
    };
  }, [isMenuOpen]);

  const navItems = [
    { path: '/', name: 'Home', label: 'Home', hasSubmenu: false },
    { path: '/products', name: 'Shop', label: 'Shop', hasSubmenu: true },
    { path: '/collections', name: 'Collections', label: 'Collections', hasSubmenu: true },
    { path: '/contact', name: 'Contact', label: 'Contact', hasSubmenu: false },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchTerm.trim())}`;
      setIsSearchOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo-light.png" 
                  alt="Solewaale Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent tracking-tight">Solewaale</span>
            </Link>
          </div>

          {/* Center Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for shoes, brands, styles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white transition-all duration-200 text-sm placeholder-gray-500"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav 
            className="hidden lg:flex items-center space-x-1"
            onMouseLeave={() => {
              setActiveDropdown(null);
              setIsDropdownOpen(false);
            }}
          >
            {navItems.map((item) => (
              <div 
                key={item.path} 
                className="relative group"
                onMouseEnter={() => {
                  if (item.hasSubmenu) {
                    setActiveDropdown(item.name);
                    setIsDropdownOpen(true);
                  }
                }}
              >
                <Link
                  to={item.path}
                  className={`px-6 py-3 text-sm font-medium transition-all duration-300 relative flex items-center rounded-lg ${
                    isActive(item.path)
                      ? 'text-amber-600 bg-amber-50 shadow-sm'
                      : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50 hover:shadow-sm'
                  }`}
                >
                  {item.label}
                  {item.hasSubmenu && (
                    <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-300" />
                  )}
                  {/* Active indicator */}
                  <span className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-600 rounded-full transition-all duration-300 ${
                    isActive(item.path) ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-100'
                  }`}></span>
                </Link>
                
                {/* Mega Menu for Shop */}
                 {item.name === 'Shop' && activeDropdown === 'Shop' && isDropdownOpen && (
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 w-[900px] bg-white shadow-2xl border border-gray-100 rounded-lg opacity-100 visible transition-all duration-300 translate-y-0 z-50">
                    <div className="flex">
                      {/* Categories Section */}
                      <div className="flex-1 p-8">
                        <div className="grid grid-cols-3 gap-8">
                          {/* Dynamic Categories */}
                          {categories.length > 0 ? (
                            categories.slice(0, 3).map((category) => (
                              <div key={category._id} className="group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-amber-200 to-orange-200">
                                  <h3 className="text-xl font-bold text-gray-900 capitalize flex items-center">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                    {category.name}
                                  </h3>
                                </div>
                                <ul className="space-y-3">
                                  <li>
                                    <Link 
                                      to={`/products?category=${category.slug}`} 
                                      className="inline-flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 group-hover:shadow-md border border-amber-100 hover:border-amber-200"
                                    >
                                      <span className="font-semibold text-amber-700 hover:text-amber-800">
                                        View All {category.name}
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-amber-600" />
                                    </Link>
                                  </li>
                                  {category.subcategories && category.subcategories.slice(0, 3).map((sub) => (
                                    <li key={sub._id}>
                                      <Link 
                                        to={`/products?category=${sub.slug}`} 
                                        className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium capitalize border-l-2 border-transparent hover:border-amber-300 pl-4"
                                      >
                                        {sub.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            // Fallback static categories if no dynamic data
                            <>
                              <div className="group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-amber-200 to-orange-200">
                                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                    Men
                                  </h3>
                                </div>
                                <ul className="space-y-3">
                                  <li>
                                    <Link 
                                      to="/products?category=men" 
                                      className="inline-flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 group-hover:shadow-md border border-amber-100 hover:border-amber-200"
                                    >
                                      <span className="font-semibold text-amber-700 hover:text-amber-800">
                                        All Men's Shoes
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-amber-600" />
                                    </Link>
                                  </li>
                                  <li><Link to="/products?category=men-shoes" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link></li>
                                  <li><Link to="/products?category=men-accessories" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link></li>
                                </ul>
                              </div>
                              <div className="group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-amber-200 to-orange-200">
                                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                    Women
                                  </h3>
                                </div>
                                <ul className="space-y-3">
                                  <li>
                                    <Link 
                                      to="/products?category=women" 
                                      className="inline-flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 group-hover:shadow-md border border-amber-100 hover:border-amber-200"
                                    >
                                      <span className="font-semibold text-amber-700 hover:text-amber-800">
                                        All Women's Shoes
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-amber-600" />
                                    </Link>
                                  </li>
                                  <li><Link to="/products?category=women-shoes" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link></li>
                                  <li><Link to="/products?category=women-accessories" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link></li>
                                </ul>
                              </div>
                              <div className="group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gradient-to-r from-amber-200 to-orange-200">
                                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                                    Kids
                                  </h3>
                                </div>
                                <ul className="space-y-3">
                                  <li>
                                    <Link 
                                      to="/products?category=kids" 
                                      className="inline-flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 group-hover:shadow-md border border-amber-100 hover:border-amber-200"
                                    >
                                      <span className="font-semibold text-amber-700 hover:text-amber-800">
                                        All Kids' Shoes
                                      </span>
                                      <ArrowRight className="w-4 h-4 text-amber-600" />
                                    </Link>
                                  </li>
                                  <li><Link to="/products?category=kids-shoes" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link></li>
                                  <li><Link to="/products?category=kids-accessories" className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link></li>
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Lifestyle Images Section */}
                      <div className="w-80 bg-gradient-to-br from-amber-50 to-orange-50 p-8 flex flex-col justify-center">
                        <div className="space-y-6">
                          {/* Featured Product Image */}
                          <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-2xl shadow-lg overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop&crop=center" 
                                alt="Premium Shoes Collection" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">New Shoe Collection</h4>
                            <p className="text-gray-600 text-sm mb-4">Discover the latest footwear trends</p>
                            <Link to="/products?featured=true" className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium">
                              Shop Now
                            </Link>
                          </div>
                          
                          {/* Lifestyle Image */}
                          <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-3 bg-white rounded-xl shadow-md overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=center" 
                                alt="Premium Quality Shoes" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">Premium Quality</h5>
                            <p className="text-xs text-gray-600">Imported with care</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mega Menu for Collections */}
                 {item.name === 'Collections' && activeDropdown === 'Collections' && isDropdownOpen && (
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0 w-[800px] bg-white shadow-2xl border border-gray-100 rounded-lg opacity-100 visible transition-all duration-300 translate-y-0 z-50">
                    <div className="flex">
                      {/* Collections Section */}
                      <div className="flex-1 p-8">
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-amber-200">Featured Collections</h3>
                            <ul className="space-y-3">
                              <li><Link to="/products?collection=new-arrivals" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">New Arrivals</Link></li>
                              <li><Link to="/products?collection=seasonal-trends" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Seasonal Trends</Link></li>
                              <li><Link to="/products?collection=bestsellers" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Bestsellers</Link></li>
                            </ul>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-amber-200">Special Offers</h3>
                            <ul className="space-y-3">
                              <li><Link to="/products?sale=true" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Sale Items</Link></li>
                              <li><Link to="/products?clearance=true" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Clearance</Link></li>
                              <li><Link to="/products?bundle=true" className="text-gray-600 hover:text-amber-600 transition-colors font-medium">Bundle Deals</Link></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      {/* Collections Lifestyle Images Section */}
                      <div className="w-80 bg-gradient-to-br from-primary-50 to-primary-100 p-8 flex flex-col justify-center">
                        <div className="space-y-6">
                          {/* Featured Collection Image */}
                          <div className="text-center">
                            <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-2xl shadow-lg overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&h=200&fit=crop&crop=center" 
                                alt="Trending Shoe Collection" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">Trending Shoes</h4>
                            <p className="text-gray-600 text-sm mb-4">Discover what's hot in footwear</p>
                            <Link to="/products?trending=true" className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                              Explore Now
                            </Link>
                          </div>
                          
                          {/* Lifestyle Image */}
                          <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-3 bg-white rounded-xl shadow-md overflow-hidden">
                              <img 
                                src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=150&h=150&fit=crop&crop=center" 
                                alt="Curated Shoe Selection" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h5 className="font-semibold text-gray-900 mb-1">Curated Selection</h5>
                            <p className="text-xs text-gray-600">Hand-picked shoes for you</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          </nav>

          {/* Right side icons - Desktop only */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link to="/wishlist" className="relative p-3 hover:bg-gray-50 rounded-full transition-all duration-200 group">
              <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-3 hover:bg-gray-50 rounded-full transition-all duration-200 group">
              <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-amber-600 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link to="/profile" className="p-3 hover:bg-gray-50 rounded-full transition-all duration-200 group">
              <User className="w-5 h-5 text-gray-600 group-hover:text-amber-600 transition-colors" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-menu-overlay lg:hidden animate-fade-in border-t border-gray-200 py-4">
            {/* Close Button */}
            <div className="flex justify-end px-4 mb-4">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <nav className="space-y-2 mb-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-primary-950 bg-primary-50 shadow-sm'
                      : 'text-gray-600 hover:text-primary-950 hover:bg-primary-50'
                  }`}
                >
                  {item.label}
                  {isActive(item.path) && (
                    <div className="ml-auto w-2 h-2 bg-primary-950 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
            
            {/* Enhanced Mobile Categories - Desktop Style */}
            <div className="border-t border-gray-200 pt-4">
              <div className="px-3 mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                  <div className="w-6 h-6 mr-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Shop Categories
                  </span>
                </h3>
                <p className="text-sm text-gray-600">Explore our complete collection</p>
              </div>
              
              <div className="px-3 space-y-6">
                {/* Dynamic Categories with Desktop-like Structure */}
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category._id} className="group">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                        <h4 className="text-base font-bold text-gray-900 capitalize flex items-center">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                          {category.name}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <Link 
                          to={`/products?category=${category.slug}`}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 border border-amber-100 hover:border-amber-200 shadow-sm hover:shadow-md"
                        >
                          <span className="font-semibold text-amber-700 hover:text-amber-800">
                            View All {category.name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                        </Link>
                        {category.subcategories && category.subcategories.slice(0, 3).map((sub) => (
                          <Link 
                            key={sub._id}
                            to={`/products?category=${sub.slug}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium capitalize border-l-2 border-transparent hover:border-amber-300 pl-4"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback static categories if no dynamic data
                  <>
                    <div className="group">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                        <h4 className="text-base font-bold text-gray-900 flex items-center">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                          Men
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <Link 
                          to="/products?category=men"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 border border-amber-100 hover:border-amber-200 shadow-sm hover:shadow-md"
                        >
                          <span className="font-semibold text-amber-700 hover:text-amber-800">
                            All Men's Shoes
                          </span>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                        </Link>
                        <Link to="/products?category=men-shoes" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link>
                        <Link to="/products?category=men-accessories" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link>
                      </div>
                    </div>
                    <div className="group">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                        <h4 className="text-base font-bold text-gray-900 flex items-center">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                          Women
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <Link 
                          to="/products?category=women"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 border border-amber-100 hover:border-amber-200 shadow-sm hover:shadow-md"
                        >
                          <span className="font-semibold text-amber-700 hover:text-amber-800">
                            All Women's Shoes
                          </span>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                        </Link>
                        <Link to="/products?category=women-shoes" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link>
                        <Link to="/products?category=women-accessories" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link>
                      </div>
                    </div>
                    <div className="group">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200">
                        <h4 className="text-base font-bold text-gray-900 flex items-center">
                          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                          Kids
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <Link 
                          to="/products?category=kids"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg transition-all duration-300 border border-amber-100 hover:border-amber-200 shadow-sm hover:shadow-md"
                        >
                          <span className="font-semibold text-amber-700 hover:text-amber-800">
                            All Kids' Shoes
                          </span>
                          <ArrowRight className="w-4 h-4 text-amber-600" />
                        </Link>
                        <Link to="/products?category=kids-shoes" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Shoes</Link>
                        <Link to="/products?category=kids-accessories" onClick={() => setIsMenuOpen(false)} className="block p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all duration-200 font-medium border-l-2 border-transparent hover:border-amber-300 pl-4">Accessories</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
            
            {/* Mobile Search */}
            <div className="border-t border-gray-200 pt-4 px-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search shoes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg mobile-safe-area">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group touch-target"
            >
              <Search className="w-6 h-6 text-gray-600 group-hover:text-amber-600 transition-colors mb-1" />
              <span className="text-xs text-gray-600 group-hover:text-amber-600 transition-colors">Search</span>
            </button>
            
            {/* Mobile Search Modal */}
            {isSearchOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 mx-4 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Search Products</h3>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search for shoes, brands, styles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-4 bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                      Search
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist */}
          <Link to="/wishlist" className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group relative touch-target">
            <Heart className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors mb-1" />
            <span className="text-xs text-gray-600 group-hover:text-red-500 transition-colors">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group relative touch-target">
            <ShoppingBag className="w-6 h-6 text-gray-600 group-hover:text-amber-600 transition-colors mb-1" />
            <span className="text-xs text-gray-600 group-hover:text-amber-600 transition-colors">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1 right-1 bg-amber-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link to="/profile" className="flex flex-col items-center p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 group touch-target">
            <User className="w-6 h-6 text-gray-600 group-hover:text-amber-600 transition-colors mb-1" />
            <span className="text-xs text-gray-600 group-hover:text-amber-600 transition-colors">Profile</span>
          </Link>
        </div>
      </div>

      {/* Click outside to close search */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSearchOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;