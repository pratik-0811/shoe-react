import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight, Grid3X3, Sparkles } from 'lucide-react';
import { Category } from '../types';
import api from '../services/api';

interface CategoryNavigationProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'grid';
  showAllOption?: boolean;
  maxItems?: number;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  className = '',
  variant = 'horizontal',
  showAllOption = true,
  maxItems
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/categories/hierarchical?active=true');
        const categoriesData = response.categories || response.data?.categories || response.data?.data || response.data || [];
        const activeCategories = Array.isArray(categoriesData) ? categoriesData.filter(cat => cat.isActive) : [];
        
        // Limit categories if maxItems is specified
        const limitedCategories = maxItems ? activeCategories.slice(0, maxItems) : activeCategories;
        setCategories(limitedCategories);
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [maxItems]);

  const isActiveCategory = (categorySlug: string) => {
    return activeCategory === categorySlug;
  };

  const isAllProductsActive = () => {
    return location.pathname === '/products' && !activeCategory;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {variant === 'horizontal' && (
          <div className="flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg w-24" />
            ))}
          </div>
        )}
        {variant === 'vertical' && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg" />
            ))}
          </div>
        )}
        {variant === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Horizontal Navigation (for header/top navigation)
  if (variant === 'horizontal') {
    return (
      <nav className={`flex items-center space-x-1 overflow-x-auto scrollbar-hide ${className}`}>
        {showAllOption && (
          <Link
            to="/products"
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isAllProductsActive()
                ? 'bg-primary-950 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-primary-950 hover:bg-primary-50 hover:shadow-md'
            }`}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            All Shoes
          </Link>
        )}
        
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/products?category=${category.slug}`}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActiveCategory(category.slug)
                ? 'bg-primary-950 text-white shadow-lg transform scale-105 ring-2 ring-primary-200'
                : 'text-gray-600 hover:text-primary-950 hover:bg-primary-50 hover:shadow-md'
            }`}
          >
            {category.featured && (
              <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
            )}
            {category.name}
            {isActiveCategory(category.slug) && (
              <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </Link>
        ))}
      </nav>
    );
  }

  // Vertical Navigation (for sidebar)
  if (variant === 'vertical') {
    return (
      <nav className={`space-y-1 ${className}`}>
        {showAllOption && (
          <Link
            to="/products"
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isAllProductsActive()
                ? 'bg-primary-950 text-white shadow-lg'
                : 'text-gray-700 hover:text-primary-950 hover:bg-primary-50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center">
              <Grid3X3 className="w-5 h-5 mr-3" />
              <span>All Shoes</span>
            </div>
            {isAllProductsActive() ? (
              <div className="w-2 h-2 bg-white rounded-full" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </Link>
        )}
        
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/products?category=${category.slug}`}
            className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
              isActiveCategory(category.slug)
                ? 'bg-primary-950 text-white shadow-lg ring-2 ring-primary-200'
                : 'text-gray-700 hover:text-primary-950 hover:bg-primary-50 hover:shadow-md'
            }`}
          >
            <div className="flex items-center">
              {category.icon && (
                <img 
                  src={category.icon} 
                  alt={category.name}
                  className="w-5 h-5 mr-3 object-contain"
                />
              )}
              {!category.icon && (
                <div className="w-5 h-5 mr-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded" />
              )}
              <span>{category.name}</span>
              {category.featured && (
                <Sparkles className="w-4 h-4 ml-2 text-yellow-500" />
              )}
            </div>
            {isActiveCategory(category.slug) ? (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </Link>
        ))}
      </nav>
    );
  }

  // Grid Navigation (for homepage or category pages)
  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
        {showAllOption && (
          <Link
            to="/products"
            className={`relative group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              isAllProductsActive()
                ? 'border-primary-950 bg-primary-950 text-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center ${
                isAllProductsActive() ? 'bg-white/20' : 'bg-primary-100'
              }`}>
                <Grid3X3 className={`w-6 h-6 ${
                  isAllProductsActive() ? 'text-white' : 'text-primary-950'
                }`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">All Shoes</h3>
              <p className={`text-xs ${
                isAllProductsActive() ? 'text-white/80' : 'text-gray-600'
              }`}>
                Browse all products
              </p>
            </div>
            {isAllProductsActive() && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full animate-pulse" />
            )}
          </Link>
        )}
        
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/products?category=${category.slug}`}
            className={`relative group p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              isActiveCategory(category.slug)
                ? 'border-primary-950 bg-primary-950 text-white shadow-lg ring-2 ring-primary-200'
                : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center overflow-hidden ${
                isActiveCategory(category.slug) ? 'bg-white/20' : 'bg-primary-100'
              }`}>
                {category.icon ? (
                  <img 
                    src={category.icon} 
                    alt={category.name}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded bg-gradient-to-br from-primary-400 to-primary-600 ${
                    isActiveCategory(category.slug) ? 'from-white/40 to-white/60' : ''
                  }`} />
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 flex items-center justify-center">
                {category.name}
                {category.featured && (
                  <Sparkles className="w-3 h-3 ml-1 text-yellow-500" />
                )}
              </h3>
              <p className={`text-xs ${
                isActiveCategory(category.slug) ? 'text-white/80' : 'text-gray-600'
              }`}>
                {category.description || 'Explore collection'}
              </p>
            </div>
            {isActiveCategory(category.slug) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full animate-pulse" />
            )}
          </Link>
        ))}
      </div>
    );
  }

  return null;
};

export default CategoryNavigation;