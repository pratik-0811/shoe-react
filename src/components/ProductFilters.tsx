import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Product, Category } from '../types';
import api from '../services/api';

interface FilterOptions {
  categories: Category[];
  brands: string[];
  colors: { name: string; hexCode: string }[];
  sizes: string[];
  priceRange: { min: number; max: number };
  materials: string[];
  genders: string[];
}

interface ActiveFilters {
  category: string;
  brand: string;
  colors: string[];
  sizes: string[];
  priceMin: number;
  priceMax: number;
  material: string;
  gender: string;
}

interface ProductFiltersProps {
  onFiltersChange: (filters: ActiveFilters) => void;
  activeFilters: ActiveFilters;
  isLoading?: boolean;
  className?: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  onFiltersChange,
  activeFilters,
  isLoading = false,
  className = ''
}) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    priceRange: { min: 0, max: 10000 },
    materials: [],
    genders: []
  });
  
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    brand: false,
    color: false,
    size: false,
    price: false,
    material: false,
    gender: false
  });
  
  const [localPriceRange, setLocalPriceRange] = useState({
    min: activeFilters.priceMin,
    max: activeFilters.priceMax
  });

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          api.get('/categories?active=true'),
          api.get('/products')
        ]);
        
        const categories = categoriesRes.categories || categoriesRes.data?.categories || [];
        const products = productsRes.products || productsRes.data?.products || [];
        
        // Extract unique filter options from products
        const brands = [...new Set(products.map((p: Product) => p.brand).filter(Boolean))];
        const colors = products.reduce((acc: any[], p: Product) => {
          if (p.colors) {
            p.colors.forEach(color => {
              if (!acc.find(c => c.name === color.name)) {
                acc.push(color);
              }
            });
          }
          return acc;
        }, []);
        
        const sizes = [...new Set(products.flatMap((p: Product) => 
          p.sizes ? p.sizes.map(s => s.size) : []
        ))].sort((a, b) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          return numA - numB;
        });
        
        const prices = products.map((p: Product) => p.price).filter(Boolean);
        const priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
        
        const materials = [...new Set(products.map((p: Product) => p.material).filter(Boolean))];
        const genders = [...new Set(products.map((p: Product) => p.gender).filter(Boolean))];
        
        setFilterOptions({
          categories,
          brands,
          colors,
          sizes,
          priceRange,
          materials,
          genders
        });
        
        // Initialize price range if not set
        if (activeFilters.priceMin === 0 && activeFilters.priceMax === 0) {
          setLocalPriceRange(priceRange);
          onFiltersChange({
            ...activeFilters,
            priceMin: priceRange.min,
            priceMax: priceRange.max
          });
        }
      } catch (error) {
        // Silent fail for filter options
      }
    };
    
    fetchFilterOptions();
  }, []);

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleFilterChange = useCallback((key: keyof ActiveFilters, value: any) => {
    const newFilters = { ...activeFilters, [key]: value };
    onFiltersChange(newFilters);
  }, [activeFilters, onFiltersChange]);

  const handleArrayFilterToggle = useCallback((key: 'colors' | 'sizes', value: string) => {
    const currentArray = activeFilters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    handleFilterChange(key, newArray);
  }, [activeFilters, handleFilterChange]);

  const handlePriceChange = useCallback((type: 'min' | 'max', value: number) => {
    const newRange = { ...localPriceRange, [type]: value };
    setLocalPriceRange(newRange);
    
    // Debounce the filter update
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...activeFilters,
        priceMin: newRange.min,
        priceMax: newRange.max
      });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [localPriceRange, activeFilters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters: ActiveFilters = {
      category: '',
      brand: '',
      colors: [],
      sizes: [],
      priceMin: filterOptions.priceRange.min,
      priceMax: filterOptions.priceRange.max,
      material: '',
      gender: ''
    };
    setLocalPriceRange(filterOptions.priceRange);
    onFiltersChange(clearedFilters);
  }, [filterOptions.priceRange, onFiltersChange]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.category) count++;
    if (activeFilters.brand) count++;
    if (activeFilters.colors.length > 0) count++;
    if (activeFilters.sizes.length > 0) count++;
    if (activeFilters.priceMin !== filterOptions.priceRange.min || 
        activeFilters.priceMax !== filterOptions.priceRange.max) count++;
    if (activeFilters.material) count++;
    if (activeFilters.gender) count++;
    return count;
  }, [activeFilters, filterOptions.priceRange]);

  const FilterSection: React.FC<{
    title: string;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
  }> = ({ title, sectionKey, children }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full py-2 text-left font-medium text-gray-900 hover:text-primary-950 transition-colors"
      >
        <span>{title}</span>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="bg-primary-950 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary-950 hover:text-primary-800 font-medium flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4 space-y-6 max-h-96 overflow-y-auto">
        {/* Category Filter */}
        <FilterSection title="Category" sectionKey="category">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value=""
                checked={activeFilters.category === ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="mr-2 text-primary-950 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">All Categories</span>
            </label>
            {filterOptions.categories.map((category) => (
              <label key={category._id} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  checked={activeFilters.category === category.slug}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="mr-2 text-primary-950 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Brand Filter */}
        <FilterSection title="Brand" sectionKey="brand">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="brand"
                value=""
                checked={activeFilters.brand === ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="mr-2 text-primary-950 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">All Brands</span>
            </label>
            {filterOptions.brands.map((brand) => (
              <label key={brand} className="flex items-center">
                <input
                  type="radio"
                  name="brand"
                  value={brand}
                  checked={activeFilters.brand === brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="mr-2 text-primary-950 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Color Filter */}
        <FilterSection title="Colors" sectionKey="color">
          <div className="grid grid-cols-4 gap-2">
            {filterOptions.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleArrayFilterToggle('colors', color.name)}
                className={`relative w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                  activeFilters.colors.includes(color.name)
                    ? 'border-primary-950 ring-2 ring-primary-200'
                    : 'border-gray-300 hover:border-primary-400'
                }`}
                style={{ backgroundColor: color.hexCode }}
                title={color.name}
              >
                {activeFilters.colors.includes(color.name) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Size Filter */}
        <FilterSection title="Sizes" sectionKey="size">
          <div className="grid grid-cols-4 gap-2">
            {filterOptions.sizes.map((size) => (
              <button
                key={size}
                onClick={() => handleArrayFilterToggle('sizes', size)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  activeFilters.sizes.includes(size)
                    ? 'bg-primary-950 text-white border-primary-950'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range Filter */}
        <FilterSection title="Price Range" sectionKey="price">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  value={localPriceRange.min}
                  onChange={(e) => handlePriceChange('min', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  value={localPriceRange.max}
                  onChange={(e) => handlePriceChange('max', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min={filterOptions.priceRange.min}
                  max={filterOptions.priceRange.max}
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              ₹{localPriceRange.min.toLocaleString()} - ₹{localPriceRange.max.toLocaleString()}
            </div>
          </div>
        </FilterSection>

        {/* Material Filter */}
        <FilterSection title="Material" sectionKey="material">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="material"
                value=""
                checked={activeFilters.material === ''}
                onChange={(e) => handleFilterChange('material', e.target.value)}
                className="mr-2 text-primary-950 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">All Materials</span>
            </label>
            {filterOptions.materials.map((material) => (
              <label key={material} className="flex items-center">
                <input
                  type="radio"
                  name="material"
                  value={material}
                  checked={activeFilters.material === material}
                  onChange={(e) => handleFilterChange('material', e.target.value)}
                  className="mr-2 text-primary-950 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{material}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Gender Filter */}
        <FilterSection title="Gender" sectionKey="gender">
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="gender"
                value=""
                checked={activeFilters.gender === ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="mr-2 text-primary-950 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
            {filterOptions.genders.map((gender) => (
              <label key={gender} className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={activeFilters.gender === gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="mr-2 text-primary-950 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{gender}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default ProductFilters;