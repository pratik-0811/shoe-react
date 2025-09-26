import React from 'react';
import { useProductSizeRecommendations } from '../hooks/useProductSizeRecommendations';

interface ProductSizeRecommendationsProps {
  productId: string;
  onSizeSelect?: (size: string) => void;
  className?: string;
  showFrequency?: boolean;
}

const ProductSizeRecommendations: React.FC<ProductSizeRecommendationsProps> = ({
  productId,
  onSizeSelect,
  className = '',
  showFrequency = false
}) => {
  const { recommendations, loading, error } = useProductSizeRecommendations({
    productId,
    autoFetch: true
  });

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <p>Size recommendations not available</p>
      </div>
    );
  }

  if (recommendations.recommendedSizes.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <p>{recommendations.message}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Popular Sizes for This Product
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          {recommendations.message}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {recommendations.recommendedSizes.map((size) => {
          const frequency = recommendations.sizeFrequency?.[size];
          
          return (
            <button
              key={size}
              onClick={() => onSizeSelect?.(size)}
              className="relative px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title={frequency && showFrequency ? `${frequency} customers bought this size` : `Size ${size}`}
            >
              {size}
              {frequency && showFrequency && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {frequency}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {recommendations.totalPurchases && recommendations.uniqueCustomers && (
        <div className="text-xs text-gray-500">
          Based on {recommendations.totalPurchases} purchase{recommendations.totalPurchases !== 1 ? 's' : ''} by {recommendations.uniqueCustomers} customer{recommendations.uniqueCustomers !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ProductSizeRecommendations;