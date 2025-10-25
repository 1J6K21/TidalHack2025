import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useManualGeneration } from '../useManualGeneration';
import { ErrorType, GenerateManualRequest, GenerateManualResponse } from '../../types';

// Mock the manual generation service
const mockGenerateManualWithRetry = vi.fn();

// Mock the dynamic import
vi.doMock('../../services/manualGeneration', () => ({
  generateManualWithRetry: mockGenerateManualWithRetry
}));

describe('useManualGeneration Hook', () => {
  const mockRequest: GenerateManualRequest = {
    productIdea: 'Custom wooden desk lamp',
    userId: 'test-user'
  };

  const mockSuccessResponse: GenerateManualResponse = {
    manualId: 'manual-123',
    steps: [
      {
        stepNumber: 1,
        title: 'Prepare Base',
        description: 'Cut and sand the wooden base',
        imageURL: 'test-image-1.jpg',
        estimatedTime: 30,
        tools: ['saw', 'sandpaper'],
        notes: 'Wear safety glasses'
      }
    ],
    materials: [
      {
        id: 'wood-base-001',
        name: 'Oak Wood Base',
        description: 'Solid oak base for lamp',
        quantity: 1,
        unitPrice: 25.99,
        totalPrice: 25.99,
        imageURL: 'wood-base.jpg',
        category: 'Hardware'
      }
    ],
    totalPrice: 25.99,
    firebasePath: 'manuals/generated/test-user/manual-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useManualGeneration());

      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.retryCount).toBe(0);
      expect(result.current.state.lastResult).toBe(null);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useManualGeneration());

      expect(typeof result.current.generateManual).toBe('function');
      expect(typeof result.current.retry).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('Successful Generation', () => {
    it('should handle successful manual generation', async () => {
      mockGenerateManualWithRetry.mockResolvedValue({
        success: true,
        data: mockSuccessResponse
      });

      const { result } = renderHook(() => useManualGeneration());

      let generationResult: GenerateManualResponse | null = null;

      await act(async () => {
        generationResult = await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.retryCount).toBe(0);
      expect(result.current.state.lastResult).toEqual(mockSuccessResponse);
      expect(generationResult).toEqual(mockSuccessResponse);
      expect(mockGenerateManualWithRetry).toHaveBeenCalledWith(mockRequest, 2);
    });

    it('should set loading state during generation', async () => {
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise((resolve) => {
        resolveGeneration = resolve;
      });

      mockGenerateManualWithRetry.mockReturnValue(generationPromise);

      const { result } = renderHook(() => useManualGeneration());

      act(() => {
        result.current.generateManual(mockRequest);
      });

      expect(result.current.state.isGenerating).toBe(true);
      expect(result.current.state.error).toBe(null);

      await act(async () => {
        resolveGeneration!({
          success: true,
          data: mockSuccessResponse
        });
        await generationPromise;
      });

      expect(result.current.state.isGenerating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle generation failure with error response', async () => {
      const mockError = {
        type: ErrorType.AI_GENERATION,
        message: 'AI generation failed',
        timestamp: new Date(),
        retryable: true
      };

      mockGenerateManualWithRetry.mockResolvedValue({
        success: false,
        error: mockError,
        data: {
          manualId: '',
          steps: [],
          materials: [],
          totalPrice: 0,
          firebasePath: ''
        }
      });

      const { result } = renderHook(() => useManualGeneration());

      let generationResult: GenerateManualResponse | null = null;

      await act(async () => {
        generationResult = await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.error).toEqual(mockError);
      expect(result.current.state.retryCount).toBe(1);
      expect(result.current.state.lastResult).toBe(null);
      expect(generationResult).toBe(null);
    });

    it('should handle thrown exceptions', async () => {
      const thrownError = new Error('Network connection failed');
      mockGenerateManualWithRetry.mockRejectedValue(thrownError);

      const { result } = renderHook(() => useManualGeneration());

      let generationResult: GenerateManualResponse | null = null;

      await act(async () => {
        generationResult = await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.error).toMatchObject({
        type: ErrorType.AI_GENERATION,
        message: 'Network connection failed',
        retryable: true
      });
      expect(result.current.state.retryCount).toBe(1);
      expect(generationResult).toBe(null);
    });

    it('should categorize API key errors correctly', async () => {
      const apiKeyError = new Error('Invalid API key configuration');
      mockGenerateManualWithRetry.mockRejectedValue(apiKeyError);

      const { result } = renderHook(() => useManualGeneration());

      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error?.type).toBe(ErrorType.AI_GENERATION);
      expect(result.current.state.error?.message).toBe('Invalid API key configuration');
    });

    it('should categorize quota errors correctly', async () => {
      const quotaError = new Error('API quota exceeded');
      mockGenerateManualWithRetry.mockRejectedValue(quotaError);

      const { result } = renderHook(() => useManualGeneration());

      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error?.type).toBe(ErrorType.AI_GENERATION);
      expect(result.current.state.error?.message).toBe('API quota exceeded');
    });

    it('should categorize network errors correctly', async () => {
      const networkError = new Error('network timeout occurred');
      mockGenerateManualWithRetry.mockRejectedValue(networkError);

      const { result } = renderHook(() => useManualGeneration());

      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error?.type).toBe(ErrorType.NETWORK);
      expect(result.current.state.error?.message).toBe('Network error connecting to AI service');
    });

    it('should handle fetch errors as network errors', async () => {
      const fetchError = new Error('fetch failed');
      mockGenerateManualWithRetry.mockRejectedValue(fetchError);

      const { result } = renderHook(() => useManualGeneration());

      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error?.type).toBe(ErrorType.NETWORK);
    });
  });

  describe('Retry Functionality', () => {
    it('should retry with the last request', async () => {
      // First call fails
      mockGenerateManualWithRetry
        .mockResolvedValueOnce({
          success: false,
          error: {
            type: ErrorType.NETWORK,
            message: 'Network timeout',
            timestamp: new Date(),
            retryable: true
          },
          data: {
            manualId: '',
            steps: [],
            materials: [],
            totalPrice: 0,
            firebasePath: ''
          }
        })
        // Second call succeeds
        .mockResolvedValueOnce({
          success: true,
          data: mockSuccessResponse
        });

      const { result } = renderHook(() => useManualGeneration());

      // Initial failed generation
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error).toBeTruthy();
      expect(result.current.state.retryCount).toBe(1);

      // Retry
      let retryResult: GenerateManualResponse | null = null;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(result.current.state.error).toBe(null);
      expect(result.current.state.retryCount).toBe(0);
      expect(result.current.state.lastResult).toEqual(mockSuccessResponse);
      expect(retryResult).toEqual(mockSuccessResponse);
      expect(mockGenerateManualWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should not retry if no previous request exists', async () => {
      const { result } = renderHook(() => useManualGeneration());

      let retryResult: GenerateManualResponse | null = null;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(retryResult).toBe(null);
      expect(mockGenerateManualWithRetry).not.toHaveBeenCalled();
    });

    it('should not retry if max retries exceeded', async () => {
      mockGenerateManualWithRetry.mockResolvedValue({
        success: false,
        error: {
          type: ErrorType.NETWORK,
          message: 'Network timeout',
          timestamp: new Date(),
          retryable: true
        },
        data: {
          manualId: '',
          steps: [],
          materials: [],
          totalPrice: 0,
          firebasePath: ''
        }
      });

      const { result } = renderHook(() => useManualGeneration());

      // Perform multiple failed generations to exceed retry count
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.retryCount).toBe(3);

      // Attempt retry - should fail due to max retries
      let retryResult: GenerateManualResponse | null = null;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(retryResult).toBe(null);
      expect(result.current.state.error?.message).toContain('Maximum retry attempts exceeded');
    });
  });

  describe('State Management Functions', () => {
    it('should clear error when clearError is called', async () => {
      mockGenerateManualWithRetry.mockResolvedValue({
        success: false,
        error: {
          type: ErrorType.AI_GENERATION,
          message: 'Test error',
          timestamp: new Date(),
          retryable: true
        },
        data: {
          manualId: '',
          steps: [],
          materials: [],
          totalPrice: 0,
          firebasePath: ''
        }
      });

      const { result } = renderHook(() => useManualGeneration());

      // Generate error
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.state.error).toBe(null);
    });

    it('should reset all state when reset is called', async () => {
      mockGenerateManualWithRetry.mockResolvedValue({
        success: true,
        data: mockSuccessResponse
      });

      const { result } = renderHook(() => useManualGeneration());

      // Generate successful result
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      expect(result.current.state.lastResult).toBeTruthy();

      // Reset state
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.retryCount).toBe(0);
      expect(result.current.state.lastResult).toBe(null);
    });
  });

  describe('Request Tracking', () => {
    it('should track the last request for retry functionality', async () => {
      mockGenerateManualWithRetry.mockResolvedValue({
        success: true,
        data: mockSuccessResponse
      });

      const { result } = renderHook(() => useManualGeneration());

      const firstRequest = { ...mockRequest, productIdea: 'First idea' };
      const secondRequest = { ...mockRequest, productIdea: 'Second idea' };

      // First generation
      await act(async () => {
        await result.current.generateManual(firstRequest);
      });

      // Second generation
      await act(async () => {
        await result.current.generateManual(secondRequest);
      });

      // Retry should use the second (last) request
      await act(async () => {
        await result.current.retry();
      });

      expect(mockGenerateManualWithRetry).toHaveBeenLastCalledWith(secondRequest, 2);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent generation requests properly', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockGenerateManualWithRetry
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useManualGeneration());

      // Start first request
      act(() => {
        result.current.generateManual({ ...mockRequest, productIdea: 'First idea' });
      });

      expect(result.current.state.isGenerating).toBe(true);

      // Start second request while first is still pending
      act(() => {
        result.current.generateManual({ ...mockRequest, productIdea: 'Second idea' });
      });

      // Resolve second request first
      await act(async () => {
        resolveSecond!({
          success: true,
          data: { ...mockSuccessResponse, manualId: 'manual-second' }
        });
        await secondPromise;
      });

      // Resolve first request
      await act(async () => {
        resolveFirst!({
          success: true,
          data: { ...mockSuccessResponse, manualId: 'manual-first' }
        });
        await firstPromise;
      });

      // Should reflect the last completed request
      expect(result.current.state.isGenerating).toBe(false);
      expect(result.current.state.lastResult?.manualId).toBe('manual-first');
    });
  });

  describe('Error Recovery', () => {
    it('should mark errors as retryable for network and AI generation errors', async () => {
      const networkError = new Error('network failed');
      mockGenerateManualWithRetry.mockRejectedValue(networkError);

      const { result } = renderHook(() => useManualGeneration());

      await act(async () => {
        await result.current.generateManual(mockRequest);
      });

      // Debug: Check if error is set at all
      expect(result.current.state.error).toBeTruthy();
      expect(result.current.state.error?.retryable).toBe(true);
    });

    it('should include error details and timestamp', async () => {
      const testError = new Error('Test error message');
      mockGenerateManualWithRetry.mockRejectedValue(testError);

      const { result } = renderHook(() => useManualGeneration());

      const beforeTime = new Date();
      await act(async () => {
        await result.current.generateManual(mockRequest);
      });
      const afterTime = new Date();

      expect(result.current.state.error?.details).toBe(testError);
      expect(result.current.state.error?.timestamp).toBeInstanceOf(Date);
      expect(result.current.state.error?.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.current.state.error?.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});