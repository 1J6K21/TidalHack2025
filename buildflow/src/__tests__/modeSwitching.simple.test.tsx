import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider, useAppContext } from '../contexts/AppContext';
import { AppMode, AppView } from '../types';

// Simple test component that uses the context
const TestComponent: React.FC = () => {
  const { state, setMode, setView } = useAppContext();
  
  return (
    <div>
      <div data-testid="mode">{state.mode}</div>
      <div data-testid="view">{state.currentView}</div>
      
      <button onClick={() => setMode(AppMode.DEMO)} data-testid="set-demo">
        Set Demo Mode
      </button>
      <button onClick={() => setMode(AppMode.LIVE)} data-testid="set-live">
        Set Live Mode
      </button>
      <button onClick={() => setView(AppView.MATERIALS)} data-testid="set-materials">
        Set Materials View
      </button>
    </div>
  );
};

describe('Mode Switching Simple', () => {
  it('should start with demo mode by default', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('demo');
    expect(screen.getByTestId('view')).toHaveTextContent('home');
  });

  it('should start with custom initial mode', () => {
    render(
      <AppProvider initialMode={AppMode.LIVE}>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('live');
  });

  it('should switch between modes correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Start with demo mode
    expect(screen.getByTestId('mode')).toHaveTextContent('demo');

    // Switch to live mode
    act(() => {
      screen.getByTestId('set-live').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('live');

    // Switch back to demo mode
    act(() => {
      screen.getByTestId('set-demo').click();
    });

    expect(screen.getByTestId('mode')).toHaveTextContent('demo');
  });

  it('should switch views correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Start with home view
    expect(screen.getByTestId('view')).toHaveTextContent('home');

    // Switch to materials view
    act(() => {
      screen.getByTestId('set-materials').click();
    });

    expect(screen.getByTestId('view')).toHaveTextContent('materials');
  });

  it('should maintain mode when switching views', () => {
    render(
      <AppProvider initialMode={AppMode.LIVE}>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('live');
    expect(screen.getByTestId('view')).toHaveTextContent('home');

    // Switch view
    act(() => {
      screen.getByTestId('set-materials').click();
    });

    // Mode should be preserved
    expect(screen.getByTestId('mode')).toHaveTextContent('live');
    expect(screen.getByTestId('view')).toHaveTextContent('materials');
  });
});