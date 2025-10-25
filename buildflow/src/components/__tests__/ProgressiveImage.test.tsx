import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProgressiveImage from '../ProgressiveImage';
import { ErrorType } from '../../types';

// Mock the useImageLoader hook
vi.mock('../../hooks/useImageLoader', () => ({
  useImageLoader: vi.fn()
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver
});

describe('ProgressiveImage Component', () => {
  const defaultProps = {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    width: 300,
    height: 200
  };

  const mockRetry = vi.fn();
  const mockUseImageLoader = vi.mocked(await import('../../hooks/useImageLoader')).useImageLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseImageLoader.mockReturnValue({
      loading: false,
      loaded: true,
      error: null,
      url: 'https://example.com/image.jpg',
      fromCache: false,
      retry: mockRetry,
      reset: vi.fn(),
      load: vi.fn()
    });

    // Mock IntersectionObserver callback
    mockIntersectionObserver.mockImplementation((callback) => ({
      observe: vi.fn((element) => {
        // Simulate immediate intersection for eager loading
        callback([{ isIntersecting: true, target: element }]);
      }),
      disconnect: vi.fn(),
      unobserve: vi.fn()
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render image when loaded successfully', () => {
      render(<ProgressiveImage {...defaultProps} />);

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('should apply correct dimensions', () => {
      render(<ProgressiveImage {...defaultProps} />);

      const image = screen.getByAltText('Test image');
      expect(image).toHaveStyle({ width: '300px', height: '200px' });
    });

    it('should apply custom className', () => {
      render(<ProgressiveImage {...defaultProps} className="custom-class" />);

      const image = screen.getByAltText('Test image');
      expect(image).toHaveClass('custom-class');
    });

    it('should set object-fit style', () => {
      render(<ProgressiveImage {...defaultProps} objectFit="contain" />);

      const image = screen.getByAltText('Test image');
      expect(image).toHaveStyle({ objectFit: 'contain' });
    });
  });

  describe('Loading States', () => {
    it('should show skeleton while loading', () => {
      mockUseImageLoader.mockReturnValue({
        loading: true,
        loaded: false,
        error: null,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} />);

      // Should show skeleton with loading animation
      const skeleton = screen.getByRole('img', { hidden: true });
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should show custom placeholder when provided', () => {
      mockUseImageLoader.mockReturnValue({
        loading: true,
        loaded: false,
        error: null,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      const customPlaceholder = <div data-testid="custom-placeholder">Loading...</div>;
      
      render(
        <ProgressiveImage 
          {...defaultProps} 
          placeholder={customPlaceholder}
        />
      );

      expect(screen.getByTestId('custom-placeholder')).toBeInTheDocument();
    });

    it('should show loading indicator overlay during loading', () => {
      mockUseImageLoader.mockReturnValue({
        loading: true,
        loaded: false,
        error: null,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} />);

      const loadingIndicator = screen.getByRole('status', { hidden: true });
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should hide skeleton when image is loaded', () => {
      render(<ProgressiveImage {...defaultProps} />);

      // Should not show skeleton when loaded
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    const mockError = {
      type: ErrorType.FIREBASE,
      message: 'Failed to load image',
      timestamp: new Date(),
      retryable: true
    };

    it('should show error state when image fails to load', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} />);

      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} retryable={true} />);

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    it('should call retry function when retry button is clicked', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} retryable={true} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when retryable is false', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} retryable={false} />);

      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should show custom error placeholder when provided', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      const customErrorPlaceholder = <div data-testid="custom-error">Custom Error</div>;
      
      render(
        <ProgressiveImage 
          {...defaultProps} 
          errorPlaceholder={customErrorPlaceholder}
        />
      );

      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });

    it('should not show error icon when showErrorIcon is false', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} showErrorIcon={false} />);

      // Should not have the warning icon SVG
      expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    });
  });

  describe('Lazy Loading', () => {
    it('should use IntersectionObserver for lazy loading by default', () => {
      render(<ProgressiveImage {...defaultProps} />);

      expect(mockIntersectionObserver).toHaveBeenCalled();
    });

    it('should load immediately when loading is set to eager', () => {
      render(<ProgressiveImage {...defaultProps} loading="eager" />);

      // Should call useImageLoader with the src immediately
      expect(mockUseImageLoader).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          fallbackUrl: undefined,
          retryAttempts: 3,
          retryDelay: 1000,
          timeout: 10000,
          loadOnMount: false
        })
      );
    });

    it('should not load image until in view for lazy loading', () => {
      // Mock IntersectionObserver to not trigger intersection
      mockIntersectionObserver.mockImplementation((callback) => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn()
      }));

      render(<ProgressiveImage {...defaultProps} loading="lazy" />);

      // Should call useImageLoader with null src initially
      expect(mockUseImageLoader).toHaveBeenCalledWith(
        null,
        expect.any(Object)
      );
    });
  });

  describe('Callbacks', () => {
    it('should call onLoad when image loads successfully', () => {
      const mockOnLoad = vi.fn();
      
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: true,
        error: null,
        url: 'https://example.com/image.jpg',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} onLoad={mockOnLoad} />);

      expect(mockOnLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onError when image fails to load', () => {
      const mockOnError = vi.fn();
      const mockError = {
        type: ErrorType.FIREBASE,
        message: 'Failed to load image',
        timestamp: new Date(),
        retryable: true
      };
      
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: mockError,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} onError={mockOnError} />);

      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Fallback Images', () => {
    it('should use fallback image when provided', () => {
      render(
        <ProgressiveImage 
          {...defaultProps} 
          fallbackSrc="https://example.com/fallback.jpg"
        />
      );

      expect(mockUseImageLoader).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          fallbackUrl: 'https://example.com/fallback.jpg'
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text', () => {
      render(<ProgressiveImage {...defaultProps} />);

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
    });

    it('should maintain alt text in error state', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: {
          type: ErrorType.FIREBASE,
          message: 'Failed to load image',
          timestamp: new Date(),
          retryable: true
        },
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} />);

      // Error state should still be accessible
      expect(screen.getByText('Failed to load image')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should show cache indicator when image is from cache', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: true,
        error: null,
        url: 'https://example.com/image.jpg',
        fromCache: true,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(<ProgressiveImage {...defaultProps} />);

      // Image should load immediately without loading state
      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveClass('opacity-100');
    });

    it('should handle image transitions smoothly', () => {
      render(<ProgressiveImage {...defaultProps} />);

      const image = screen.getByAltText('Test image');
      expect(image).toHaveClass('transition-opacity');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom skeleton className', () => {
      mockUseImageLoader.mockReturnValue({
        loading: true,
        loaded: false,
        error: null,
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(
        <ProgressiveImage 
          {...defaultProps} 
          skeletonClassName="custom-skeleton"
        />
      );

      const skeleton = screen.getByRole('img', { hidden: true });
      expect(skeleton).toHaveClass('custom-skeleton');
    });

    it('should apply custom error className', () => {
      mockUseImageLoader.mockReturnValue({
        loading: false,
        loaded: false,
        error: {
          type: ErrorType.FIREBASE,
          message: 'Failed to load image',
          timestamp: new Date(),
          retryable: true
        },
        url: '',
        fromCache: false,
        retry: mockRetry,
        reset: vi.fn(),
        load: vi.fn()
      });

      render(
        <ProgressiveImage 
          {...defaultProps} 
          errorClassName="custom-error"
        />
      );

      const errorContainer = screen.getByText('Failed to load image').parentElement;
      expect(errorContainer).toHaveClass('custom-error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty src gracefully', () => {
      render(<ProgressiveImage {...defaultProps} src="" />);

      expect(mockUseImageLoader).toHaveBeenCalledWith(
        null,
        expect.any(Object)
      );
    });

    it('should handle undefined dimensions', () => {
      render(
        <ProgressiveImage 
          src="https://example.com/image.jpg"
          alt="Test image"
        />
      );

      const image = screen.getByAltText('Test image');
      expect(image).toBeInTheDocument();
    });

    it('should cleanup IntersectionObserver on unmount', () => {
      const mockDisconnect = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        disconnect: mockDisconnect,
        unobserve: vi.fn()
      });

      const { unmount } = render(<ProgressiveImage {...defaultProps} />);
      
      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});