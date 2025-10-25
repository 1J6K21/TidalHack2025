'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useImageLoader } from '../hooks/useImageLoader';
import { ErrorState } from '../types';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  skeletonClassName?: string;
  errorClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: (error: ErrorState) => void;
  showSkeleton?: boolean;
  showErrorIcon?: boolean;
  retryable?: boolean;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className = '',
  skeletonClassName = '',
  errorClassName = '',
  width,
  height,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  showSkeleton = true,
  showErrorIcon = true,
  retryable = true,
  placeholder,
  errorPlaceholder
}) => {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const {
    loading: imageLoading,
    loaded: imageLoaded,
    error: imageError,
    url: imageUrl,
    retry
  } = useImageLoader(
    isInView ? src : null,
    {
      ...(fallbackSrc && { fallbackUrl: fallbackSrc }),
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 10000,
      loadOnMount: false
    }
  );

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Handle callbacks
  useEffect(() => {
    if (imageLoaded && onLoad) {
      onLoad();
    }
  }, [imageLoaded, onLoad]);

  useEffect(() => {
    if (imageError && onError) {
      onError(imageError);
    }
  }, [imageError, onError]);

  const handleRetry = () => {
    if (retryable && imageError) {
      retry();
    }
  };

  const renderSkeleton = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <div
        className={`animate-pulse bg-gray-200 ${skeletonClassName}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center h-full">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (errorPlaceholder) {
      return errorPlaceholder;
    }

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 text-gray-500 ${errorClassName}`}
        style={{ width, height }}
      >
        {showErrorIcon && (
          <svg
            className="w-8 h-8 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )}
        <p className="text-xs text-center mb-2">Failed to load image</p>
        {retryable && imageError?.retryable && (
          <button
            onClick={handleRetry}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  const renderImage = () => {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        style={{
          width,
          height,
          objectFit
        }}
        loading={loading}
      />
    );
  };

  return (
    <div
      ref={imgRef}
      className="relative overflow-hidden"
      style={{ width, height }}
    >
      {/* Loading skeleton */}
      {(imageLoading || !isInView) && showSkeleton && (
        <div className="absolute inset-0">
          {renderSkeleton()}
        </div>
      )}

      {/* Error state */}
      {imageError && !imageLoading && (
        <div className="absolute inset-0">
          {renderError()}
        </div>
      )}

      {/* Loaded image */}
      {imageLoaded && !imageError && (
        <div className="absolute inset-0">
          {renderImage()}
        </div>
      )}

      {/* Loading indicator overlay */}
      {imageLoading && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveImage;