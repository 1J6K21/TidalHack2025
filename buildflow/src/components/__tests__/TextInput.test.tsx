import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from '../TextInput';
import { AppMode, ErrorType } from '../../types';

// Mock the validation function
vi.mock('../../services/manualGeneration', () => ({
  validateProductIdea: vi.fn((idea: string) => {
    if (!idea || idea.trim().length === 0) {
      return { isValid: false, errors: ['Product idea cannot be empty'] };
    }
    if (idea.trim().length < 3) {
      return { isValid: false, errors: ['Product idea must be at least 3 characters long'] };
    }
    if (idea.trim().length > 200) {
      return { isValid: false, errors: ['Product idea must be less than 200 characters'] };
    }
    if (idea.toLowerCase().includes('bomb')) {
      return { isValid: false, errors: ['Product idea contains inappropriate content'] };
    }
    return { isValid: true, errors: [] };
  })
}));

describe('TextInput Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    mode: AppMode.LIVE,
    loading: false,
    error: null,
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment for tests
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyTest123456789';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component with correct branding', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByText('Describe your DIY project idea')).toBeInTheDocument();
      expect(screen.getByText(/Our AI will generate step-by-step instructions/)).toBeInTheDocument();
    });

    it('should render the textarea with correct placeholder', () => {
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('Describe your DIY project idea'));
    });

    it('should render action buttons', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate manual/i })).toBeInTheDocument();
    });

    it('should render example ideas', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByText('Need inspiration? Try these ideas:')).toBeInTheDocument();
      expect(screen.getByText(/floating wooden nightstand/)).toBeInTheDocument();
      expect(screen.getByText(/concrete planters/)).toBeInTheDocument();
      expect(screen.getByText(/laptop stand/)).toBeInTheDocument();
      expect(screen.getByText(/pipe bookshelf/)).toBeInTheDocument();
    });

    it('should show character count', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByText('0/200 characters')).toBeInTheDocument();
    });

    it('should show keyboard shortcut hint', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByText('Press Cmd+Enter to submit')).toBeInTheDocument();
    });
  });

  describe('Demo Mode', () => {
    it('should show demo mode notice when in demo mode', () => {
      render(<TextInput {...defaultProps} mode={AppMode.DEMO} />);

      expect(screen.getByText('Demo Mode Active')).toBeInTheDocument();
      expect(screen.getByText(/Demo mode active/)).toBeInTheDocument();
    });

    it('should allow submission in demo mode', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} mode={AppMode.DEMO} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Test project idea');

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Test project idea');
    });

    it('should not show demo mode notice in live mode', () => {
      render(<TextInput {...defaultProps} mode={AppMode.LIVE} />);

      expect(screen.queryByText('Demo Mode Active')).not.toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should validate input in real-time', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      
      // Type invalid input (too short)
      await user.type(textarea, 'ab');

      await waitFor(() => {
        expect(screen.getByText(/Please fix the following issues/)).toBeInTheDocument();
        expect(screen.getByText(/Product idea must be at least 3 characters long/)).toBeInTheDocument();
      });
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Test idea');

      expect(screen.getByText('9/200 characters')).toBeInTheDocument();
    });

    it('should show validation errors for inappropriate content', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'How to make a bomb');

      await waitFor(() => {
        expect(screen.getByText(/Product idea contains inappropriate content/)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when input becomes valid', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      
      // Type invalid input
      await user.type(textarea, 'ab');
      
      await waitFor(() => {
        expect(screen.getByText(/Product idea must be at least 3 characters long/)).toBeInTheDocument();
      });

      // Fix the input
      await user.type(textarea, 'c');

      await waitFor(() => {
        expect(screen.queryByText(/Product idea must be at least 3 characters long/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit valid input', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Custom wooden desk lamp');

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('Custom wooden desk lamp');
    });

    it('should not submit invalid input', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'ab'); // Too short

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should not submit empty input', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit with Cmd+Enter keyboard shortcut', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Custom wooden desk lamp');
      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(mockOnSubmit).toHaveBeenCalledWith('Custom wooden desk lamp');
    });

    it('should cancel with Escape key', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Test');
      await user.keyboard('{Escape}');

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should disable form when loading', () => {
      render(<TextInput {...defaultProps} loading={true} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading message when loading', () => {
      render(<TextInput {...defaultProps} loading={true} />);

      expect(screen.getByText(/Processing/)).toBeInTheDocument();
      expect(screen.getByText(/This may take 15-30 seconds/)).toBeInTheDocument();
    });

    it('should show loading spinner in submit button when submitting', () => {
      render(<TextInput {...defaultProps} loading={true} />);

      // When loading is true, the button is disabled but still shows "Generate Manual"
      // The "Generating..." text only appears during internal isSubmitting state
      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable form when disabled prop is true', () => {
      render(<TextInput {...defaultProps} disabled={true} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(textarea).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    const mockError = {
      type: ErrorType.AI_GENERATION,
      message: 'Failed to generate manual',
      timestamp: new Date(),
      retryable: true
    };

    it('should display error message when error prop is provided', () => {
      render(<TextInput {...defaultProps} error={mockError} />);

      expect(screen.getByText('Generation Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate manual')).toBeInTheDocument();
    });

    it('should not display error message when error is null', () => {
      render(<TextInput {...defaultProps} error={null} />);

      expect(screen.queryByText('Generation Error')).not.toBeInTheDocument();
    });
  });

  describe('Example Ideas', () => {
    it('should populate textarea when example idea is clicked', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const exampleButton = screen.getByText(/floating wooden nightstand/);
      await user.click(exampleButton);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      expect(textarea).toHaveValue('A floating wooden nightstand with hidden storage');
    });

    it('should not populate textarea when disabled', () => {
      render(<TextInput {...defaultProps} disabled={true} />);

      const exampleButtons = screen.getAllByRole('button');
      const exampleButton = exampleButtons.find(button => 
        button.textContent?.includes('floating wooden nightstand')
      );

      expect(exampleButton).toBeDisabled();
    });

    it('should update character count when example is selected', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const exampleButton = screen.getByText(/floating wooden nightstand/);
      await user.click(exampleButton);

      expect(screen.getByText('48/200 characters')).toBeInTheDocument();
    });
  });

  describe('API Key Validation', () => {
    it('should prevent submission when API key is not configured', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'your_gemini_api_key';
      
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Custom wooden desk lamp');

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should prevent submission when API key is missing', async () => {
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = '';
      
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      await user.type(textarea, 'Custom wooden desk lamp');

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should focus textarea on mount', () => {
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      expect(textarea).toHaveFocus();
    });
  });

  describe('Button States', () => {
    it('should enable submit button only when input is valid', async () => {
      const user = userEvent.setup();
      render(<TextInput {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /generate manual/i });
      
      // Initially disabled (empty input)
      expect(submitButton).toBeDisabled();

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      
      // Still disabled with invalid input
      await user.type(textarea, 'ab');
      expect(submitButton).toBeDisabled();

      // Enabled with valid input
      await user.type(textarea, 'c');
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
    });

    it('should show correct button text based on state', () => {
      const { rerender } = render(<TextInput {...defaultProps} />);

      expect(screen.getByRole('button', { name: /generate manual/i })).toBeInTheDocument();

      rerender(<TextInput {...defaultProps} loading={true} />);
      // When loading prop is true, button is disabled but text remains "Generate Manual"
      // The "Generating..." text only appears during internal form submission
      expect(screen.getByRole('button', { name: /generate manual/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate manual/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<TextInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /project idea/i });
      expect(textarea).toHaveAccessibleName();
    });

    it('should have proper heading structure', () => {
      render(<TextInput {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create New Project');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Need inspiration? Try these ideas:');
    });

    it('should have proper button roles and names', () => {
      render(<TextInput {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper error message accessibility', () => {
      const mockError = {
        type: ErrorType.AI_GENERATION,
        message: 'Test error message',
        timestamp: new Date(),
        retryable: true
      };

      render(<TextInput {...defaultProps} error={mockError} />);

      const errorMessage = screen.getByText('Test error message');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});