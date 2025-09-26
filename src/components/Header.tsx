import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart, Zap, ChevronDown } from 'lucide-react';
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
        const response = await api.get('/categories?active=true');
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

  const navItems = [
    { path: '/', label: 'Home', icon: null },
    { path: '/products', label: 'All Shoes', icon: null },
    { path: '/contact', label: 'Contact', icon: null },
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img 
                src="/logo-light.png" 
                alt="Solewaale Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent">Solewaale</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                  isActive(item.path)
                    ? 'text-primary-950 bg-primary-50 shadow-sm'
                    : 'text-gray-600 hover:text-primary-950 hover:bg-primary-50'
                }`}
              >
                {item.label}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-950 rounded-full" />
                )}
              </Link>
            ))}
            
            {/* Enhanced Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-950 hover:bg-gradient-to-r hover:from-primary-50 hover:to-amber-50 transition-all duration-300 hover:shadow-md">
                <div className="w-5 h-5 mr-2 bg-gradient-to-br from-primary-500 to-amber-500 rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
                Categories
                <ChevronDown className="w-4 h-4 ml-1 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Enhanced Dropdown Menu */}
              <div className="absolute top-full left-0 mt-2 w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                {/* Dropdown Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 via-blue-50 to-amber-50 rounded-t-2xl">
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-blue-500 to-amber-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-primary-600 to-amber-600 bg-clip-text text-transparent">
                            Shoe Categories
                          </h3>
                          <p className="text-sm text-gray-600">Discover your perfect style</p>
                        </div>
                      </div>
                    </div>
                </div>
                
                {/* Categories Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Dynamic Category Cards */}
                     {categories.slice(0, 6).map((category, index) => {
                       const categoryColors = [
                         'from-red-400 to-pink-500',
                         'from-blue-400 to-indigo-500', 
                         'from-green-400 to-emerald-500',
                         'from-purple-400 to-violet-500',
                         'from-orange-400 to-red-500',
                         'from-teal-400 to-cyan-500'
                       ];
                       
                       return (
                         <Link
                           key={category._id}
                           to={`/products?category=${category.slug}`}
                           className="group/card p-4 rounded-xl bg-white border border-gray-200 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 hover:border-primary-300 hover:shadow-lg transition-all duration-300 hover:scale-[1.05] relative overflow-hidden"
                         >
                           <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-amber-50/50 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                           <div className="relative text-center">
                             <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center ${category.icon ? 'bg-gray-100' : `bg-gradient-to-br ${categoryColors[index % categoryColors.length]}`} group-hover/card:shadow-lg group-hover/card:scale-110 transition-all duration-300`}>
                               {category.icon ? (
                                 <img 
                                   src={category.icon} 
                                   alt={category.name}
                                   className="w-8 h-8 object-contain"
                                 />
                               ) : (
                                 <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                                   <div className="w-3 h-3 bg-current rounded-sm opacity-80"></div>
                                 </div>
                               )}
                             </div>
                             <h4 className="text-sm font-bold text-gray-900 group-hover/card:text-primary-700 transition-colors mb-1 flex items-center justify-center">
                               {category.name}
                               {category.featured && (
                                 <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full font-medium animate-bounce">
                                   Hot
                                 </div>
                               )}
                             </h4>
                             {category.description && (
                               <p className="text-xs text-gray-500 group-hover/card:text-gray-600 transition-colors leading-relaxed">
                                 {category.description}
                               </p>
                             )}
                             <div className="mt-2 text-xs text-primary-600 font-medium opacity-0 group-hover/card:opacity-100 transition-opacity">
                               Shop Now →
                             </div>
                           </div>
                         </Link>
                       );
                     })}
                  </div>
                </div>
                

              </div>
            </div>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600 hover:text-primary-950" />
              </button>
              
              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search shoes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        autoFocus
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>
            
            <Link to="/wishlist" className="relative p-2 hover:bg-primary-50 rounded-lg transition-colors group">
              <Heart className="w-5 h-5 text-gray-600 group-hover:text-red-500 transition-colors" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-primary-50 rounded-lg transition-colors group">
              <ShoppingBag className="w-5 h-5 text-gray-600 group-hover:text-primary-950 transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-950 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link to="/profile" className="p-2 hover:bg-primary-50 rounded-lg transition-colors group">
              <User className="w-5 h-5 text-gray-600 group-hover:text-primary-950 transition-colors" />
            </Link>

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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-fade-in">
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
            
            {/* Enhanced Mobile Categories */}
            <div className="border-t border-gray-200 pt-3">
              <div className="px-3 mb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center mb-1">
                  <div className="w-6 h-6 mr-2 bg-gradient-to-br from-primary-500 via-blue-500 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <span className="bg-gradient-to-r from-primary-600 to-amber-600 bg-clip-text text-transparent">
                    Categories
                  </span>
                </h3>
                <p className="text-xs text-gray-600">Find your style</p>
              </div>
              
              <div className="px-2 space-y-2">
                {/* Dynamic Categories */}
                {categories.map((category, index) => {
                  const categoryColors = [
                    'from-red-400 to-pink-500',
                    'from-blue-400 to-indigo-500', 
                    'from-green-400 to-emerald-500',
                    'from-purple-400 to-violet-500',
                    'from-orange-400 to-red-500',
                    'from-teal-400 to-cyan-500'
                  ];
                  
                  return (
                    <Link
                      key={category._id}
                      to={`/products?category=${category.slug}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center p-3 rounded-lg bg-white border border-gray-200 hover:bg-gradient-to-r hover:from-primary-50 hover:to-amber-50 hover:border-primary-300 transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${category.icon ? 'bg-gray-100' : `bg-gradient-to-br ${categoryColors[index % categoryColors.length]}`} shadow-sm`}>
                        {category.icon ? (
                          <img 
                            src={category.icon} 
                            alt={category.name}
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <div className="w-4 h-4 bg-white rounded-md flex items-center justify-center">
                            <div className="w-2 h-2 bg-current rounded-sm opacity-80"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 flex items-center mb-0.5 truncate">
                          {category.name}
                          {category.featured && (
                            <div className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-full font-medium animate-bounce flex-shrink-0">
                              Hot
                            </div>
                          )}
                        </h4>
                        {category.description && (
                          <p className="text-xs text-gray-500 leading-tight line-clamp-1">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-0.5 text-xs text-primary-600 font-medium">
                          Shop Now →
                        </div>
                      </div>
                      <ChevronDown className="w-3 h-3 text-gray-400 rotate-[-90deg] flex-shrink-0" />
                    </Link>
                  );
                })}
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