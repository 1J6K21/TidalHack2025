import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Homepage from '../Homepage';
import { Manual, LoadingState } from '../../types';
import * as manualDataService from '../../services/manualDataService';

// Mock the manual data service
vi.mock('../../services/manualDataService', () => ({
  fetchManualsList: vi.fn(),
  prefetchManualDetails: vi.fn(),
}));

describe('Homepage Component', () => {
  const mockOnOpenManual = vi.fn();
  const mockOnCreateNew = vi.fn();
  const mockFetchManualsList = vi.mocked(manualDataService.fetchManualsList);
  const mockPrefetchManualDetails = vi.mocked(manualDataService.prefetchManualDetails);

  const mockManuals: Manual[] = [
    {
      id: 'manual-1',
      productName: 'DIY Keyboard',
      thumbnailURL: 'https://example.com/keyboard-thumb.jpg',
      firebaseManualPath: 'manuals/demo/keyboard',
      firebaseImagePath: 'manuals/demo/keyboard/images',
      createdAt: new Date('2024-01-01'),
      totalPrice: 89.99,
      stepCount: 8
    },
    {
      id: 'manual-2',
      productName: 'Table Lamp',
      thumbnailURL: 'https://example.com/lamp-thumb.jpg',
      firebaseManualPath: 'manuals/demo/lamp',
      firebaseImagePath: 'manuals/demo/lamp/images',
      createdAt: new Date('2024-01-02'),
      totalPrice: 45.50,
      stepCount: 5
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the homepage with correct branding', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      // Check branding
      expect(screen.getByText('Manny')).toBeInTheDocument();
      expect(screen.getByText('vibe build')).toBeInTheDocument();

      // Check description
      expect(screen.getByText(/Generate and visualize DIY projects/)).toBeInTheDocument();

      // Check New Project button
      expect(screen.getByText('+ New Project')).toBeInTheDocument();

      // Wait for manuals to load
      await waitFor(() => {
        expect(screen.getByText('Browse Existing Manuals')).toBeInTheDocument();
      });
    });

    it('should render manual cards when manuals are loaded', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('DIY Keyboard')).toBeInTheDocument();
        expect(screen.getByText('Table Lamp')).toBeInTheDocument();
      });

      // Check that manual cards are rendered
      const openManualButtons = screen.getAllByText('Open Manual');
      expect(openManualButtons).toHaveLength(2);
    });

    it('should render empty state when no manuals are available', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: [],
          total: 0,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('No Manuals Available')).toBeInTheDocument();
        expect(screen.getByText('No demo manuals found. Create your first project to get started!')).toBeInTheDocument();
        expect(screen.getByText('Create First Project')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching manuals', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchManualsList.mockReturnValue(pendingPromise);

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      // Should show loading spinner
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      });
    });

    it('should hide loading spinner after successful data fetch', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
        expect(screen.getByText('DIY Keyboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      const mockError = {
        type: 'network' as const,
        message: 'Failed to connect to server',
        timestamp: new Date(),
        retryable: true
      };

      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: [],
          total: 0,
          hasMore: false
        },
        success: false,
        error: mockError,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('Connection Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
      });
    });

    it('should show retry button for retryable errors', async () => {
      const mockError = {
        type: 'network' as const,
        message: 'Network timeout',
        timestamp: new Date(),
        retryable: true
      };

      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: [],
          total: 0,
          hasMore: false
        },
        success: false,
        error: mockError,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button is clicked', async () => {
      const mockError = {
        type: 'network' as const,
        message: 'Network timeout',
        timestamp: new Date(),
        retryable: true
      };

      // First call fails
      mockFetchManualsList
        .mockResolvedValueOnce({
          data: {
            manuals: [],
            total: 0,
            hasMore: false
          },
          success: false,
          error: mockError,
          timestamp: new Date()
        })
        // Second call succeeds
        .mockResolvedValueOnce({
          data: {
            manuals: mockManuals,
            total: 2,
            hasMore: false
          },
          success: true,
          timestamp: new Date()
        });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));

      // Wait for successful retry
      await waitFor(() => {
        expect(screen.getByText('DIY Keyboard')).toBeInTheDocument();
      });

      expect(mockFetchManualsList).toHaveBeenCalledTimes(2);
    });
  });

  describe('User Interactions', () => {
    beforeEach(async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });
    });

    it('should call onCreateNew when New Project button is clicked', async () => {
      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      const newProjectButton = screen.getByText('+ New Project');
      fireEvent.click(newProjectButton);

      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });

    it('should call onCreateNew when Create First Project button is clicked in empty state', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: [],
          total: 0,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('Create First Project')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Create First Project'));
      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenManual with correct manual ID when Open Manual is clicked', async () => {
      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('DIY Keyboard')).toBeInTheDocument();
      });

      const openManualButtons = screen.getAllByText('Open Manual');
      fireEvent.click(openManualButtons[0]);

      expect(mockOnOpenManual).toHaveBeenCalledWith('manual-1');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch demo manuals on component mount', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      expect(mockFetchManualsList).toHaveBeenCalledWith(true);
    });

    it('should prefetch manual details after successful manuals list fetch', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      mockPrefetchManualDetails.mockResolvedValue();

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(mockPrefetchManualDetails).toHaveBeenCalledWith(['manual-1', 'manual-2'], true);
      });
    });

    it('should handle prefetch errors gracefully', async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });

      mockPrefetchManualDetails.mockRejectedValue(new Error('Prefetch failed'));

      // Should not throw error
      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByText('DIY Keyboard')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      mockFetchManualsList.mockResolvedValue({
        data: {
          manuals: mockManuals,
          total: 2,
          hasMore: false
        },
        success: true,
        timestamp: new Date()
      });
    });

    it('should have proper heading structure', async () => {
      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Manny');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Browse Existing Manuals');
      });
    });

    it('should have accessible buttons', async () => {
      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);

        buttons.forEach(button => {
          expect(button).toHaveTextContent(/\S/); // Should have non-whitespace content
        });
      });
    });

    it('should have proper loading state accessibility', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchManualsList.mockReturnValue(pendingPromise);

      render(<Homepage onOpenManual={mockOnOpenManual} onCreateNew={mockOnCreateNew} />);

      const loadingElement = screen.getByRole('status', { name: /loading/i });
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-label', 'Loading');

      resolvePromise!({
        data: { manuals: [], total: 0, hasMore: false },
        success: true,
        timestamp: new Date()
      });
    });
  });
});