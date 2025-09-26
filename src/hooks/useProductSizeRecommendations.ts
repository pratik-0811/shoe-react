import { useState, useEffect } from 'react';
import api from '../services/api';

interface ProductSizeRecommendationData {
  recommendedSizes: string[];
  sizeFrequency?: { [size: string]: number };
  message: string;
  totalPurchases?: number;
  uniqueCustomers?: number;
}

interface UseProductSizeRecommendationsOptions {
  productId?: string;
  autoFetch?: boolean;
}

export const useProductSizeRecommendations = (options: UseProductSizeRecommendationsOptions = {}) => {
  const { productId, autoFetch = true } = options;
  const [recommendations, setRecommendations] = useState<ProductSizeRecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductSizeRecommendations = async (id?: string) => {
    const targetProductId = id || productId;
    
    if (!targetProductId) {
      setError('Product ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/recommendations/product/${targetProductId}/sizes`);
      
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to get product size recommendations');
      }
    } catch (err: any) {
      // Silent fail - error handled by UI state
      const errorMessage = err.response?.data?.message || 'Failed to load product size recommendations';
      setError(errorMessage);
      
      // Set empty recommendations on error
      setRecommendations({
        recommendedSizes: [],
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = (id?: string) => {
    fetchProductSizeRecommendations(id);
  };

  useEffect(() => {
    if (autoFetch && productId) {
      fetchProductSizeRecommendations();
    }
  }, [productId, autoFetch]);

  return {
    recommendations,
    loading,
    error,
    refetch,
    fetchProductSizeRecommendations
  };
};

export default useProductSizeRecommendations;