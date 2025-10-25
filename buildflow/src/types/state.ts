// State management type definitions for BuildFlow

// Note: Avoiding circular imports by not importing from index.ts
// These types are re-exported in index.ts

// Re-declare enums to avoid circular imports
export enum AppMode {
  DEMO = 'demo',
  LIVE = 'live'
}

export enum AppView {
  HOME = 'home',
  MATERIALS = 'materials',
  FLIPBOOK = 'flipbook',
  INPUT = 'input'
}

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AI_GENERATION = 'ai_generation',
  FIREBASE = 'firebase',
  UNKNOWN = 'unknown'
}

// Re-declare core interfaces to avoid circular imports
export interface Manual {
  id: string;
  productName: string;
  thumbnailURL: string;
  firebaseManualPath: string;
  firebaseImagePath: string;
  createdAt: Date;
  totalPrice: number;
  stepCount: number;
}

export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  imageURL: string;
  estimatedTime: number;
  tools: string[];
  notes?: string;
}

export interface Material {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageURL: string;
  amazonURL?: string;
  category: string;
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

// ============================================================================
// APPLICATION STATE TYPES
// ============================================================================

export interface RootState {
  app: AppState;
  manuals: ManualsState;
  generation: GenerationState;
  navigation: NavigationState;
  ui: UIState;
}

export interface AppState {
  mode: AppMode;
  currentView: AppView;
  initialized: boolean;
  version: string;
}

export interface ManualsState {
  list: Manual[];
  current: Manual | null;
  loading: LoadingState;
  error: ErrorState | null;
  cache: Record<string, {
    manual: Manual;
    steps: Step[];
    materials: Material[];
    timestamp: Date;
  }>;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error: ErrorState | null;
  lastGenerated: {
    manual: Manual;
    steps: Step[];
    materials: Material[];
  } | null;
}

export interface NavigationState {
  currentPage: number;
  totalPages: number;
  canGoBack: boolean;
  canGoForward: boolean;
  history: AppView[];
  breadcrumbs: Array<{
    label: string;
    view: AppView;
    params?: Record<string, any>;
  }>;
}

export interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export interface Action<T = any> {
  type: string;
  payload?: T;
  meta?: Record<string, any>;
  error?: boolean;
}

export interface AsyncAction<T = any> extends Omit<Action<T>, 'error'> {
  loading?: boolean;
  error?: ErrorState;
}

// ============================================================================
// REDUCER TYPES
// ============================================================================

export type Reducer<S, A extends Action = Action> = (state: S, action: A) => S;

export interface ReducerMap {
  [key: string]: Reducer<any, any>;
}

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

export interface Store<S = RootState> {
  getState(): S;
  dispatch(action: Action): void;
  subscribe(listener: () => void): () => void;
}

export interface Middleware<S = RootState> {
  (store: Store<S>): (next: (action: Action) => void) => (action: Action) => void;
}

// ============================================================================
// SELECTOR TYPES
// ============================================================================

export type Selector<S, R> = (state: S) => R;

export interface SelectorMap {
  [key: string]: Selector<any, any>;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  timestamp: Date;
}

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================

export interface PersistConfig {
  key: string;
  storage: Storage;
  whitelist?: string[];
  blacklist?: string[];
  transforms?: Array<{
    in: (state: any) => any;
    out: (state: any) => any;
  }>;
}

export interface HydratedState<S> {
  _persist: {
    version: number;
    rehydrated: boolean;
  };
  state: S;
}