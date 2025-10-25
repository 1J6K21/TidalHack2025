import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status', { name: /loading/i });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should render with screen reader text', () => {
      render(<LoadingSpinner />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      
      const srText = screen.getByText('Loading...');
      expect(srText).toHaveClass('sr-only');
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(<LoadingSpinner size="sm" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('h-4', 'w-4');
    });

    it('should render medium size correctly (default)', () => {
      render(<LoadingSpinner size="md" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('h-8', 'w-8');
    });

    it('should render large size correctly', () => {
      render(<LoadingSpinner size="lg" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('h-12', 'w-12');
    });

    it('should default to medium size when no size prop is provided', () => {
      render(<LoadingSpinner />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('h-8', 'w-8');
    });
  });

  describe('Color Variants', () => {
    it('should render blue color correctly (default)', () => {
      render(<LoadingSpinner color="blue" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('border-blue-600');
    });

    it('should render gray color correctly', () => {
      render(<LoadingSpinner color="gray" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('border-gray-600');
    });

    it('should render white color correctly', () => {
      render(<LoadingSpinner color="white" />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('border-white');
    });

    it('should default to blue color when no color prop is provided', () => {
      render(<LoadingSpinner />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('border-blue-600');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />);

      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should combine custom className with default classes', () => {
      render(<LoadingSpinner className="my-4 bg-red-100" />);

      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('my-4', 'bg-red-100', 'flex', 'items-center', 'justify-center');
    });

    it('should handle empty className gracefully', () => {
      render(<LoadingSpinner className="" />);

      const container = screen.getByRole('status').parentElement;
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Animation', () => {
    it('should have spin animation class', () => {
      render(<LoadingSpinner />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('animate-spin');
    });

    it('should have rounded-full class for circular shape', () => {
      render(<LoadingSpinner />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('rounded-full');
    });

    it('should have border-b-2 class for partial border', () => {
      render(<LoadingSpinner />);

      const spinnerElement = screen.getByRole('status').querySelector('div');
      expect(spinnerElement).toHaveClass('border-b-2');
    });
  });

  describe('Combination Props', () => {
    it('should handle all props together correctly', () => {
      render(
        <LoadingSpinner 
          size="lg" 
          color="white" 
          className="my-8 opacity-75" 
        />
      );

      const container = screen.getByRole('status').parentElement;
      const spinnerElement = screen.getByRole('status').querySelector('div');

      expect(container).toHaveClass('my-8', 'opacity-75');
      expect(spinnerElement).toHaveClass('h-12', 'w-12', 'border-white');
    });

    it('should maintain accessibility with all props', () => {
      render(
        <LoadingSpinner 
          size="sm" 
          color="gray" 
          className="custom-spinner" 
        />
      );

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined props gracefully', () => {
      render(<LoadingSpinner size={undefined} color={undefined} className={undefined} />);

      const container = screen.getByRole('status').parentElement;
      const spinnerElement = screen.getByRole('status').querySelector('div');

      // Should use defaults
      expect(container).toHaveClass('flex', 'items-center', 'justify-center');
      expect(spinnerElement).toHaveClass('h-8', 'w-8', 'border-blue-600');
    });

    it('should render consistently across multiple instances', () => {
      const { rerender } = render(<LoadingSpinner />);
      
      const firstSpinner = screen.getByRole('status');
      expect(firstSpinner).toBeInTheDocument();

      rerender(<LoadingSpinner size="lg" color="gray" />);
      
      const secondSpinner = screen.getByRole('status');
      expect(secondSpinner).toBeInTheDocument();
      expect(secondSpinner.querySelector('div')).toHaveClass('h-12', 'w-12', 'border-gray-600');
    });
  });
});