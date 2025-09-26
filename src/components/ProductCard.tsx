import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Eye, Zap, Award } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../contexts/WishlistContext';
import { useToast } from './Toast';
import { useReviewStats } from '../hooks/useReviewStats';
import OptimizedImage from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  index?: number;
  viewMode?: 'grid' | 'list';
  selectedSize?: string;
  selectedColor?: string;
  onSizeSelect?: (size: string) => void;
  onColorSelect?: (color: string) => void;
}

const ProductCard = ({ 
  product, 
  index = 0,
  viewMode = 'grid',
  selectedSize,
  selectedColor,
  onSizeSelect,
  onColorSelect 
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();
  const { stats: reviewStats } = useReviewStats(product._id);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [internalSelectedSize, setInternalSelectedSize] = useState<string>('');
  const [internalSelectedColor, setInternalSelectedColor] = useState<string>('');

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock || isAddingToCart) return;
    
    try {
      setIsAddingToCart(true);
      
      // Get default size and color if not selected
       let defaultSize = selectedSize || internalSelectedSize;
       let defaultColor = selectedColor || internalSelectedColor;
      
      // If no size selected and product has sizes, use first available size
      if (!defaultSize && product.sizes && product.sizes.length > 0) {
        const availableSize = product.sizes.find(s => s.stock > 0);
        defaultSize = availableSize ? availableSize.size : '';
      }
      
      // If no color selected and product has colors, use first available color
      if (!defaultColor && product.colors && product.colors.length > 0) {
        const availableColor = product.colors.find(c => c.stock > 0);
        defaultColor = availableColor ? availableColor.name : '';
      }
      
      // Check if size is required but not available
      if (product.sizes && product.sizes.length > 0 && !defaultSize) {
        showError('Size Required', 'Please select a size or view product details');
        return;
      }
      
      // Check if color is required but not available
      if (product.colors && product.colors.length > 0 && !defaultColor) {
        showError('Color Required', 'Please select a color or view product details');
        return;
      }
      
      await addItem(product, 1, defaultSize, defaultColor);
      success('Added to Cart', `${product.name} has been added to your cart`);
      
    } catch (error) {
      showError('Error', 'Failed to add item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, selectedSize, selectedColor, internalSelectedSize, internalSelectedColor, addItem, success, showError, isAddingToCart]);

  const createProductLink = () => {
    const params = new URLSearchParams();
    if (selectedSize) params.set('size', selectedSize);
    if (selectedColor) params.set('color', selectedColor);
    const queryString = params.toString();
    return `/product/${product._id}${queryString ? `?${queryString}` : ''}`;
  };

  const isWishlisted = useMemo(() => isInWishlist(product._id), [isInWishlist, product._id]);

  const handleSizeSelect = useCallback((size: string) => {
    setInternalSelectedSize(size);
    onSizeSelect?.(size);
  }, [onSizeSelect]);

  const handleColorSelect = useCallback((color: string) => {
    setInternalSelectedColor(color);
    onColorSelect?.(color);
  }, [onColorSelect]);

  const currentSelectedSize = selectedSize || internalSelectedSize;
  const currentSelectedColor = selectedColor || internalSelectedColor;

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    toggleItem(product);

  }, [toggleItem, product, isWishlisted]);
  
  const renderBadges = () => {
    const badges = [];
    
    // Handle legacy single badge field
    if (product.badge) {
      const badgeConfig = getBadgeConfig(product.badge);
      if (badgeConfig) {
        badges.push(
          <span key={product.badge} className={badgeConfig.className}>
            {badgeConfig.icon && <badgeConfig.icon className="w-3 h-3" />}
            {product.badge}
          </span>
        );
      }
    }
    
    // Handle new labels array (multiple labels support)
    if (product.labels && Array.isArray(product.labels)) {
      product.labels.forEach((label, index) => {
        const badgeConfig = getBadgeConfig(label);
        if (badgeConfig) {
          badges.push(
            <span key={`label-${index}`} className={badgeConfig.className}>
              {badgeConfig.icon && <badgeConfig.icon className="w-3 h-3" />}
              {label}
            </span>
          );
        }
      });
    }
    
    return badges;
  };

  const getBadgeConfig = (label: string) => {
    const configs: Record<string, { className: string; icon?: any }> = {
      'Sale': {
        className: 'bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1',
        icon: Zap
      },
      'New': {
        className: 'bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm'
      },
      'Popular': {
        className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1',
        icon: Award
      },
      'Hot': {
        className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1',
        icon: Zap
      },
      'Trending': {
        className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1',
        icon: Award
      },
      'Best Seller': {
        className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm flex items-center gap-1',
        icon: Award
      }
    };
    
    return configs[label] || {
      className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2 py-1 text-xs font-semibold rounded-full shadow-sm'
    };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const halfFilled = i === Math.floor(rating) && rating % 1 >= 0.5;
      
      return (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${
            filled
              ? 'text-yellow-400 fill-current'
              : halfFilled
              ? 'text-yellow-400 fill-current opacity-50'
              : 'text-gray-300'
          }`}
        />
      );
    });
  };

  if (viewMode === 'list') {
    return (
      <Link to={createProductLink()} className="group">
        <div 
          className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-200"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex p-4 gap-4">
            {/* Image */}
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
              <OptimizedImage
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${isHovered ? 'scale-105' : 'scale-100'}`}
                width={128}
                height={128}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {renderBadges()}
              </div>
              
              {/* Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:bg-white"
              >
                <Heart
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isWishlisted
                      ? 'text-red-500 fill-current'
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-950 transition-colors duration-200 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                    <span className="text-lg font-bold text-primary-950">
                      ₹{product.price}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {renderStars(reviewStats?.averageRating || product.rating || 0)}
                </div>
                <span className="text-sm text-gray-600">
                  ({reviewStats?.totalReviews || product.reviews?.length || 0} reviews)
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAddingToCart}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    product.inStock && !isAddingToCart
                      ? 'bg-primary-950 text-white hover:bg-primary-800 hover:shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className={`w-4 h-4 ${isAddingToCart ? 'animate-pulse' : ''}`} />
                  {isAddingToCart ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={createProductLink()} className="group touch-manipulation h-full">
      <div 
        className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1 sm:hover:-translate-y-2 animate-fade-in h-full flex flex-col hover:border-primary-200"
        style={{ animationDelay: `${index * 0.1}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <OptimizedImage
            src={product.image}
            alt={product.name}
            className={`w-full h-40 sm:h-48 md:h-56 object-cover transition-all duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
            width={300}
            height={256}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {renderBadges()}
          </div>

          <button 
            onClick={handleWishlistToggle}
            className={`absolute top-2 sm:top-3 right-2 sm:right-3 p-2 sm:p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white ${
              isWishlisted ? 'bg-red-50' : ''
            }`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
              isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600 hover:text-red-500'
            }`} />
          </button>

          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-black/50 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
          
          {/* Quick Actions Overlay */}
          <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                product.inStock
                  ? 'bg-white text-primary-950 hover:bg-primary-50'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {product.inStock ? 'Quick Add' : 'Out of Stock'}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-950 transition-colors duration-200 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{product.brand}</p>
            </div>

            {/* Quick Selection */}
            {(product.sizes || product.colors) && (
              <div className="mb-2 sm:mb-3 space-y-1.5 sm:space-y-2">
                {/* Sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Sizes:</p>
                    <div className="flex flex-wrap gap-1">
                      {product.sizes.slice(0, 5).map((size, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSizeSelect(size.size);
                          }}
                          className={`px-2 py-1 text-xs rounded border transition-all duration-200 ${
                            currentSelectedSize === size.size
                              ? 'bg-primary-950 text-white border-primary-950'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-primary-50 hover:border-primary-200'
                          }`}
                        >
                          {size.size}
                        </button>
                      ))}
                      {product.sizes.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-primary-600 rounded border border-gray-200">
                          +{product.sizes.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Colors:</p>
                    <div className="flex gap-2">
                      {product.colors.slice(0, 4).map((color, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleColorSelect(color.name);
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                            currentSelectedColor === color.name
                              ? 'border-primary-950 shadow-md'
                              : 'border-gray-300 hover:border-primary-200'
                          }`}
                          style={{ backgroundColor: color.hexCode }}
                          title={color.name}
                        />
                      ))}
                      {product.colors.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                          <span className="text-xs text-gray-600 font-medium">
                            +{product.colors.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Material and Gender */}
            {(product.material || product.gender) && (
              <div className="flex justify-between text-xs text-gray-500 mb-2 sm:mb-3">
                {product.material && (
                  <span className="bg-gray-50 px-2 py-1 rounded">
                    {product.material}
                  </span>
                )}
                {product.gender && (
                  <span className="bg-gray-50 px-2 py-1 rounded">
                    {product.gender}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-auto">
            {/* Rating */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <div className="flex items-center">
                {renderStars(reviewStats?.averageRating || product.rating || 0)}
              </div>
              <span className="text-xs sm:text-sm text-gray-600">
                ({reviewStats?.totalReviews || product.reviews?.length || 0})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
                <span className="text-lg sm:text-xl font-bold text-primary-950">
                  ₹{product.price}
                </span>
              </div>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation ${
                product.inStock && !isAddingToCart
                  ? 'bg-primary-950 text-white hover:bg-primary-800 hover:shadow-md active:scale-95'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isAddingToCart ? 'animate-pulse' : ''}`} />
              {isAddingToCart ? 'Adding...' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

ProductCard.displayName = 'ProductCard';

export default memo(ProductCard);