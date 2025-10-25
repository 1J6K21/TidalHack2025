'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AppMode, AppView, Manual, ErrorState, LoadingStates, LoadingState } from '../types';

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface AppState {
  mode: AppMode;
  currentView: AppView;
  currentManual: Manual | null;
  loading: LoadingStates;
  error: ErrorState | null;
  projectName: string;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export type AppAction =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_CURRENT_MANUAL'; payload: Manual | null }
  | { type: 'SET_LOADING'; payload: { key: keyof LoadingStates; state: LoadingState } }
  | { type: 'SET_ERROR'; payload: ErrorState | null }
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'RESET_STATE' };

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  mode: AppMode.DEMO, // Default to demo mode
  currentView: AppView.HOME,
  currentManual: null,
  loading: {
    manuals: LoadingState.IDLE,
    generation: LoadingState.IDLE,
    images: LoadingState.IDLE,
    materials: LoadingState.IDLE,
  },
  error: null,
  projectName: '',
};

// ============================================================================
// REDUCER
// ============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload,
      };

    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload,
        error: null, // Clear errors when navigating
      };

    case 'SET_CURRENT_MANUAL':
      return {
        ...state,
        currentManual: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.state,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_PROJECT_NAME':
      return {
        ...state,
        projectName: action.payload,
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        mode: state.mode, // Preserve mode setting
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setMode: (mode: AppMode) => void;
  setView: (view: AppView) => void;
  setCurrentManual: (manual: Manual | null) => void;
  setLoading: (key: keyof LoadingStates, loadingState: LoadingState) => void;
  setError: (error: ErrorState | null) => void;
  setProjectName: (name: string) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialMode?: AppMode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ 
  children, 
  initialMode = AppMode.DEMO 
}) => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    mode: initialMode,
  });

  // Convenience methods
  const setMode = (mode: AppMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  };

  const setView = (view: AppView) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  const setCurrentManual = (manual: Manual | null) => {
    dispatch({ type: 'SET_CURRENT_MANUAL', payload: manual });
  };

  const setLoading = (key: keyof LoadingStates, loadingState: LoadingState) => {
    dispatch({ type: 'SET_LOADING', payload: { key, state: loadingState } });
  };

  const setError = (error: ErrorState | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const setProjectName = (name: string) => {
    dispatch({ type: 'SET_PROJECT_NAME', payload: name });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setMode,
    setView,
    setCurrentManual,
    setLoading,
    setError,
    setProjectName,
    resetState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

export const useAppMode = () => {
  const { state } = useAppContext();
  return state.mode;
};

export const useCurrentView = () => {
  const { state } = useAppContext();
  return state.currentView;
};

export const useCurrentManual = () => {
  const { state } = useAppContext();
  return state.currentManual;
};

export const useLoadingStates = () => {
  const { state } = useAppContext();
  return state.loading;
};

export const useAppError = () => {
  const { state } = useAppContext();
  return state.error;
};

export const useProjectName = () => {
  const { state } = useAppContext();
  return state.projectName;
};