import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface RecommendationData {
  recommendedSizes: string[];
  recommendedColors: string[];
  message: string;
}

interface RecommendationsProps {
  productCategory?: string;
  onSizeSelect?: (size: string) => void;
  onColorSelect?: (color: string) => void;
  className?: string;
}

const Recommendations: React.FC<RecommendationsProps> = ({
  productCategory,
  onSizeSelect,
  onColorSelect,
  className = ''
}) => {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch recommendations until auth state is determined
    if (authLoading) {
      return;
    }
    fetchRecommendations();
  }, [user, productCategory, authLoading]);

  // Debug user state
  useEffect(() => {
    // Auth state tracking for debugging
  }, [user, authLoading]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      if (user) {
        // For logged-in users, get recommendations based on their last order
        if (productCategory) {
          response = await api.get(`/recommendations/enhanced?category=${productCategory}`);
        } else {
          response = await api.get('/recommendations/user');
        }
      } else {
        // For guest users, get recommendations based on cart
        const sessionId = getSessionId();
        if (sessionId) {
          response = await api.post('/recommendations/guest', { sessionId });
        } else {
          // Fallback to default recommendations
          response = await api.get('/recommendations/default');
        }
      }
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to get recommendations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
      
      // Fallback to default recommendations
      try {
        const fallbackResponse = await api.get('/recommendations/default');
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

  const handleSizeClick = (size: string) => {
    if (onSizeSelect) {
      onSizeSelect(size);
    }
  };

  const handleColorClick = (color: string) => {
    if (onColorSelect) {
      onColorSelect(color);
    }
  };



  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-12 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !recommendations) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!recommendations || (recommendations.recommendedSizes.length === 0 && recommendations.recommendedColors.length === 0)) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
        <h3 className="text-lg font-semibold text-gray-800">Recommended for You</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{recommendations.message}</p>

      {recommendations.recommendedSizes.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
            </svg>
            Recommended Sizes
          </h4>
          <div className="flex flex-wrap gap-2">
            {recommendations.recommendedSizes.map((size, index) => (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                className={`px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                  index === 0
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } ${onSizeSelect ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {recommendations.recommendedColors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
            </svg>
            Recommended Colors
          </h4>
          <div className="flex flex-wrap gap-2">
            {recommendations.recommendedColors.map((color, index) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                  index === 0
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                } ${onColorSelect ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2 border border-gray-300"
                    style={{ backgroundColor: color.toLowerCase() }}
                  ></div>
                  {color}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {user && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-600 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Based on your previous orders
          </p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;