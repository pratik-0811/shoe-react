import { useState, useEffect, useCallback } from 'react';
import reviewService, { ReviewStats } from '../services/reviewService';

interface UseReviewStatsReturn {
  stats: ReviewStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook for single product review stats
export const useReviewStats = (productId: string): UseReviewStatsReturn => {
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const reviewStats = await reviewService.getProductReviewStats(productId);
      setStats(reviewStats);
    } catch (err) {
      // Silent fail - error handled by UI state
      setError('Failed to load review statistics');
      // Keep default stats on error
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {}
      });
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook for bulk product review stats
export const useBulkReviewStats = (productIds: string[]) => {
  const [bulkStats, setBulkStats] = useState<Record<string, ReviewStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBulkStats = useCallback(async () => {
    if (!productIds || productIds.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const stats = await reviewService.getBulkProductReviewStats(productIds);
      setBulkStats(stats);
    } catch (err) {
      // Silent fail - error handled by UI state
      setError('Failed to load review statistics');
      // Set default stats for all products on error
      const defaultStats = productIds.reduce((acc, id) => {
        acc[id] = { averageRating: 0, totalReviews: 0 };
        return acc;
      }, {} as Record<string, ReviewStats>);
      setBulkStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [productIds]);

  useEffect(() => {
    fetchBulkStats();
  }, [fetchBulkStats]);

  return {
    bulkStats,
    loading,
    error,
    refetch: fetchBulkStats,
    getStatsForProduct: (productId: string) => bulkStats[productId] || { averageRating: 0, totalReviews: 0 }
  };
};

export default useReviewStats;