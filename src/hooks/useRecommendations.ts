import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import api from '../services/api';

interface RecommendationData {
  recommendedSizes: string[];
  recommendedColors: string[];
  message: string;
}

interface UseRecommendationsOptions {
  productCategory?: string;
  autoFetch?: boolean;
}

export const useRecommendations = (options: UseRecommendationsOptions = {}) => {
  const { productCategory, autoFetch = true } = options;
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSessionId = (): string => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      if (user) {
        // For logged-in users
        if (productCategory) {
          response = await api.get(`/recommendations/enhanced?category=${productCategory}`);
        } else {
          response = await api.get('/recommendations/user');
        }
      } else {
        // For guest users
        const sessionId = getSessionId();
        response = await api.post('/recommendations/guest', { sessionId });
      }
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to get recommendations');
      }
    } catch (err: any) {
      // Silent fail - error handled by UI state
      setError(err.response?.data?.message || 'Failed to load recommendations');
      
      // Fallback to default recommendations
      try {
        const fallbackResponse = await api.get('/recommendations/default');
        if (fallbackResponse.data.success) {
          setRecommendations(fallbackResponse.data.data);
        }
      } catch (fallbackErr) {
        // Silent fallback fail
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryRecommendations = async (category: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/recommendations/category/${category}`);
      
      if (response.data.success) {
        setRecommendations({
          recommendedSizes: response.data.data.popularSizes,
          recommendedColors: response.data.data.popularColors,
          message: response.data.data.message
        });
      } else {
        throw new Error(response.data.message || 'Failed to get category recommendations');
      }
    } catch (err: any) {
      // Silent fail - error handled by UI state
      setError(err.response?.data?.message || 'Failed to load category recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/recommendations/default');
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to get default recommendations');
      }
    } catch (err: any) {
      // Silent fail - error handled by UI state
      setError(err.response?.data?.message || 'Failed to load default recommendations');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchRecommendations();
  };

  useEffect(() => {
    if (autoFetch && !authLoading) {
      fetchRecommendations();
    }
  }, [user, productCategory, autoFetch, authLoading]);

  return {
    recommendations,
    loading,
    error,
    refetch,
    fetchRecommendations,
    fetchCategoryRecommendations,
    fetchDefaultRecommendations
  };
};

export default useRecommendations;