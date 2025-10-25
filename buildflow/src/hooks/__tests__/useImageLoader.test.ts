import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImageLoader, useFirebaseImageLoader, useMultipleImageLoader } from '../useImageLoader';
import * as imageLoader from '../../services/imageLoader';

// Mock the image loader service
vi.mock('../../services/imageLoader', () => ({
  loadImage: vi.fn(),
  loadFirebaseImage: vi.fn()
}));

describe('useImageLoader Hook', () => {
  const mockLoadImage = vi.mocked(imageLoader.loadImage);
  const mockLoadFirebaseImage = vi.mocked(imageLoader.loadFirebaseImage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useImageLoader', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useImageLoader(null));

      expect(result.current.loading).toBe(false);
      expect(result.current.loaded).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.url).toBe('');
      expect(result.current.fromCache).toBe(false);
      expect(result.current.loadTime).toBe(0);
    });

    it('should load image on mount when loadOnMount is true', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: imageUrl,
        fromCache: false,
        loadTime: 100
      });

      const { result } = renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true })
      );

      // Should start loading
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.url).toBe(imageUrl);
      expect(result.current.fromCache).toBe(false);
      expect(result.current.loadTime).toBe(100);
      expect(mockLoadImage).toHaveBeenCalledWith(imageUrl, {});
    });

    it('should not load image on mount when loadOnMount is false', () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: false })
      );

      expect(mockLoadImage).not.toHaveBeenCalled();
    });

    it('should handle loading errors', async () => {
      const imageUrl = 'https://example.com/broken-image.jpg';
      const mockError = {
        type: 'firebase' as const,
        message: 'Failed to load image',
        timestamp: new Date(),
        retryable: true
      };
      
      mockLoadImage.mockResolvedValue({
        success: false,
        url: '',
        error: mockError
      });

      const { result } = renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.loaded).toBe(false);
      expect(result.current.url).toBe('');
    });

    it('should reset state when URL changes and resetOnUrlChange is true', async () => {
      const initialUrl = 'https://example.com/image1.jpg';
      const newUrl = 'https://example.com/image2.jpg';
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: initialUrl,
        fromCache: false,
        loadTime: 100
      });

      const { result, rerender } = renderHook(
        ({ url }) => useImageLoader(url, { loadOnMount: true, resetOnUrlChange: true }),
        { initialProps: { url: initialUrl } }
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Change URL
      mockLoadImage.mockResolvedValue({
        success: true,
        url: newUrl,
        fromCache: false,
        loadTime: 150
      });

      act(() => {
        rerender({ url: newUrl });
      });

      // Should reset and start loading new image
      expect(result.current.loading).toBe(true);
      expect(result.current.loaded).toBe(false);

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.url).toBe(newUrl);
    });

    it('should provide retry functionality', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      mockLoadImage
        .mockResolvedValueOnce({
          success: false,
          url: '',
          error: {
            type: 'network' as const,
            message: 'Network error',
            timestamp: new Date(),
            retryable: true
          }
        })
        .mockResolvedValueOnce({
          success: true,
          url: imageUrl,
          fromCache: false,
          loadTime: 100
        });

      const { result } = renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Retry loading
      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.error).toBe(null);
      expect(mockLoadImage).toHaveBeenCalledTimes(2);
    });

    it('should provide reset functionality', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: imageUrl,
        fromCache: false,
        loadTime: 100
      });

      const { result } = renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.loaded).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.url).toBe('');
    });

    it('should handle manual load calls', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: imageUrl,
        fromCache: false,
        loadTime: 100
      });

      const { result } = renderHook(() => 
        useImageLoader(null, { loadOnMount: false })
      );

      // Manually load image
      act(() => {
        result.current.load(imageUrl);
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.url).toBe(imageUrl);
    });
  });

  describe('useFirebaseImageLoader', () => {
    it('should load Firebase image successfully', async () => {
      const firebasePath = 'images/test.jpg';
      const downloadUrl = 'https://firebase.com/download/test.jpg';
      
      mockLoadFirebaseImage.mockResolvedValue({
        success: true,
        url: downloadUrl,
        fromCache: false,
        loadTime: 200
      });

      const { result } = renderHook(() => 
        useFirebaseImageLoader(firebasePath, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      expect(result.current.url).toBe(downloadUrl);
      expect(result.current.loadTime).toBe(200);
      expect(mockLoadFirebaseImage).toHaveBeenCalledWith(firebasePath, {});
    });

    it('should handle Firebase loading errors', async () => {
      const firebasePath = 'images/nonexistent.jpg';
      const mockError = {
        type: 'firebase' as const,
        message: 'File not found',
        timestamp: new Date(),
        retryable: true
      };
      
      mockLoadFirebaseImage.mockResolvedValue({
        success: false,
        url: '',
        error: mockError
      });

      const { result } = renderHook(() => 
        useFirebaseImageLoader(firebasePath, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      expect(result.current.loaded).toBe(false);
    });

    it('should handle Firebase service exceptions', async () => {
      const firebasePath = 'images/error.jpg';
      
      mockLoadFirebaseImage.mockRejectedValue(new Error('Firebase connection failed'));

      const { result } = renderHook(() => 
        useFirebaseImageLoader(firebasePath, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.type).toBe('firebase');
      expect(result.current.error?.message).toBe('Firebase connection failed');
    });
  });

  describe('useMultipleImageLoader', () => {
    it('should load multiple images successfully', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];
      
      mockLoadImage
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[0],
          fromCache: false,
          loadTime: 100
        })
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[1],
          fromCache: false,
          loadTime: 150
        })
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[2],
          fromCache: false,
          loadTime: 120
        });

      const { result } = renderHook(() => 
        useMultipleImageLoader(imageUrls)
      );

      // Should start loading
      expect(result.current.overallLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.overallLoading).toBe(false);
      });

      expect(result.current.loadedCount).toBe(3);
      expect(result.current.errorCount).toBe(0);
      expect(result.current.totalCount).toBe(3);
      expect(result.current.allLoaded).toBe(true);
      expect(result.current.hasErrors).toBe(false);

      // Check individual states
      imageUrls.forEach((url, index) => {
        const state = result.current.states[url];
        expect(state.loaded).toBe(true);
        expect(state.url).toBe(url);
      });
    });

    it('should handle mixed success and failure', async () => {
      const imageUrls = [
        'https://example.com/good-image.jpg',
        'https://example.com/bad-image.jpg'
      ];
      
      mockLoadImage
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[0],
          fromCache: false,
          loadTime: 100
        })
        .mockResolvedValueOnce({
          success: false,
          url: '',
          error: {
            type: 'network' as const,
            message: 'Failed to load',
            timestamp: new Date(),
            retryable: true
          }
        });

      const { result } = renderHook(() => 
        useMultipleImageLoader(imageUrls)
      );

      await waitFor(() => {
        expect(result.current.overallLoading).toBe(false);
      });

      expect(result.current.loadedCount).toBe(1);
      expect(result.current.errorCount).toBe(1);
      expect(result.current.allLoaded).toBe(false);
      expect(result.current.hasErrors).toBe(true);
    });

    it('should provide retry functionality for failed images', async () => {
      const imageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ];
      
      // First load: one succeeds, one fails
      mockLoadImage
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[0],
          fromCache: false,
          loadTime: 100
        })
        .mockResolvedValueOnce({
          success: false,
          url: '',
          error: {
            type: 'network' as const,
            message: 'Failed to load',
            timestamp: new Date(),
            retryable: true
          }
        })
        // Retry: failed image now succeeds
        .mockResolvedValueOnce({
          success: true,
          url: imageUrls[1],
          fromCache: false,
          loadTime: 150
        });

      const { result } = renderHook(() => 
        useMultipleImageLoader(imageUrls)
      );

      await waitFor(() => {
        expect(result.current.hasErrors).toBe(true);
      });

      // Retry failed images
      act(() => {
        result.current.retryFailed();
      });

      await waitFor(() => {
        expect(result.current.allLoaded).toBe(true);
      });

      expect(result.current.loadedCount).toBe(2);
      expect(result.current.errorCount).toBe(0);
    });

    it('should handle empty image array', () => {
      const { result } = renderHook(() => 
        useMultipleImageLoader([])
      );

      expect(result.current.overallLoading).toBe(false);
      expect(result.current.loadedCount).toBe(0);
      expect(result.current.errorCount).toBe(0);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.allLoaded).toBe(true);
      expect(result.current.hasErrors).toBe(false);
    });

    it('should update when image URLs change', async () => {
      const initialUrls = ['https://example.com/image1.jpg'];
      const newUrls = [
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: 'mock-url',
        fromCache: false,
        loadTime: 100
      });

      const { result, rerender } = renderHook(
        ({ urls }) => useMultipleImageLoader(urls),
        { initialProps: { urls: initialUrls } }
      );

      await waitFor(() => {
        expect(result.current.totalCount).toBe(1);
      });

      // Change URLs
      act(() => {
        rerender({ urls: newUrls });
      });

      await waitFor(() => {
        expect(result.current.totalCount).toBe(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service exceptions gracefully', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      mockLoadImage.mockRejectedValue(new Error('Service unavailable'));

      const { result } = renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.type).toBe('unknown');
      expect(result.current.error?.message).toBe('Service unavailable');
      expect(result.current.loaded).toBe(false);
    });

    it('should handle null/undefined URLs gracefully', () => {
      const { result } = renderHook(() => 
        useImageLoader(null, { loadOnMount: true })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.loaded).toBe(false);
      expect(mockLoadImage).not.toHaveBeenCalled();
    });
  });

  describe('Options Handling', () => {
    it('should pass options to image loader service', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      const options = {
        retryAttempts: 5,
        retryDelay: 2000,
        timeout: 15000,
        fallbackUrl: 'https://example.com/fallback.jpg'
      };
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: imageUrl,
        fromCache: false,
        loadTime: 100
      });

      renderHook(() => 
        useImageLoader(imageUrl, { loadOnMount: true, ...options })
      );

      expect(mockLoadImage).toHaveBeenCalledWith(imageUrl, options);
    });

    it('should handle resetOnUrlChange option correctly', async () => {
      const initialUrl = 'https://example.com/image1.jpg';
      const newUrl = 'https://example.com/image2.jpg';
      
      mockLoadImage.mockResolvedValue({
        success: true,
        url: initialUrl,
        fromCache: false,
        loadTime: 100
      });

      const { result, rerender } = renderHook(
        ({ url }) => useImageLoader(url, { loadOnMount: true, resetOnUrlChange: false }),
        { initialProps: { url: initialUrl } }
      );

      await waitFor(() => {
        expect(result.current.loaded).toBe(true);
      });

      // Change URL with resetOnUrlChange: false
      act(() => {
        rerender({ url: newUrl });
      });

      // Should not reset state
      expect(result.current.loaded).toBe(true);
      expect(result.current.url).toBe(initialUrl);
    });
  });
});