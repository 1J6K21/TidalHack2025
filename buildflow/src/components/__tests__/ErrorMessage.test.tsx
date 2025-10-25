import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../ErrorMessage';
import { ErrorState, ErrorType } from '../../types';

describe('ErrorMessage Component', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render error message with basic information', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('should render without retry button when onRetry is not provided', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should render with retry button when onRetry is provided and error is retryable', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should not render retry button when error is not retryable', () => {
      const error: ErrorState = {
        type: ErrorType.VALIDATION,
        message: 'Invalid data format',
        timestamp: new Date(),
        retryable: false
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('Error Types and Titles', () => {
    it('should display correct title for network errors', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Network timeout',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should display correct title for Firebase errors', () => {
      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Storage access denied',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Storage Error')).toBeInTheDocument();
    });

    it('should display correct title for validation errors', () => {
      const error: ErrorState = {
        type: ErrorType.VALIDATION,
        message: 'Invalid input format',
        timestamp: new Date(),
        retryable: false
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Data Error')).toBeInTheDocument();
    });

    it('should display correct title for AI generation errors', () => {
      const error: ErrorState = {
        type: ErrorType.AI_GENERATION,
        message: 'AI service unavailable',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Generation Error')).toBeInTheDocument();
    });

    it('should display generic title for unknown errors', () => {
      const error: ErrorState = {
        type: ErrorType.UNKNOWN,
        message: 'Something went wrong',
        timestamp: new Date(),
        retryable: false
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    it('should render technical details when provided', () => {
      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Upload failed',
        timestamp: new Date(),
        retryable: true,
        details: {
          code: 'storage/unauthorized',
          serverResponse: 'Access denied'
        }
      };

      render(<ErrorMessage error={error} />);

      // Details should be in a collapsible section
      expect(screen.getByText('Technical details')).toBeInTheDocument();
    });

    it('should expand technical details when clicked', () => {
      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Upload failed',
        timestamp: new Date(),
        retryable: true,
        details: {
          code: 'storage/unauthorized',
          serverResponse: 'Access denied'
        }
      };

      render(<ErrorMessage error={error} />);

      const detailsToggle = screen.getByText('Technical details');
      fireEvent.click(detailsToggle);

      // Should show the JSON details
      expect(screen.getByText(/"code": "storage\/unauthorized"/)).toBeInTheDocument();
    });

    it('should not render details section when no details provided', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.queryByText('Technical details')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onRetry when retry button is clicked', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple retry clicks', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByText('Try Again');
      
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} className="custom-error-class" />);

      const errorContainer = screen.getByText('Connection Error').closest('div');
      expect(errorContainer).toHaveClass('custom-error-class');
    });

    it('should combine custom className with default classes', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} className="my-4 shadow-lg" />);

      const errorContainer = screen.getByText('Connection Error').closest('div');
      expect(errorContainer).toHaveClass('my-4', 'shadow-lg', 'bg-red-50', 'border', 'border-red-200');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button accessibility', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('type', 'button');
    });

    it('should have proper focus management', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: 'Try Again' });
      
      retryButton.focus();
      expect(retryButton).toHaveFocus();
    });

    it('should have proper heading structure', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Connection Error');
    });

    it('should have proper details disclosure', () => {
      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Upload failed',
        timestamp: new Date(),
        retryable: true,
        details: { code: 'test-error' }
      };

      render(<ErrorMessage error={error} />);

      const detailsElement = screen.getByText('Technical details').closest('details');
      expect(detailsElement).toBeInTheDocument();
      expect(detailsElement?.tagName).toBe('DETAILS');
    });
  });

  describe('Error Icons', () => {
    it('should render appropriate icon for network errors', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: 'Connection failed',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      // Check that an SVG icon is rendered
      const icon = screen.getByText('Connection Error').previousElementSibling;
      expect(icon?.tagName).toBe('svg');
    });

    it('should render appropriate icon for Firebase errors', () => {
      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Storage error',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      const icon = screen.getByText('Storage Error').previousElementSibling;
      expect(icon?.tagName).toBe('svg');
    });

    it('should render default icon for unknown errors', () => {
      const error: ErrorState = {
        type: ErrorType.UNKNOWN,
        message: 'Unknown error',
        timestamp: new Date(),
        retryable: false
      };

      render(<ErrorMessage error={error} />);

      const icon = screen.getByText('Error').previousElementSibling;
      expect(icon?.tagName).toBe('svg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', () => {
      const error: ErrorState = {
        type: ErrorType.NETWORK,
        message: '',
        timestamp: new Date(),
        retryable: true
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      // Should still render the component structure
    });

    it('should handle very long error messages', () => {
      const longMessage = 'This is a very long error message that should be displayed properly without breaking the layout or causing any visual issues in the error component';
      
      const error: ErrorState = {
        type: ErrorType.VALIDATION,
        message: longMessage,
        timestamp: new Date(),
        retryable: false
      };

      render(<ErrorMessage error={error} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle complex error details', () => {
      const complexDetails = {
        nested: {
          error: {
            code: 500,
            message: 'Internal server error',
            stack: ['line1', 'line2', 'line3']
          }
        }
      };

      const error: ErrorState = {
        type: ErrorType.FIREBASE,
        message: 'Complex error occurred',
        timestamp: new Date(),
        retryable: true,
        details: complexDetails
      };

      render(<ErrorMessage error={error} />);

      const detailsToggle = screen.getByText('Technical details');
      fireEvent.click(detailsToggle);

      expect(screen.getByText(/"code": 500/)).toBeInTheDocument();
    });
  });
});