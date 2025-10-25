import { useState, useCallback } from 'react';
import { ErrorState, ErrorType, GenerateManualRequest, GenerateManualResponse, AppMode } from '../types';
import { generateDemoManual, simulateApiDelay } from '../services/demoDataGenerator';

interface GenerationState {
  isGenerating: boolean;
  error: ErrorState | null;
  retryCount: number;
  lastResult: GenerateManualResponse | null;
}

interface UseManualGenerationReturn {
  state: GenerationState;
  generateManual: (request: GenerateManualRequest) => Promise<GenerateManualResponse | null>;
  retry: () => Promise<GenerateManualResponse | null>;
  clearError: () => void;
  reset: () => void;
}

const MAX_RETRIES = 2;

export function useManualGeneration(): UseManualGenerationReturn {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    retryCount: 0,
    lastResult: null
  });

  const [lastRequest, setLastRequest] = useState<GenerateManualRequest | null>(null);

  const createErrorState = (type: ErrorType, message: string, details?: any): ErrorState => ({
    type,
    message,
    details,
    timestamp: new Date(),
    retryable: type === ErrorType.NETWORK || type === ErrorType.AI_GENERATION
  });

  const generateManual = useCallback(async (request: GenerateManualRequest): Promise<GenerateManualResponse | null> => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null
    }));

    setLastRequest(request);

    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      const hasGeminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY && 
                          process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key';
      
      const isDemo = isDemoMode || !hasGeminiKey;

      if (isDemo) {
        // Use demo data generation
        console.log('🎭 Generating demo manual for:', request.productIdea);
        
        // Simulate API delay
        await simulateApiDelay();
        
        const demoResult = generateDemoManual(request.productIdea);
        
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: null,
          lastResult: demoResult,
          retryCount: 0
        }));
        
        return demoResult;
      } else {
        // Use real AI generation
        console.log('🤖 Generating real manual for:', request.productIdea);
        
        // Dynamic import to avoid SSR issues
        const { generateManualWithRetry } = await import('../services/manualGeneration');
        
        const result = await generateManualWithRetry(request, MAX_RETRIES);

        if (result.success && result.data) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: null,
            lastResult: result.data,
            retryCount: 0
          }));
          
          return result.data;
        } else {
          const error = result.error || createErrorState(
            ErrorType.AI_GENERATION,
            'Manual generation failed'
          );
          
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error,
            retryCount: prev.retryCount + 1
          }));
          
          return null;
        }
      }
    } catch (error: any) {
      console.error('Manual generation error:', error);
      
      let errorState: ErrorState;
      
      if (error.message?.includes('API key')) {
        errorState = createErrorState(ErrorType.AI_GENERATION, 'Invalid API key configuration', error);
      } else if (error.message?.includes('quota')) {
        errorState = createErrorState(ErrorType.AI_GENERATION, 'API quota exceeded', error);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorState = createErrorState(ErrorType.NETWORK, 'Network error connecting to AI service', error);
      } else {
        errorState = createErrorState(
          ErrorType.AI_GENERATION,
          error.message || 'Manual generation failed',
          error
        );
      }
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorState,
        retryCount: prev.retryCount + 1
      }));
      
      return null;
    }
  }, []);

  const retry = useCallback(async (): Promise<GenerateManualResponse | null> => {
    if (!lastRequest) {
      console.error('No previous request to retry');
      return null;
    }

    if (state.retryCount >= MAX_RETRIES) {
      setState(prev => ({
        ...prev,
        error: createErrorState(
          ErrorType.AI_GENERATION,
          'Maximum retry attempts exceeded'
        )
      }));
      return null;
    }

    return generateManual(lastRequest);
  }, [lastRequest, state.retryCount, generateManual]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      retryCount: 0,
      lastResult: null
    });
    setLastRequest(null);
  }, []);

  return {
    state,
    generateManual,
    retry,
    clearError,
    reset
  };
}