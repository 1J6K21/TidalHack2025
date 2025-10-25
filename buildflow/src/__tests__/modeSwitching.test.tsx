import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider } from '../contexts/AppContext';
import { AppMode, AppView } from '../types';

// Mock the data service
vi.mock('../services/dataService', () => ({
  dataService: {
    loadManuals: vi.fn()
  }
}));

import { dataService } from '../services/dataService';
const mockDataService = dataService as any;

// Test component that demonstrates mode switching behavior
const ModeSwitchingTestComponent: React.FC = () => {
  const [manuals, setManuals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentMode, setCurrentMode] = React.useState<AppMode>(AppMode.DEMO);

  const loadManuals = async (mode: AppMode) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataService.loadManuals(mode);
      setManuals(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load manuals');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = async (newMode: AppMode) => {
    setCurrentMode(newMode);
    await loadManuals(newMode);
  };

  React.useEffect(() => {
    loadManuals(currentMode);
  }, []);

  return (
    <div>
      <div data-testid="current-mode">{currentMode}</div>
      <div data-testid="manuals-count">{manuals.length}</div>
      <div data-testid="loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="error">{error || 'null'}</div>
      
      <button 
        onClick={() => switchMode(AppMode.DEMO)} 
        data-testid="switch-to-demo"
      >
        Switch to Demo
      </button>
      <button 
        onClick={() => switchMode(AppMode.LIVE)} 
        data-testid="switch-to-live"
      >
        Switch to Live
      </button>
    </div>
  );
};

describe('Mode Switching Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load demo manuals in demo mode', async () => {
    const demoManuals = [
      { id: 'demo-1', productName: 'Demo Manual 1' },
      { id: 'demo-2', productName: 'Demo Manual 2' }
    ];

    mockDataService.loadManuals.mockResolvedValue(demoManuals as any);

    render(
      <AppProvider initialMode={AppMode.DEMO}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('demo');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('2');
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    expect(mockDataService.loadManuals).toHaveBeenCalledWith(AppMode.DEMO);
  });

  it('should load user manuals in live mode', async () => {
    const userManuals: any[] = [];

    mockDataService.loadManuals.mockResolvedValue(userManuals);

    render(
      <AppProvider initialMode={AppMode.LIVE}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('live');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('0');
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    expect(mockDataService.loadManuals).toHaveBeenCalledWith(AppMode.LIVE);
  });

  it('should switch from demo to live mode', async () => {
    const demoManuals = [{ id: 'demo-1', productName: 'Demo Manual' }];
    const liveManuals: any[] = [];

    mockDataService.loadManuals
      .mockResolvedValueOnce(demoManuals as any) // Initial demo load
      .mockResolvedValueOnce(liveManuals); // Switch to live

    render(
      <AppProvider initialMode={AppMode.DEMO}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    // Wait for initial demo load
    await waitFor(() => {
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('1');
    });

    // Switch to live mode
    act(() => {
      screen.getByTestId('switch-to-live').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('live');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('0');
    });

    expect(mockDataService.loadManuals).toHaveBeenCalledTimes(2);
    expect(mockDataService.loadManuals).toHaveBeenNthCalledWith(1, AppMode.DEMO);
    expect(mockDataService.loadManuals).toHaveBeenNthCalledWith(2, AppMode.LIVE);
  });

  it('should switch from live to demo mode', async () => {
    const liveManuals: any[] = [];
    const demoManuals = [
      { id: 'demo-1', productName: 'Demo Manual 1' },
      { id: 'demo-2', productName: 'Demo Manual 2' }
    ];

    mockDataService.loadManuals
      .mockResolvedValueOnce(liveManuals) // Initial live load
      .mockResolvedValueOnce(demoManuals as any); // Switch to demo

    render(
      <AppProvider initialMode={AppMode.LIVE}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    // Wait for initial live load
    await waitFor(() => {
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('0');
    });

    // Switch to demo mode
    act(() => {
      screen.getByTestId('switch-to-demo').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('demo');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('2');
    });

    expect(mockDataService.loadManuals).toHaveBeenCalledTimes(2);
    expect(mockDataService.loadManuals).toHaveBeenNthCalledWith(1, AppMode.LIVE);
    expect(mockDataService.loadManuals).toHaveBeenNthCalledWith(2, AppMode.DEMO);
  });

  it('should handle loading errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockDataService.loadManuals.mockRejectedValue(new Error('Network error'));

    render(
      <AppProvider initialMode={AppMode.DEMO}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('0');
    });

    consoleSpy.mockRestore();
  });

  it('should show loading state during mode switch', async () => {
    let resolvePromise: (value: any) => void;
    const loadPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockDataService.loadManuals
      .mockResolvedValueOnce([]) // Initial load
      .mockReturnValueOnce(loadPromise as any); // Delayed switch

    render(
      <AppProvider initialMode={AppMode.DEMO}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });

    // Start mode switch
    act(() => {
      screen.getByTestId('switch-to-live').click();
    });

    // Should show loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Complete the switch
    act(() => {
      resolvePromise!([]);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    });
  });

  it('should maintain data consistency during rapid mode switches', async () => {
    const demoManuals = [{ id: 'demo-1', productName: 'Demo Manual' }];
    const liveManuals: any[] = [];

    mockDataService.loadManuals
      .mockResolvedValue(demoManuals as any)
      .mockResolvedValue(liveManuals)
      .mockResolvedValue(demoManuals as any);

    render(
      <AppProvider initialMode={AppMode.DEMO}>
        <ModeSwitchingTestComponent />
      </AppProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('1');
    });

    // Rapid mode switches
    act(() => {
      screen.getByTestId('switch-to-live').click();
    });

    act(() => {
      screen.getByTestId('switch-to-demo').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('demo');
      expect(screen.getByTestId('manuals-count')).toHaveTextContent('1');
    });
  });
});