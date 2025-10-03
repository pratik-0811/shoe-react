import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, AlertCircle, RefreshCw, Sparkles, SlidersHorizontal, X, Grid, List, ChevronDown, Eye } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { ProductListSkeleton } from '../components/Loading';
import { useToast } from '../components/Toast';
import ResponsiveContainer from '../components/ResponsiveContainer';
import ResponsiveGrid from '../components/ResponsiveGrid';
import ProductFilters from '../components/ProductFilters';
import CategoryNavigation from '../components/CategoryNavigation';
import SEO from '../components/SEO';
import productService from '../services/productService';
import api from '../services/api';
import { Product, Category } from '../types';

const Products = React.memo(() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: showError, success } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSizes, setSelectedSizes] = useState<{[key: string]: string}>({});
  const [selectedColors, setSelectedColors] = useState<{[key: string]: string}>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  
  // Enhanced filter state
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    brand: '',
    colors: [] as string[],
    sizes: [] as string[],
    priceMin: 0,
    priceMax: 10000,
    material: '',
    gender: '',
    collection: ''
  });

  // Sync selectedCategory and collection with URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || 'all';
    const collectionFromUrl = searchParams.get('collection') || '';
    setSelectedCategory(categoryFromUrl);
    setActiveFilters(prev => ({ 
      ...prev, 
      category: categoryFromUrl === 'all' ? '' : categoryFromUrl,
      collection: collectionFromUrl
    }));
  }, [searchParams]);
  
  // Handle filter changes with URL updates
  const handleFiltersChange = useCallback((newFilters: typeof activeFilters) => {
    setActiveFilters(newFilters);
    
    // Update URL params for SEO-friendly filtering
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (newFilters.category) {
      newSearchParams.set('category', newFilters.category);
    } else {
      newSearchParams.delete('category');
    }
    
    if (newFilters.brand) {
      newSearchParams.set('brand', newFilters.brand);
    } else {
      newSearchParams.delete('brand');
    }
    
    if (newFilters.colors.length > 0) {
      newSearchParams.set('colors', newFilters.colors.join(','));
    } else {
      newSearchParams.delete('colors');
    }
    
    if (newFilters.sizes.length > 0) {
      newSearchParams.set('sizes', newFilters.sizes.join(','));
    } else {
      newSearchParams.delete('sizes');
    }
    
    if (newFilters.priceMin > 0 || newFilters.priceMax < 10000) {
      newSearchParams.set('priceMin', newFilters.priceMin.toString());
      newSearchParams.set('priceMax', newFilters.priceMax.toString());
    } else {
      newSearchParams.delete('priceMin');
      newSearchParams.delete('priceMax');
    }
    
    if (newFilters.collection) {
      newSearchParams.set('collection', newFilters.collection);
    } else {
      newSearchParams.delete('collection');
    }
    
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSizeSelect = useCallback((productId: string, size: string) => {
    setSelectedSizes(prev => ({ ...prev, [productId]: size }));
  }, []);

const handleColorSelect = useCallback((productId: string, color: string) => {
    setSelectedColors(prev => ({ ...prev, [productId]: color }));
  }, []);

  // Generate SEO data - moved before conditional returns
  const seoTitle = useMemo(() => {
    let title = 'Premium Footwear Collection';
    if (activeFilters.collection) {
      const collectionTitles = {
        'new-arrivals': 'New Arrivals - Latest Shoe Collection',
        'bestsellers': 'Bestsellers - Top Rated Shoes',
        'seasonal-trends': 'Seasonal Trends - Trending Footwear',
        'sale': 'Sale - Discounted Shoes',
        'clearance': 'Clearance - Shoes on Sale',
        'bundle': 'Bundle Deals - Special Offers',
        'featured': 'Featured Collection - Premium Shoes',
        'trending': 'Trending Now - Popular Footwear'
      };
      title = collectionTitles[activeFilters.collection] || title;
    } else if (selectedCategory && selectedCategory !== 'all') {
      const categoryName = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory;
      title = `${categoryName} Shoes`;
    }
    if (searchTerm) {
      title = `Search Results for "${searchTerm}"`;
    }
    return title;
  }, [selectedCategory, searchTerm, categories, activeFilters.collection]);

  const seoDescription = useMemo(() => {
    let description = 'Discover our premium collection of shoes for men and women. Quality footwear with style, comfort, and durability.';
    if (activeFilters.collection) {
      const collectionDescriptions = {
        'new-arrivals': 'Discover the latest shoe arrivals. Fresh styles and newest footwear trends just added to our collection.',
        'bestsellers': 'Shop our bestselling shoes. Top-rated footwear loved by customers for quality and style.',
        'seasonal-trends': 'Explore seasonal shoe trends. Stay fashionable with our curated collection of trending footwear.',
        'sale': 'Find amazing deals on quality shoes. Discounted footwear without compromising on style or comfort.',
        'clearance': 'Huge savings on clearance shoes. Limited time offers on premium footwear with deep discounts.',
        'bundle': 'Special bundle deals on shoes. Save more when you buy multiple pairs from our collection.',
        'featured': 'Our featured shoe collection. Handpicked premium footwear showcasing the best of our inventory.',
        'trending': 'Trending shoes everyone is talking about. Popular footwear styles that are in high demand.'
      };
      description = collectionDescriptions[activeFilters.collection] || description;
    } else if (selectedCategory && selectedCategory !== 'all') {
      const categoryName = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory;
      description = `Shop ${categoryName.toLowerCase()} shoes. Find the perfect pair from our curated collection of premium footwear.`;
    }
    if (searchTerm) {
      description = `Search results for "${searchTerm}". Browse our shoe collection for matching products.`;
    }
    return description;
  }, [selectedCategory, searchTerm, categories, activeFilters.collection]);

  const seoKeywords = useMemo(() => {
    let keywords = 'shoes, footwear, sneakers, boots, sandals, men shoes, women shoes, premium shoes';
    if (activeFilters.collection) {
      const collectionKeywords = {
        'new-arrivals': 'new arrivals, latest shoes, new footwear, fresh styles',
        'bestsellers': 'bestsellers, top rated, popular shoes, customer favorites',
        'seasonal-trends': 'seasonal trends, trending footwear, fashion shoes, stylish',
        'sale': 'sale shoes, discounted footwear, cheap shoes, deals',
        'clearance': 'clearance, clearance shoes, discount footwear, bargain shoes',
        'bundle': 'bundle deals, shoe bundles, multiple pairs, special offers',
        'featured': 'featured collection, premium shoes, curated footwear, exclusive',
        'trending': 'trending shoes, popular footwear, hot styles, in demand'
      };
      const collectionKw = collectionKeywords[activeFilters.collection] || '';
      keywords = `${collectionKw}, ${keywords}`;
    } else if (selectedCategory && selectedCategory !== 'all') {
      const categoryName = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory;
      keywords = `${categoryName.toLowerCase()}, ${categoryName.toLowerCase()} shoes, ${keywords}`;
    }
    if (activeFilters.brand) {
      keywords = `${activeFilters.brand}, ${keywords}`;
    }
    return keywords;
  }, [selectedCategory, activeFilters.brand, activeFilters.collection, categories]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
  
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        api.get('/categories')
      ]);
      
      // Ensure productsData is an array
      const validProducts = Array.isArray(productsData) ? productsData : [];
      setProducts(validProducts);
      
      // Ensure categoriesData has the expected structure
      const validCategories = Array.isArray(categoriesData?.categories) ? categoriesData.categories : 
                             Array.isArray(categoriesData?.data) ? categoriesData.data : 
                             Array.isArray(categoriesData) ? categoriesData : [];
      // Use all categories instead of filtering by isActive
      const activeCategories = validCategories;
      
      // Calculate category counts from products
      const categoryCounts = activeCategories.reduce((acc: (Category & { count: number })[], category: Category) => {
        const count = validProducts.filter((product: Product) => {
          return typeof product.category === 'object' 
            ? product.category._id === category._id
            : product.category === category._id;
        }).length;
        if (count > 0) {
          acc.push({ ...category, count });
        }
        return acc;
      }, []);
      
      // Add "All" category
      const formattedCategories = [
        { _id: 'all', name: 'All Shoes', slug: 'all', count: validProducts.length, isActive: true, description: '', image: '' },
        ...categoryCounts
      ];
      setCategories(formattedCategories);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shoes';
      setError(errorMessage);
      showError('Loading Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    // Ensure products is an array before filtering
    if (!Array.isArray(products)) {
      return [];
    }

    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        if (typeof product.category === 'object') {
          return product.category._id === selectedCategory || product.category.slug === selectedCategory;
        }
        return product.category === selectedCategory;
      });
    }

    // Enhanced filtering with activeFilters
    if (activeFilters.brand) {
      filtered = filtered.filter(product => product.brand === activeFilters.brand);
    }
    
    if (activeFilters.colors.length > 0) {
      filtered = filtered.filter(product => 
        product.colors && product.colors.some(color => activeFilters.colors.includes(color.name))
      );
    }
    
    if (activeFilters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes && product.sizes.some(size => activeFilters.sizes.includes(size.size))
      );
    }
    
    if (activeFilters.priceMin > 0 || activeFilters.priceMax < 10000) {
      filtered = filtered.filter(product => 
        product.price >= activeFilters.priceMin && product.price <= activeFilters.priceMax
      );
    }
    
    if (activeFilters.material) {
      filtered = filtered.filter(product => product.material === activeFilters.material);
    }
    
    if (activeFilters.gender) {
      filtered = filtered.filter(product => product.gender === activeFilters.gender);
    }

    // Filter by collection
    if (activeFilters.collection) {
      switch (activeFilters.collection) {
        case 'new-arrivals':
          // Sort by creation date and take recent products
          filtered = filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          break;
        case 'bestsellers':
          // Filter by high rating or popularity
          filtered = filtered.filter(product => (product.rating || 0) >= 4.0);
          break;
        case 'seasonal-trends':
          // Filter by seasonal products or trending items
          filtered = filtered.filter(product => product.badge === 'trending' || product.season === 'current');
          break;
        case 'sale':
          // Filter by discounted products
          filtered = filtered.filter(product => product.discounted_price && product.discounted_price < product.price);
          break;
        case 'clearance':
          // Filter by clearance items (high discount)
          filtered = filtered.filter(product => {
            if (product.discounted_price && product.price) {
              const discount = ((product.price - product.discounted_price) / product.price) * 100;
              return discount >= 30; // 30% or more discount
            }
            return false;
          });
          break;
        case 'bundle':
          // Filter by bundle deals or featured products
          filtered = filtered.filter(product => product.isFeatured || product.badge === 'bundle');
          break;
        case 'featured':
          filtered = filtered.filter(product => product.isFeatured);
          break;
        case 'trending':
          filtered = filtered.filter(product => product.badge === 'trending');
          break;
        default:
          break;
      }
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      );
    }

    // Sort products
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'popular':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return filtered;
  }, [products, selectedCategory, searchTerm, sortBy, activeFilters]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    const newFilters = { ...activeFilters, category: category === 'all' ? '' : category };
    handleFiltersChange(newFilters);
  }, [activeFilters, handleFiltersChange]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setError(null);
    
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        api.get('/categories')
      ]);
      
      setProducts(productsData);
      
      // Calculate category counts from products
      const categoryCounts = categoriesData.categories.reduce((acc: (Category & { count: number })[], category: Category) => {
        const count = productsData.filter((product: Product) => {
          return typeof product.category === 'object' 
            ? product.category._id === category._id
            : product.category === category._id;
        }).length;
        if (count > 0) {
          acc.push({ ...category, count });
        }
        return acc;
      }, []);
      
      // Add "All" category
      const formattedCategories = [
        { _id: 'all', name: 'All Shoes', slug: 'all', count: productsData.length, isActive: true, description: '', image: '' },
        ...categoryCounts
      ];
      setCategories(formattedCategories);
      
      setError(null);
      success('Success', 'Products loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load shoes';
      setError(errorMessage);
      showError('Retry Failed', errorMessage);
    } finally {
      setRetrying(false);
    }
  }, [success, showError]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('all');
    const clearedFilters = {
      category: '',
      brand: '',
      colors: [],
      sizes: [],
      priceMin: 0,
      priceMax: 10000,
      material: '',
      gender: ''
    };
    setActiveFilters(clearedFilters);
    setSelectedSizes({});
    setSelectedColors({});
    setSearchParams({});
  }, [setSearchParams]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResponsiveContainer>
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="mb-6 sm:mb-8 animate-fade-in">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-3 sm:mb-4 animate-pulse"></div>
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4 sm:w-1/2 animate-pulse"></div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
              <div className="h-8 sm:h-10 bg-gray-200 rounded mb-3 sm:mb-4 animate-pulse"></div>
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 sm:h-8 bg-gray-200 rounded-full w-16 sm:w-20 animate-pulse"></div>
                ))}
              </div>
            </div>
            <ProductListSkeleton count={8} />
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className={`inline-flex items-center px-8 py-3 rounded-lg transition-colors space-x-2 ${
              retrying 
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-primary-950 text-white hover:bg-primary-800'
            }`}
          >
            {retrying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }



  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        type="website"
        url={window.location.href}
      />
      <div className="min-h-screen bg-gray-50">
      <ResponsiveContainer>
        <div className="py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center">
                  Our Shoes
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ml-1 sm:ml-2 text-yellow-500" />
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">Discover our carefully curated collection of premium footwear.</p>
              </div>
              <div className="hidden md:flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-primary-950 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-primary-950 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            {/* Enhanced Category Navigation */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 lg:mb-6">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 touch-manipulation ${
                  selectedCategory === 'all' 
                    ? 'bg-primary-950 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.filter(cat => cat._id !== 'all').map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryChange(category._id)}
                  className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base font-medium transition-all duration-200 touch-manipulation ${
                    selectedCategory === category._id 
                      ? 'bg-primary-950 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Search and Filter Controls */}
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8 animate-slide-up">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              {/* Search */}
              <div className="relative flex-1 w-full sm:max-w-md lg:max-w-lg">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <input
                  type="text"
                  placeholder="Search shoes by name, brand, or description..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors touch-manipulation shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              {/* Sort and Filter Toggle */}
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="appearance-none w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors touch-manipulation shadow-sm pr-6 sm:pr-7 lg:pr-8"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none" />
                </div>

                <button
                  onClick={handleToggleFilters}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm lg:text-base">Filters</span>
                  {Object.values(activeFilters).some(filter => 
                    Array.isArray(filter) ? filter.length > 0 : filter !== '' && filter !== 0 && filter !== 10000
                  ) && (
                    <span className="ml-1 sm:ml-2 bg-white text-primary-950 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryChange(category._id)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                      selectedCategory === category._id
                        ? 'bg-primary-950 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-800 active:bg-primary-200'
                    }`}
                  >
                    <span className="line-clamp-1">{category.name} ({category.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Enhanced Filter Panel */}
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            {showFilters && (
              <div className="w-80 flex-shrink-0">
                <ProductFilters
                  activeFilters={activeFilters}
                  onFiltersChange={handleFiltersChange}
                  isLoading={loading}
                />
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex-1">

          {/* Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="text-xs sm:text-sm lg:text-base text-gray-600">
              {filteredAndSortedProducts.length === 0 ? (
                'No shoes found'
              ) : (
                `Showing ${filteredAndSortedProducts.length} of ${products.length} shoes`
              )}
              {searchTerm && (
                <span className="ml-1 sm:ml-2 text-primary-600 font-medium">
                  for "{searchTerm}"
                </span>
              )}
            </div>
          </div>



              {/* Products Grid/List */}
              {viewMode === 'list' ? (
                <div className="space-y-4 mb-8">
                  {filteredAndSortedProducts.map((product, index) => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      index={index}
                      viewMode="list"
                      selectedSize={selectedSizes[product._id]}
                      selectedColor={selectedColors[product._id]}
                      onSizeSelect={(size) => handleSizeSelect(product._id, size)}
                      onColorSelect={(color) => handleColorSelect(product._id, color)}
                    />
                  ))}
                </div>
              ) : (
                <ResponsiveGrid 
                  cols={{ default: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
                  gap="sm"
                  minItemWidth="240px"
                  className="mb-8"
                >
                  {filteredAndSortedProducts.map((product, index) => (
                    <ProductCard 
                      key={product._id} 
                      product={product} 
                      index={index}
                      viewMode="grid"
                      selectedSize={selectedSizes[product._id]}
                      selectedColor={selectedColors[product._id]}
                      onSizeSelect={(size) => handleSizeSelect(product._id, size)}
                      onColorSelect={(color) => handleColorSelect(product._id, color)}
                    />
                  ))}
                </ResponsiveGrid>
              )}
            </div>
          </div>

          {/* No Results */}
          {filteredAndSortedProducts.length === 0 && (
            <div className="text-center py-8 sm:py-12 animate-fade-in">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">No shoes found</h3>
              <p className="text-base text-gray-600 mb-4 px-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2 sm:py-3 text-base bg-primary-950 text-white rounded-lg hover:bg-primary-800 transition-colors touch-manipulation"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </div>
    </>
  );
});

export default Products;