import { getImageURL } from './firebaseStorage';
import { ErrorState, ErrorType } from '../types';

// ============================================================================
// IMAGE LOADING UTILITIES
// ============================================================================

export interface ImageLoadOptions {
  fallbackUrl?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  onProgress?: (loaded: number, total: number) => void;
}

export interface ImageLoadResult {
  success: boolean;
  url: string;
  error?: ErrorState;
  fromCache?: boolean;
  loadTime?: number;
}

// Cache for loaded images
const imageCache = new Map<string, string>();
const loadingPromises = new Map<string, Promise<ImageLoadResult>>();

/**
 * Create error state for image loading failures
 */
function createImageError(message: string, details?: any): ErrorState {
  return {
    type: ErrorType.FIREBASE,
    message,
    details,
    timestamp: new Date(),
    retryable: true
  };
}

/**
 * Load image with retry logic and caching
 */
export async function loadImage(
  imageUrl: string, 
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult> {
  const {
    fallbackUrl,
    retryAttempts = 3,
    retryDelay = 1000,
    timeout = 10000
  } = options;

  // Check cache first
  if (imageCache.has(imageUrl)) {
    return {
      success: true,
      url: imageCache.get(imageUrl)!,
      fromCache: true,
      loadTime: 0
    };
  }

  // Check if already loading
  if (loadingPromises.has(imageUrl)) {
    return loadingPromises.get(imageUrl)!;
  }

  const startTime = Date.now();

  const loadPromise = new Promise<ImageLoadResult>((resolve) => {
    let attempts = 0;

    const attemptLoad = () => {
      attempts++;
      
      const img = new Image();
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        clearTimeout(timeoutId);
        img.onload = null;
        img.onerror = null;
      };

      const handleSuccess = () => {
        cleanup();
        const loadTime = Date.now() - startTime;
        
        // Cache the successful URL
        imageCache.set(imageUrl, imageUrl);
        
        resolve({
          success: true,
          url: imageUrl,
          fromCache: false,
          loadTime
        });
      };

      const handleError = () => {
        cleanup();
        
        if (attempts < retryAttempts) {
          // Retry after delay
          setTimeout(attemptLoad, retryDelay * attempts);
        } else {
          // All attempts failed, try fallback
          if (fallbackUrl && fallbackUrl !== imageUrl) {
            const { fallbackUrl: _, ...optionsWithoutFallback } = options;
            loadImage(fallbackUrl, optionsWithoutFallback)
              .then(resolve);
          } else {
            resolve({
              success: false,
              url: '',
              error: createImageError(
                `Failed to load image after ${attempts} attempts`,
                { originalUrl: imageUrl, attempts }
              ),
              loadTime: Date.now() - startTime
            });
          }
        }
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup();
        handleError();
      }, timeout);

      // Set up event handlers
      img.onload = handleSuccess;
      img.onerror = handleError;

      // Start loading
      img.src = imageUrl;
    };

    attemptLoad();
  });

  // Cache the promise to prevent duplicate requests
  loadingPromises.set(imageUrl, loadPromise);

  // Clean up the promise cache when done
  loadPromise.finally(() => {
    loadingPromises.delete(imageUrl);
  });

  return loadPromise;
}

/**
 * Load Firebase image with automatic URL resolution
 */
export async function loadFirebaseImage(
  firebasePath: string,
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult> {
  try {
    // First try to get the Firebase download URL
    const urlResult = await getImageURL(firebasePath);
    
    if (!urlResult.success || !urlResult.data) {
      return {
        success: false,
        url: '',
        error: urlResult.error || createImageError('Failed to get Firebase download URL')
      };
    }

    // Load the image using the download URL
    return loadImage(urlResult.data, options);
    
  } catch (error) {
    return {
      success: false,
      url: '',
      error: createImageError('Firebase image loading failed', error)
    };
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(
  imageUrls: string[],
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult[]> {
  const loadPromises = imageUrls.map(url => loadImage(url, options));
  return Promise.all(loadPromises);
}

/**
 * Preload Firebase images
 */
export async function preloadFirebaseImages(
  firebasePaths: string[],
  options: ImageLoadOptions = {}
): Promise<ImageLoadResult[]> {
  const loadPromises = firebasePaths.map(path => loadFirebaseImage(path, options));
  return Promise.all(loadPromises);
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return imageCache.size;
}

/**
 * Check if image is cached
 */
export function isImageCached(imageUrl: string): boolean {
  return imageCache.has(imageUrl);
}

/**
 * Generate optimized image URLs for different sizes
 */
export function generateImageSizes(baseUrl: string): {
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
} {
  // For Firebase Storage, we can add size parameters
  const addSizeParam = (url: string, size: string) => {
    if (url.includes('firebasestorage.googleapis.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}alt=media&token=size_${size}`;
    }
    return url;
  };

  return {
    thumbnail: addSizeParam(baseUrl, '150x150'),
    small: addSizeParam(baseUrl, '300x300'),
    medium: addSizeParam(baseUrl, '600x600'),
    large: addSizeParam(baseUrl, '1200x1200')
  };
}

/**
 * Create a blob URL for local images
 */
export function createBlobUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke blob URL to free memory
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Return original if compression fails
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}