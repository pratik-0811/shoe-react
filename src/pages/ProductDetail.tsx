import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check, ArrowLeft, Share2, ThumbsUp, Shield, Truck, RotateCcw } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { ProductDetailSkeleton } from '../components/Loading';
import SEO from '../components/SEO';
import ReviewSection from '../components/ReviewSection';
import ReviewSlider from '../components/ReviewSlider';
import ProductRecommendations from '../components/ProductRecommendations';
import { useReviewStats } from '../hooks/useReviewStats';
import productService from '../services/productService';
import { Product } from '../types';

const ProductDetail = React.memo(() => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productReviews, setProductReviews] = useState<{ rating: number }[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const { stats: reviewStats, refetch: refetchReviewStats } = useReviewStats(id || '');

  // Generate SEO data for product - moved before conditional returns
  const seoData = useMemo(() => {
    if (!product) return null;
    
    const title = `${product.name} - ${product.brand || 'Premium Footwear'}`;
    const description = product.description || `Shop ${product.name} from ${product.brand || 'our premium collection'}. ${product.material ? `Made with ${product.material}.` : ''} Available in multiple sizes and colors.`;
    const keywords = [
      product.name,
      product.brand,
      product.category,
      product.material,
      product.gender,
      'shoes',
      'footwear',
      ...(product.colors?.map(c => c.name) || []),
      ...(product.sizes?.map(s => `size ${s.size}`) || [])
    ].filter(Boolean).join(', ');
    
    return {
      title,
      description,
      keywords,
      image: product.images?.[0] || '/images/default-shoe.jpg',
      price: product.price,
      availability: product.inStock ? 'in stock' : 'out of stock',
      brand: product.brand,
      category: product.category,
      sku: product._id
    };
  }, [product]);

  // All hooks must be defined before any conditional returns
  const handleAddToCart = useCallback(async () => {
    if (!product) {
      return;
    }
    
    try {
      setAddingToCart(true);
      
      // Validate size selection for shoes
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        showError('Size Required', 'Please select a size before adding to cart');
        return;
      }
      
      // Validate color selection if available
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        showError('Color Required', 'Please select a color before adding to cart');
        return;
      }
      
      // Check stock availability
      if (selectedSize) {
        const sizeOption = product.sizes?.find(s => s.size === selectedSize);
        if (sizeOption && sizeOption.stock < quantity) {
          showError('Insufficient Stock', `Only ${sizeOption.stock} items available in size ${selectedSize}`);
          return;
        }
      }
      
      await addItem(product, quantity, selectedSize, selectedColor);
      success('Added to Cart', `${product.name} has been added to your cart`);
    } catch (error) {
      // Silent fail - error handled by UI state
      showError('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  }, [product, selectedSize, selectedColor, quantity, addItem, success, showError]);

  const handleWishlistToggle = useCallback(() => {
    if (!product) return;
    
    try {
      const wasInWishlist = isInWishlist(product._id);
      toggleItem(product);
      
      if (wasInWishlist) {
        success('Removed from Wishlist', `${product.name} has been removed from your wishlist`);
      } else {
        success('Added to Wishlist', `${product.name} has been added to your wishlist`);
      }
    } catch {
      showError('Error', 'Failed to update wishlist');
    }
  }, [product, isInWishlist, toggleItem, success, showError]);
  
  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    // Update URL parameters to persist selection
    const newParams = new URLSearchParams(searchParams);
    newParams.set('size', size);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    // Update URL parameters to persist selection
    const newParams = new URLSearchParams(searchParams);
    newParams.set('color', color);
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const averageRating = useMemo(() => {
    if (reviewStats?.averageRating !== undefined) {
      return reviewStats.averageRating;
    }
    return productReviews.length > 0 
      ? productReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / productReviews.length 
      : product?.rating || 0;
  }, [reviewStats?.averageRating, productReviews, product?.rating]);

  const isWishlisted = useMemo(() => {
    return product ? isInWishlist(product._id) : false;
  }, [product, isInWishlist]);

  const handleReviewUpdate = useCallback(() => {
    // Refetch review stats when reviews change
    refetchReviewStats();
  }, [refetchReviewStats]);

  const canAddToCart = useMemo(() => {
    if (!product || !product.inStock) return false;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) return false;
    if (product.colors && product.colors.length > 0 && !selectedColor) return false;
    return true;
  }, [product, selectedSize, selectedColor]);

  // Initialize selections from URL parameters
  useEffect(() => {
    const sizeFromUrl = searchParams.get('size');
    const colorFromUrl = searchParams.get('color');
    
    if (sizeFromUrl) {
      setSelectedSize(sizeFromUrl);
    }
    if (colorFromUrl) {
      setSelectedColor(colorFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Product ID is missing');
          return;
        }
        
        const productData = await productService.getProductById(id);
        setProduct(productData);
        
        // Validate URL parameters against available options
        const sizeFromUrl = searchParams.get('size');
        const colorFromUrl = searchParams.get('color');
        
        if (sizeFromUrl && productData.sizes) {
          const validSize = productData.sizes.find(s => s.size === sizeFromUrl && s.stock > 0);
          if (validSize) {
            setSelectedSize(sizeFromUrl);
          } else {
            // Remove invalid size from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('size');
            setSearchParams(newParams, { replace: true });
            setSelectedSize('');
          }
        }
        
        if (colorFromUrl && productData.colors) {
          const validColor = productData.colors.find(c => c.name === colorFromUrl && c.stock > 0);
          if (validColor) {
            setSelectedColor(colorFromUrl);
          } else {
            // Remove invalid color from URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('color');
            setSearchParams(newParams, { replace: true });
            setSelectedColor('');
          }
        }
        
        // For now, we'll use static reviews until we implement a reviews service
        // In a real app, you would fetch reviews from an API
        setProductReviews(productData.reviews || []);
        
        setLoading(false);
      } catch (err) {
        // Silent fail - error handled by UI state
        const errorMessage = err instanceof Error ? err.message : 'Failed to load product details';
        setError(errorMessage);
        showError('Error', errorMessage);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, showError, searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Product not found'}</h2>
          <Link to="/products" className="text-primary-600 hover:text-primary-800">
            Back to products
          </Link>
        </div>
      </div>
    );
  }



  return (
    <>
      {seoData && (
        <SEO
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          image={seoData.image}
          type="product"
          price={seoData.price}
          availability={seoData.availability}
          brand={seoData.brand}
          category={seoData.category}
          sku={seoData.sku}
          url={window.location.href}
        />
      )}
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8 animate-fade-in">
          <Link to="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Products</Link>
          <span>/</span>
          <span className="text-gray-800">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-800 mb-8 animate-fade-in"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div className="animate-slide-up bg-white rounded-2xl p-6 shadow-lg lg:sticky lg:top-8">
            <div className="lg:sticky lg:top-8">
            <div className="mb-6">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-96 md:h-[500px] object-cover rounded-xl shadow-lg transition-all duration-300"
              />
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                    selectedImage === index ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="animate-fade-in bg-white rounded-2xl p-8 shadow-lg">
            {/* Badge */}
            {product.badge && (
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                product.badge === 'Sale' ? 'bg-red-100 text-red-800' :
                product.badge === 'New' ? 'bg-green-100 text-green-800' :
                product.badge === 'Popular' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {product.badge}
              </span>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>

            {/* Brand */}
            {product.brand && (
              <p className="text-lg text-gray-600 mb-4 font-medium">{product.brand}</p>
            )}

            {/* Shoe-specific details */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Sizes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => size.stock > 0 && handleSizeSelect(size.size)}
                        disabled={size.stock === 0}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          selectedSize === size.size
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : size.stock > 0 
                              ? 'border-gray-300 bg-white hover:border-primary-500 hover:bg-primary-50 cursor-pointer' 
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>{size.size}</span>
                        {selectedSize === size.size && (
                          <Check className="w-3 h-3 inline ml-1" />
                        )}
                        {size.stock <= 5 && size.stock > 0 && (
                          <span className="ml-1 text-xs text-orange-600">(Low stock)</span>
                        )}
                        {size.stock === 0 && (
                          <span className="ml-1 text-xs text-red-600">(Out of stock)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Available Colors:</h4>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => color.stock > 0 && handleColorSelect(color.name)}
                        disabled={color.stock === 0}
                        className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                          selectedColor === color.name
                            ? 'border-primary-500 bg-primary-50'
                            : color.stock > 0 
                              ? 'border-gray-300 bg-white hover:border-primary-500 cursor-pointer' 
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border ${
                            selectedColor === color.name ? 'border-primary-500' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.hexCode }}
                        />
                        <span className={`text-sm font-medium ${
                          color.stock > 0 ? 'text-gray-800' : 'text-gray-400'
                        }`}>
                          {color.name}
                        </span>
                        {selectedColor === color.name && (
                          <Check className="w-3 h-3 text-primary-600" />
                        )}
                        {color.stock <= 5 && color.stock > 0 && (
                          <span className="text-xs text-orange-600">(Low stock)</span>
                        )}
                        {color.stock === 0 && (
                          <span className="text-xs text-red-600">(Out of stock)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Recommendations */}
              <ProductRecommendations 
                className="mb-6" 
                productCategory={typeof product.category === 'object' ? product.category?.name || product.category?._id : product.category}
                onSizeSelect={(size) => {
                  // Find the size object and select it if available
                  const sizeObj = product.sizes?.find(s => s.size === size && s.stock > 0);
                  if (sizeObj) {
                    handleSizeSelect(size);
                  }
                }}
                onColorSelect={(color) => {
                  // Find the color object and select it if available
                  const colorObj = product.colors?.find(c => c.name === color && c.stock > 0);
                  if (colorObj) {
                    handleColorSelect(color);
                  }
                }}
              />

              {/* Product specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.material && (
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Material</p>
                    <p className="text-sm font-medium text-gray-800">{product.material}</p>
                  </div>
                )}
                {product.gender && (
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                    <p className="text-sm font-medium text-gray-800">{product.gender}</p>
                  </div>
                )}
                {product.style && (
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Style</p>
                    <p className="text-sm font-medium text-gray-800">{product.style}</p>
                  </div>
                )}
                {product.season && (
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-gray-500 mb-1">Season</p>
                    <p className="text-sm font-medium text-gray-800">{product.season}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(averageRating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-medium text-gray-800">⭐ {averageRating.toFixed(1)}</span>
              <span className="text-gray-600">({reviewStats?.totalReviews || 0} Reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-primary-950">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">₹{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                  Save ₹{product.originalPrice - product.price}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 text-lg mb-6">{product.description}</p>

            {/* Stock Status */}
            <div className="mb-6">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            {product.inStock && (
              <div className="flex items-center space-x-4 mb-8">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 border-x border-gray-300 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !canAddToCart}
                  className={`flex-1 px-8 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 font-medium ${
                    addingToCart || !canAddToCart
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-primary-950 text-white hover:bg-primary-800 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {addingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleWishlistToggle}
                className={`flex items-center space-x-2 px-6 py-3 border rounded-lg transition-all duration-300 font-medium ${
                  isWishlisted 
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </button>
              <button className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-gray-600">Free Shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-600">30-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-fade-in">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'description', label: 'Description' },
                { id: 'features', label: 'Features' },
                { id: 'reviews', label: `Reviews (${reviewStats?.totalReviews || productReviews.length})` },
                { id: 'shipping', label: 'Shipping & Returns' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8 space-y-8">
            {activeTab === 'description' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Description</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
                <p className="text-gray-600 leading-relaxed">
                  This premium product represents the perfect blend of style, functionality, and quality craftsmanship. 
                  Each item is carefully selected to meet our high standards and provide you with an exceptional experience 
                  that will last for years to come.
                </p>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Key Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewSection 
                productId={product._id}
                averageRating={reviewStats?.averageRating || product.rating}
                totalReviews={reviewStats?.totalReviews || product.numReviews || 0}
                onReviewUpdate={handleReviewUpdate}
              />
            )}

            {activeTab === 'shipping' && (
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Shipping & Returns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Shipping Information</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Free standard shipping on orders over ₹1000</li>
                      <li>• Express shipping available for ₹50</li>
                      <li>• Standard delivery: 3-7 business days</li>
                      <li>• Express delivery: 1-2 business days</li>
                      <li>• International shipping available</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Return Policy</h4>
                    <ul className="space-y-2 text-gray-600">
                      <li>• 30-day return window</li>
                      <li>• Items must be in original condition</li>
                      <li>• Free returns for defective items</li>
                      <li>• Return shipping: ₹50 (deducted from refund)</li>
                      <li>• Refunds processed within 5-7 business days</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Spacing between sections */}
        <div className="mt-12 mb-8"></div>

        {/* Review Slider for Reviews with Images */}
        <ReviewSlider productId={product._id} />
      </div>
    </div>
    </>
  );
});

export default ProductDetail;