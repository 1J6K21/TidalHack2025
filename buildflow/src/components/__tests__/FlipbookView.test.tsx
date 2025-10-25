import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlipbookView from '../FlipbookView';
import { Step, Material, ErrorType } from '../../types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock the ProgressiveImage component
vi.mock('../ProgressiveImage', () => ({
  default: ({ src, alt, onLoad }: any) => {
    return (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        data-testid="progressive-image"
      />
    );
  }
}));

describe('FlipbookView Component', () => {
  const mockOnCancel = vi.fn();

  const mockSteps: Step[] = [
    {
      stepNumber: 1,
      title: 'Prepare the PCB',
      description: 'Unpack the PCB and inspect for any damage.',
      imageURL: 'https://example.com/step1.jpg',
      estimatedTime: 10,
      tools: ['Multimeter', 'Anti-static wrist strap'],
      notes: 'Handle the PCB carefully'
    },
    {
      stepNumber: 2,
      title: 'Install Stabilizers',
      description: 'Insert the stabilizers into the designated slots.',
      imageURL: 'https://example.com/step2.jpg',
      estimatedTime: 15,
      tools: ['Stabilizer puller'],
      notes: 'Apply light lubrication'
    },
    {
      stepNumber: 3,
      title: 'Mount PCB in Case',
      description: 'Carefully place the PCB into the case.',
      imageURL: 'https://example.com/step3.jpg',
      estimatedTime: 12,
      tools: ['Phillips head screwdriver', 'Screws']
    }
  ];

  const mockMaterials: Material[] = [
    {
      id: 'pcb-001',
      name: '60% PCB Board',
      description: 'Hot-swappable PCB',
      quantity: 1,
      unitPrice: 45.99,
      totalPrice: 45.99,
      imageURL: 'https://example.com/pcb.jpg',
      amazonURL: 'https://amazon.com/pcb',
      category: 'Electronics'
    },
    {
      id: 'switches-001',
      name: 'Cherry MX Blue Switches',
      description: 'Tactile switches',
      quantity: 61,
      unitPrice: 0.89,
      totalPrice: 54.29,
      imageURL: 'https://example.com/switches.jpg',
      amazonURL: 'https://amazon.com/switches',
      category: 'Electronics'
    }
  ];

  const defaultProps = {
    steps: mockSteps,
    materials: mockMaterials,
    projectName: 'Custom Mechanical Keyboard',
    onCancel: mockOnCancel,
    loading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the flipbook with project name', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('Custom Mechanical Keyboard')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render materials page as the first page', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('Materials Overview')).toBeInTheDocument();
      expect(screen.getByText('Required materials for Custom Mechanical Keyboard')).toBeInTheDocument();
      expect(screen.getByText('60% PCB Board')).toBeInTheDocument();
      expect(screen.getByText('Cherry MX Blue Switches')).toBeInTheDocument();
    });

    it('should display correct page count', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
      expect(screen.getByText('(Materials Overview)')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      render(<FlipbookView {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toBeInTheDocument();
    });

    it('should render page indicators', () => {
      render(<FlipbookView {...defaultProps} />);

      // Should have 4 page indicators (1 materials + 3 steps)
      const indicators = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Go to')
      );
      expect(indicators).toHaveLength(4);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next page when Next button is clicked', async () => {
      render(<FlipbookView {...defaultProps} />);

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
        expect(screen.getByText('(Step 1)')).toBeInTheDocument();
      });
    });

    it('should navigate to previous page when Previous button is clicked', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Go to step 1 first
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
      });

      // Go back to materials
      const prevButton = screen.getByText('Previous');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Materials Overview')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 4')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first page', () => {
      render(<FlipbookView {...defaultProps} />);

      const prevButton = screen.getByText('Previous');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button on last page', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Navigate to last page
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton); // Step 1
      fireEvent.click(nextButton); // Step 2
      fireEvent.click(nextButton); // Step 3

      await waitFor(() => {
        expect(screen.getByText('Mount PCB in Case')).toBeInTheDocument();
        expect(nextButton).toBeDisabled();
      });
    });

    it('should navigate to specific page when page indicator is clicked', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Click on the third page indicator (Step 2)
      const indicators = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Go to')
      );
      fireEvent.click(indicators[2]);

      await waitFor(() => {
        expect(screen.getByText('Install Stabilizers')).toBeInTheDocument();
        expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      // Navigate right with arrow key
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
      });

      // Navigate left with arrow key
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.getByText('Materials Overview')).toBeInTheDocument();
      });
    });

    it('should navigate with spacebar', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
      });
    });

    it('should navigate to first page with Home key', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      // Go to step 2 first
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Install Stabilizers')).toBeInTheDocument();
      });

      // Press Home key
      await user.keyboard('{Home}');

      await waitFor(() => {
        expect(screen.getByText('Materials Overview')).toBeInTheDocument();
      });
    });

    it('should navigate to last page with End key', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      await user.keyboard('{End}');

      await waitFor(() => {
        expect(screen.getByText('Mount PCB in Case')).toBeInTheDocument();
      });
    });

    it('should call onCancel when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should navigate to specific page with number keys', async () => {
      const user = userEvent.setup();
      render(<FlipbookView {...defaultProps} />);

      await user.keyboard('3');

      await waitFor(() => {
        expect(screen.getByText('Install Stabilizers')).toBeInTheDocument();
      });
    });
  });

  describe('Step Page Content', () => {
    beforeEach(async () => {
      render(<FlipbookView {...defaultProps} />);
      
      // Navigate to first step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
      });
    });

    it('should display step information correctly', () => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Step number
      expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
      expect(screen.getByText('Unpack the PCB and inspect for any damage.')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
      expect(screen.getByText('2 tools')).toBeInTheDocument();
    });

    it('should display step notes when available', () => {
      expect(screen.getByText('Note:')).toBeInTheDocument();
      expect(screen.getByText('Handle the PCB carefully')).toBeInTheDocument();
    });

    it('should display required tools', () => {
      expect(screen.getByText('Tools Required')).toBeInTheDocument();
      expect(screen.getByText('Multimeter')).toBeInTheDocument();
      expect(screen.getByText('Anti-static wrist strap')).toBeInTheDocument();
    });

    it('should render step image with correct alt text', () => {
      const stepImage = screen.getByAltText('Step 1: Prepare the PCB');
      expect(stepImage).toBeInTheDocument();
    });
  });

  describe('Materials Page Content', () => {
    it('should display material information correctly', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('60% PCB Board')).toBeInTheDocument();
      expect(screen.getByText('Cherry MX Blue Switches')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
      expect(screen.getByText('Qty: 61')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    it('should display total cost', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('Total Cost:')).toBeInTheDocument();
      expect(screen.getByText('$100.28')).toBeInTheDocument(); // 45.99 + 54.29
    });

    it('should show Amazon indicators for materials with Amazon links', () => {
      render(<FlipbookView {...defaultProps} />);

      const amazonIndicators = screen.getAllByText('Amazon');
      expect(amazonIndicators).toHaveLength(2);
    });
  });

  describe('Progress Tracking', () => {
    it('should track visited pages', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Navigate to step 1
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Progress: 50%')).toBeInTheDocument();
        expect(screen.getByText('Visited: 2/4 pages')).toBeInTheDocument();
      });
    });

    it('should update progress bar correctly', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Check initial progress (25% for page 1 of 4)
      expect(screen.getByText('Progress: 25%')).toBeInTheDocument();

      // Navigate to step 2
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Progress: 75%')).toBeInTheDocument();
      });
    });
  });

  describe('State Persistence', () => {
    it('should save state to localStorage', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Navigate to step 1
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const savedState = localStorage.getItem('flipbook-custom-mechanical-keyboard');
        expect(savedState).toBeTruthy();
        
        const state = JSON.parse(savedState!);
        expect(state.page).toBe(1);
        expect(state.visited).toContain(0);
        expect(state.visited).toContain(1);
      });
    });

    it('should restore state from localStorage', () => {
      // Set initial state in localStorage
      const initialState = {
        page: 2,
        visited: [0, 1, 2],
        history: [0, 1, 2]
      };
      localStorage.setItem('flipbook-custom-mechanical-keyboard', JSON.stringify(initialState));

      render(<FlipbookView {...defaultProps} />);

      // Should start on page 3 (step 2)
      expect(screen.getByText('Install Stabilizers')).toBeInTheDocument();
      expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading spinner when loading is true', () => {
      render(<FlipbookView {...defaultProps} loading={true} />);

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should show error message when error is provided', () => {
      const mockError = {
        type: ErrorType.FIREBASE,
        message: 'Failed to load manual data',
        timestamp: new Date(),
        retryable: true
      };

      render(<FlipbookView {...defaultProps} error={mockError} />);

      expect(screen.getByText('Storage Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load manual data')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onCancel when Back button is clicked', () => {
      render(<FlipbookView {...defaultProps} />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should open Amazon links when material is clicked', () => {
      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true
      });

      render(<FlipbookView {...defaultProps} />);

      // Click on a material with Amazon URL
      const materialCard = screen.getByText('60% PCB Board').closest('div');
      fireEvent.click(materialCard!);

      expect(mockOpen).toHaveBeenCalledWith(
        'https://amazon.com/pcb',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should show navigation history back button when available', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Navigate to step 1
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Back', { selector: 'button' })).toBeInTheDocument();
      });
    });

    it('should navigate back through history when back button is clicked', async () => {
      render(<FlipbookView {...defaultProps} />);

      // Navigate to step 1, then step 2
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Install Stabilizers')).toBeInTheDocument();
      });

      // Click history back button
      const backButtons = screen.getAllByText('Back');
      const historyBackButton = backButtons.find(button => 
        button.getAttribute('title') === 'Go back in navigation history'
      );
      
      if (historyBackButton) {
        fireEvent.click(historyBackButton);

        await waitFor(() => {
          expect(screen.getByText('Prepare the PCB')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Custom Mechanical Keyboard');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Materials Overview');
    });

    it('should have accessible navigation buttons', () => {
      render(<FlipbookView {...defaultProps} />);

      const prevButton = screen.getByText('Previous');
      const nextButton = screen.getByText('Next');

      expect(prevButton).toHaveAttribute('disabled');
      expect(nextButton).not.toHaveAttribute('disabled');
    });

    it('should have proper ARIA labels and titles', () => {
      render(<FlipbookView {...defaultProps} />);

      const indicators = screen.getAllByRole('button').filter(button => 
        button.getAttribute('title')?.includes('Go to')
      );

      indicators.forEach((indicator, index) => {
        const expectedTitle = index === 0 ? 'Go to Materials' : `Go to Step ${index}`;
        expect(indicator).toHaveAttribute('title', expectedTitle);
      });
    });

    it('should provide keyboard navigation hints', () => {
      render(<FlipbookView {...defaultProps} />);

      expect(screen.getByText('Use ← → arrow keys to navigate')).toBeInTheDocument();
      expect(screen.getByText('Press ESC to exit')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty steps array', () => {
      render(<FlipbookView {...defaultProps} steps={[]} />);

      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
      expect(screen.getByText('Materials Overview')).toBeInTheDocument();
    });

    it('should handle empty materials array', () => {
      render(<FlipbookView {...defaultProps} materials={[]} />);

      expect(screen.getByText('Total Cost:')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle steps without notes', async () => {
      const stepsWithoutNotes = mockSteps.map(step => ({ ...step, notes: undefined }));
      render(<FlipbookView {...defaultProps} steps={stepsWithoutNotes} />);

      // Navigate to first step
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.queryByText('Note:')).not.toBeInTheDocument();
      });
    });

    it('should handle materials without Amazon URLs', () => {
      const materialsWithoutAmazon = mockMaterials.map(material => ({ 
        ...material, 
        amazonURL: undefined 
      }));
      
      render(<FlipbookView {...defaultProps} materials={materialsWithoutAmazon} />);

      expect(screen.queryByText('Amazon')).not.toBeInTheDocument();
    });
  });
});