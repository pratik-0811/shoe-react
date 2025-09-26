import React, { useState, useCallback, memo, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = '/assets/product-placeholder.svg',
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loading, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError, src]);

  // Generate WebP and fallback sources
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // If it's already a WebP or SVG, return as is
    if (originalSrc.includes('.webp') || originalSrc.includes('.svg')) {
      return originalSrc;
    }
    
    // For local images or other formats, return original src
    // Don't try to convert to WebP for local development
    return originalSrc;
  }, []);

  const optimizedSrc = getOptimizedSrc(src);

  if (hasError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-center px-2">Image not available</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      {!isLoaded && (
        <img
          src={placeholder}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          width={width}
          height={height}
        />
      )}
      
      {/* Loading indicator */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default memo(OptimizedImage);