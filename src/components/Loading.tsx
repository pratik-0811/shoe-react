import React from 'react';
import { Loader2, Package, ShoppingBag } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'product';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const renderSpinner = () => (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-primary-600 rounded-full animate-pulse`}
          style={{
            width: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
            height: size === 'sm' ? '4px' : size === 'md' ? '6px' : size === 'lg' ? '8px' : '10px',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} bg-primary-200 rounded-full animate-pulse`} />
  );

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  const renderProduct = () => (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Package className={`${sizeClasses[size]} text-primary-600`} />
        <div className="absolute -top-1 -right-1">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-ping"></div>
        </div>
      </div>
      <ShoppingBag className={`${sizeClasses[size]} text-primary-400 animate-bounce`} />
    </div>
  );

  const renderLoadingContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'product':
        return renderProduct();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {variant !== 'skeleton' && renderLoadingContent()}
      {variant === 'skeleton' && renderLoadingContent()}
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Specialized loading components
export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'sm' }) => (
  <Loader2 className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} />
);

export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Loading variant="spinner" size="lg" text={text} fullScreen />
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
);

export const ProductDetailSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image skeleton */}
      <div className="space-y-4">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Details skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="flex space-x-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="animate-pulse">
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Loading;