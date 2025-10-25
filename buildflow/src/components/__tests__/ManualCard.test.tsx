import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManualCard from '../ManualCard';
import { Manual } from '../../types';

describe('ManualCard Component', () => {
  const mockOnOpenManual = vi.fn();

  const mockManual: Manual = {
    id: 'test-manual-1',
    productName: 'DIY Wooden Desk',
    thumbnailURL: 'https://example.com/desk-thumb.jpg',
    firebaseManualPath: 'manuals/demo/desk',
    firebaseImagePath: 'manuals/demo/desk/images',
    createdAt: new Date('2024-01-01'),
    totalPrice: 125.99,
    stepCount: 12
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render manual information correctly', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText('DIY Wooden Desk')).toBeInTheDocument();
      expect(screen.getByText('12 steps')).toBeInTheDocument();
      expect(screen.getByText('$125.99')).toBeInTheDocument();
      expect(screen.getByText('Open Manual')).toBeInTheDocument();
    });

    it('should render thumbnail image with correct attributes', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/desk-thumb.jpg');
    });

    it('should format price correctly for different amounts', () => {
      const manualWithDifferentPrice = {
        ...mockManual,
        totalPrice: 9.50
      };

      render(<ManualCard manual={manualWithDifferentPrice} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText('$9.50')).toBeInTheDocument();
    });

    it('should handle long product names gracefully', () => {
      const manualWithLongName = {
        ...mockManual,
        productName: 'This is a very long product name that should be truncated properly to fit within the card layout without breaking the design'
      };

      render(<ManualCard manual={manualWithLongName} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText(manualWithLongName.productName)).toBeInTheDocument();
    });
  });

  describe('Image Loading States', () => {
    it('should show loading spinner initially', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      // Loading spinner should be present initially
      const loadingSpinner = screen.getByText('DIY Wooden Desk').closest('div')?.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should hide loading spinner when image loads successfully', async () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      
      // Simulate image load
      fireEvent.load(image);

      await waitFor(() => {
        const loadingSpinner = screen.getByText('DIY Wooden Desk').closest('div')?.querySelector('.animate-spin');
        expect(loadingSpinner).not.toBeInTheDocument();
      });
    });

    it('should show fallback content when image fails to load', async () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      
      // Simulate image error
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByText('Image not available')).toBeInTheDocument();
      });
    });

    it('should show image icon in fallback state', async () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      fireEvent.error(image);

      await waitFor(() => {
        const fallbackIcon = screen.getByText('Image not available').closest('div');
        expect(fallbackIcon).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onOpenManual with correct manual ID when button is clicked', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const openButton = screen.getByText('Open Manual');
      fireEvent.click(openButton);

      expect(mockOnOpenManual).toHaveBeenCalledTimes(1);
      expect(mockOnOpenManual).toHaveBeenCalledWith('test-manual-1');
    });

    it('should handle multiple clicks correctly', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const openButton = screen.getByText('Open Manual');
      
      fireEvent.click(openButton);
      fireEvent.click(openButton);
      fireEvent.click(openButton);

      expect(mockOnOpenManual).toHaveBeenCalledTimes(3);
      expect(mockOnOpenManual).toHaveBeenCalledWith('test-manual-1');
    });

    it('should have proper button focus states', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const openButton = screen.getByText('Open Manual');
      
      openButton.focus();
      expect(openButton).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button role and text', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const button = screen.getByRole('button', { name: 'Open Manual' });
      expect(button).toBeInTheDocument();
    });

    it('should have proper image alt text', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      expect(image).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('DIY Wooden Desk');
    });

    it('should have keyboard navigation support', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const button = screen.getByRole('button', { name: 'Open Manual' });
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
      
      // Should respond to Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: The actual click behavior is handled by the browser, 
      // but we can test that the button is properly set up for keyboard interaction
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price correctly', () => {
      const freeManual = {
        ...mockManual,
        totalPrice: 0
      };

      render(<ManualCard manual={freeManual} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle single step correctly', () => {
      const singleStepManual = {
        ...mockManual,
        stepCount: 1
      };

      render(<ManualCard manual={singleStepManual} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText('1 steps')).toBeInTheDocument();
    });

    it('should handle very high prices correctly', () => {
      const expensiveManual = {
        ...mockManual,
        totalPrice: 9999.99
      };

      render(<ManualCard manual={expensiveManual} onOpenManual={mockOnOpenManual} />);

      expect(screen.getByText('$9,999.99')).toBeInTheDocument();
    });

    it('should handle empty product name gracefully', () => {
      const manualWithEmptyName = {
        ...mockManual,
        productName: ''
      };

      render(<ManualCard manual={manualWithEmptyName} onOpenManual={mockOnOpenManual} />);

      // Should still render the card structure
      expect(screen.getByText('Open Manual')).toBeInTheDocument();
    });

    it('should handle invalid thumbnail URL gracefully', () => {
      const manualWithInvalidURL = {
        ...mockManual,
        thumbnailURL: 'invalid-url'
      };

      render(<ManualCard manual={manualWithInvalidURL} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      
      // Simulate image error due to invalid URL
      fireEvent.error(image);

      expect(screen.getByText('Image not available')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should apply hover styles correctly', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const card = screen.getByText('Open Manual').closest('.bg-white');
      expect(card).toHaveClass('hover:shadow-xl');
    });

    it('should apply transition classes for smooth animations', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const card = screen.getByText('Open Manual').closest('.bg-white');
      expect(card).toHaveClass('transition-shadow');
      
      const button = screen.getByText('Open Manual');
      expect(button).toHaveClass('transition-colors');
    });

    it('should have proper loading state opacity', () => {
      render(<ManualCard manual={mockManual} onOpenManual={mockOnOpenManual} />);

      const image = screen.getByAltText('DIY Wooden Desk');
      
      // Initially should have opacity-0 (loading state)
      expect(image).toHaveClass('opacity-0');
      
      // After load should have opacity-100
      fireEvent.load(image);
      expect(image).toHaveClass('opacity-100');
    });
  });
});