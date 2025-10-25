import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MaterialsView from '../MaterialsView';
import { Material, ErrorType } from '../../types';

describe('MaterialsView Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const mockMaterials: Material[] = [
    {
      id: 'material-1',
      name: 'Arduino Uno R3',
      description: 'Microcontroller board based on ATmega328P',
      quantity: 1,
      unitPrice: 25.99,
      totalPrice: 25.99,
      imageURL: 'https://example.com/arduino.jpg',
      amazonURL: 'https://amazon.com/arduino-uno',
      category: 'Electronics'
    },
    {
      id: 'material-2',
      name: 'Breadboard',
      description: 'Half-size solderless breadboard',
      quantity: 2,
      unitPrice: 5.50,
      totalPrice: 11.00,
      imageURL: 'https://example.com/breadboard.jpg',
      amazonURL: 'https://amazon.com/breadboard',
      category: 'Electronics'
    },
    {
      id: 'material-3',
      name: 'LED Pack',
      description: 'Assorted color LED pack (100 pieces)',
      quantity: 1,
      unitPrice: 8.99,
      totalPrice: 8.99,
      imageURL: 'https://example.com/leds.jpg',
      category: 'Components'
    }
  ];

  const mockError = {
    type: ErrorType.NETWORK,
    message: 'Failed to load materials',
    timestamp: new Date(),
    retryable: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    Object.defineProperty(window, 'open', {
      writable: true,
      value: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render materials view with correct header', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Materials & Pricing')).toBeInTheDocument();
      expect(screen.getByText('Review the materials needed for your project and confirm to proceed')).toBeInTheDocument();
    });

    it('should render all materials in grid layout', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Arduino Uno R3')).toBeInTheDocument();
      expect(screen.getByText('Breadboard')).toBeInTheDocument();
      expect(screen.getByText('LED Pack')).toBeInTheDocument();
    });

    it('should display material details correctly', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Check first material details
      expect(screen.getByText('Microcontroller board based on ATmega328P')).toBeInTheDocument();
      expect(screen.getAllByText('Qty: 1')).toHaveLength(2); // Arduino and LED Pack both have qty 1
      expect(screen.getAllByText('$25.99')).toHaveLength(2); // Unit price and total price

      // Check second material with quantity > 1
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('$5.50')).toBeInTheDocument();
      expect(screen.getByText('$11.00')).toBeInTheDocument();
    });

    it('should display Amazon indicators for materials with Amazon links', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const amazonBadges = screen.getAllByText('Amazon');
      expect(amazonBadges).toHaveLength(2); // Only first two materials have Amazon links
    });

    it('should display category badges', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getAllByText('Electronics')).toHaveLength(2);
      expect(screen.getByText('Components')).toBeInTheDocument();
    });

    it('should display total price summary', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Total Project Cost')).toBeInTheDocument();
      expect(screen.getByText('3 materials required')).toBeInTheDocument();
      expect(screen.getByText('$45.98')).toBeInTheDocument();
      expect(screen.getByText('Estimated total')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm & Continue')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      render(
        <MaterialsView
          materials={[]}
          totalPrice={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
      expect(screen.queryByText('Materials & Pricing')).not.toBeInTheDocument();
    });

    it('should hide loading spinner when loading is false', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      expect(screen.getByText('Materials & Pricing')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when error is provided', () => {
      render(
        <MaterialsView
          materials={[]}
          totalPrice={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          error={mockError}
        />
      );

      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load materials')).toBeInTheDocument();
    });

    it('should hide materials content when error is present', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          error={mockError}
        />
      );

      expect(screen.queryByText('Materials & Pricing')).not.toBeInTheDocument();
      expect(screen.queryByText('Arduino Uno R3')).not.toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should show loading spinner for images initially', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Images should be present in DOM
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
    });

    it('should handle image load errors gracefully', async () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const images = screen.getAllByRole('img');
      
      // Simulate image error
      fireEvent.error(images[0]);

      await waitFor(() => {
        expect(screen.getByText('No image')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when Confirm button is clicked', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Confirm & Continue'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Cancel button is clicked', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should open Amazon link when material with Amazon URL is clicked', () => {
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockWindowOpen
      });

      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Click on first material (has Amazon URL)
      fireEvent.click(screen.getByText('Arduino Uno R3').closest('div')!);
      
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://amazon.com/arduino-uno',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should not open link when material without Amazon URL is clicked', () => {
      const mockWindowOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockWindowOpen
      });

      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Click on third material (no Amazon URL)
      fireEvent.click(screen.getByText('LED Pack').closest('div')!);
      
      expect(mockWindowOpen).not.toHaveBeenCalled();
    });
  });

  describe('Price Formatting', () => {
    it('should format prices correctly in USD currency', () => {
      const materialsWithVariousPrices: Material[] = [
        {
          id: 'material-1',
          name: 'Expensive Item',
          description: 'High-cost component',
          quantity: 1,
          unitPrice: 1234.56,
          totalPrice: 1234.56,
          imageURL: 'https://example.com/expensive.jpg',
          category: 'Premium'
        },
        {
          id: 'material-2',
          name: 'Cheap Item',
          description: 'Low-cost component',
          quantity: 1,
          unitPrice: 0.99,
          totalPrice: 0.99,
          imageURL: 'https://example.com/cheap.jpg',
          category: 'Basic'
        }
      ];

      render(
        <MaterialsView
          materials={materialsWithVariousPrices}
          totalPrice={1235.55}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getAllByText('$1,234.56')).toHaveLength(2); // Unit price and total price
      expect(screen.getAllByText('$0.99')).toHaveLength(2); // Unit price and total price
      expect(screen.getByText('$1,235.55')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty materials array gracefully', () => {
      render(
        <MaterialsView
          materials={[]}
          totalPrice={0}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Materials & Pricing')).toBeInTheDocument();
      expect(screen.getByText('0 materials required')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Materials & Pricing');
      expect(screen.getByText('Total Project Cost')).toBeInTheDocument();
    });

    it('should have accessible buttons with proper focus management', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      const confirmButton = screen.getByText('Confirm & Continue');

      // Buttons should be clickable
      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();

      // Test focus management
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);
    });

    it('should have proper alt text for images', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('alt', 'Arduino Uno R3');
      expect(images[1]).toHaveAttribute('alt', 'Breadboard');
      expect(images[2]).toHaveAttribute('alt', 'LED Pack');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive grid classes', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const gridContainer = screen.getByText('Arduino Uno R3').closest('.grid');
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'xl:grid-cols-5');
    });

    it('should apply responsive button layout', () => {
      render(
        <MaterialsView
          materials={mockMaterials}
          totalPrice={45.98}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const buttonContainer = screen.getByText('Cancel').closest('.flex');
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row');
    });
  });
});