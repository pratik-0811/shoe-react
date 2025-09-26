import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Link } from 'react-router-dom';

// Helper function to get or create session ID for guest users
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
};

interface Product {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category: {
    _id: string;
    name: string;
  };
  brand?: string;
  rating: number;
}

interface ProductRecommendationData {
  recommendedProducts: Product[];
  recommendationType: string;
  message: string;
  recommendedSizes?: string[];
  recommendedColors?: string[];
}

interface ProductRecommendationsProps {
  className?: string;
  productCategory?: string;
  onSizeSelect?: (size: string) => void;
  onColorSelect?: (color: string) => void;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  className = '',
  productCategory,
  onSizeSelect,
  onColorSelect
}) => {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<ProductRecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    fetchProductRecommendations();
  }, [user, authLoading]);

  const fetchProductRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session ID for guest users
      const sessionId = getSessionId();
      
      // Use the unified products endpoint that handles both logged-in and guest users
      const params = new URLSearchParams();
      if (sessionId) {
        params.append('sessionId', sessionId);
      }
      if (productCategory) {
        params.append('category', productCategory);
      }
      
      const queryString = params.toString();
      const url = `/recommendations/products${queryString ? '?' + queryString : ''}`;
      
      const response = await api.get(url);
      
      // If product category is provided, also get size/color recommendations
      if (productCategory) {
        try {
          let sizeColorResponse;
          if (user) {
            // For authenticated users
            sizeColorResponse = await api.get(`/recommendations/enhanced?category=${productCategory}`);
          } else {
            // For guest users
            sizeColorResponse = await api.post('/recommendations/guest', { sessionId });
          }
          
          if (sizeColorResponse.data.success) {
            response.data.data.recommendedSizes = sizeColorResponse.data.data.recommendedSizes;
            response.data.data.recommendedColors = sizeColorResponse.data.data.recommendedColors;
          }
        } catch (err) {
          // Silent fail for size/color recommendations
        }
      }
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to get product recommendations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product recommendations');
      
      // Fallback to trending products
      try {
        const fallbackResponse = await api.get('/recommendations/trending');
        if (fallbackResponse.data.success) {
          setRecommendations(fallbackResponse.data.data);
        }
      } catch (fallbackErr) {
        // Silent fail for fallback
      }
    } finally {
      setLoading(false);
    }
  };

  const getSessionId = (): string | null => {
    // Get or create session ID for guest users
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !recommendations) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!recommendations || !recommendations.recommendedProducts || recommendations.recommendedProducts.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">No recommendations available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {user ? 'Recommended for You' : 'Trending Products'}
        </h3>
        <p className="text-sm text-gray-600">{recommendations.message}</p>
      </div>

      {/* Size and Color Recommendations */}
      {(recommendations.recommendedSizes?.length > 0 || recommendations.recommendedColors?.length > 0) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">Size & Color Recommendations</h4>
          
          {recommendations.recommendedSizes?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Recommended Sizes:</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommendedSizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => onSizeSelect?.(size)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 transition-colors"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.recommendedColors?.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Recommended Colors:</p>
              <div className="flex flex-wrap gap-2">
                {recommendations.recommendedColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => onColorSelect?.(color)}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-primary-50 hover:border-primary-300 transition-colors capitalize"
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recommendations.recommendedProducts.map((product) => (
          <Link
            key={product._id}
            to={`/product/${product._id}`}
            className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src={product.images[0] || '/assets/product-placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                {product.name}
              </h4>
              <p className="text-xs text-gray-500 mb-2">
                {product.category?.name} {product.brand && `• ${product.brand}`}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">
                  ₹{product.price}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;