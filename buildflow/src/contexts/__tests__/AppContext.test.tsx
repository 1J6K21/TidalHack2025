import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider, useAppContext, useAppMode, useCurrentView } from '../AppContext';
import { AppMode, AppView, LoadingState } from '../../types';

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; initialMode?: AppMode }> = ({ 
  children, 
  initialMode = AppMode.DEMO 
}) => (
  <AppProvider initialMode={initialMode}>
    {children}
  </AppProvider>
);

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { state, setMode, setView, setLoading, setError, resetState } = useAppContext();
  
  return (
    <div>
      <div data-testid="mode">{state.mode}</div>
      <div data-testid="view">{state.currentView}</div>
      <div data-testid="loading-manuals">{state.loading.manuals}</div>
      <div data-testid="error">{state.error?.message || 'null'}</div>
      
      <button onClick={() => setMode(AppMode.LIVE)} data-testid="set-live-mode">
        Set Live Mode
      </button>
      <button onClick={() => setView(AppView.MATERIALS)} data-testid="set-materials-view">
        Set Materials View
      </button>
      <button onClick={() => setLoading('manuals', LoadingState.LOADING)} data-testid="set-loading">
        Set Loading
      </button>
      <button onClick={() => setError({ 
        type: 'network' as any, 
        message: 'Test error', 
        timestamp: new Date(), 
        retryable: true 
      })} data-testid="set-error">
        Set Error
      </button>
      <button onClick={resetState} data-testid="reset-state">
        Reset State
      </button>
    </div>
  );
};

describe('AppContext', () => {
  describe('Provider', () => {
    it('should provide initial state with default demo mode', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('demo');
      expect(screen.getByTestId('view')).toHaveTextContent('home');
      expect(screen.getByTestId('loading-manuals')).toHaveTextContent('idle');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('should provide initial state with custom mode', () => {
      render(
        <TestWrapper initialMode={AppMode.LIVE}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('live');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAppContext());
      }).toThrow('useAppContext must be used within an AppProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should update mode correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('demo');
      
      act(() => {
        screen.getByTestId('set-live-mode').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('live');
    });

    it('should update view correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('view')).toHaveTextContent('home');
      
      act(() => {
        screen.getByTestId('set-materials-view').click();
      });

      expect(screen.getByTestId('view')).toHaveTextContent('materials');
    });

    it('should update loading state correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-manuals')).toHaveTextContent('idle');
      
      act(() => {
        screen.getByTestId('set-loading').click();
      });

      expect(screen.getByTestId('loading-manuals')).toHaveTextContent('loading');
    });

    it('should update error state correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('error')).toHaveTextContent('null');
      
      act(() => {
        screen.getByTestId('set-error').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    });

    it('should reset state correctly while preserving mode', () => {
      render(
        <TestWrapper initialMode={AppMode.LIVE}>
          <TestComponent />
        </TestWrapper>
      );

      // Change some state
      act(() => {
        screen.getByTestId('set-materials-view').click();
        screen.getByTestId('set-error').click();
      });

      expect(screen.getByTestId('view')).toHaveTextContent('materials');
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      expect(screen.getByTestId('mode')).toHaveTextContent('live');

      // Reset state
      act(() => {
        screen.getByTestId('reset-state').click();
      });

      expect(screen.getByTestId('view')).toHaveTextContent('home');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('mode')).toHaveTextContent('live'); // Mode should be preserved
    });

    it('should clear error when navigating to new view', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Set an error
      act(() => {
        screen.getByTestId('set-error').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Test error');

      // Navigate to new view
      act(() => {
        screen.getByTestId('set-materials-view').click();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('Selector Hooks', () => {
    it('should return correct mode from useAppMode', () => {
      const { result } = renderHook(() => useAppMode(), {
        wrapper: ({ children }) => <TestWrapper initialMode={AppMode.LIVE}>{children}</TestWrapper>
      });

      expect(result.current).toBe(AppMode.LIVE);
    });

    it('should return correct view from useCurrentView', () => {
      const { result } = renderHook(() => useCurrentView(), {
        wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper>
      });

      expect(result.current).toBe(AppView.HOME);
    });
  });

  describe('Complex State Interactions', () => {
    it('should handle multiple state updates correctly', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Perform multiple state updates
      act(() => {
        screen.getByTestId('set-live-mode').click();
        screen.getByTestId('set-materials-view').click();
        screen.getByTestId('set-loading').click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('live');
      expect(screen.getByTestId('view')).toHaveTextContent('materials');
      expect(screen.getByTestId('loading-manuals')).toHaveTextContent('loading');
    });

    it('should maintain state consistency during rapid updates', () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Rapid state updates
      act(() => {
        screen.getByTestId('set-live-mode').click();
        screen.getByTestId('set-materials-view').click();
        screen.getByTestId('set-error').click();
        screen.getByTestId('set-materials-view').click(); // This should clear error
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('live');
      expect(screen.getByTestId('view')).toHaveTextContent('materials');
      expect(screen.getByTestId('error')).toHaveTextContent('null'); // Error should be cleared
    });
  });
});