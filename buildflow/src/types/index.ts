// Core data models and type definitions for BuildFlow application

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

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

// ============================================================================
// CORE DATA MODELS
// ============================================================================

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

// ============================================================================
// APPLICATION STATE INTERFACES
// ============================================================================

export interface AppState {
  mode: AppMode;
  currentView: AppView;
  currentManual: Manual | null;
  loading: boolean;
  error: string | null;
}

export interface LoadingStates {
  manuals: LoadingState;
  generation: LoadingState;
  images: LoadingState;
  materials: LoadingState;
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

// Manual Generation APIs
export interface GenerateManualRequest {
  productIdea: string;
  userId: string;
}

export interface GenerateManualResponse {
  manualId: string;
  projectName: string;
  steps: Step[];
  materials: Material[];
  totalPrice: number;
  firebasePath: string;
}

// Manual Retrieval APIs
export interface GetManualRequest {
  manualId: string;
}

export interface GetManualResponse {
  manual: Manual;
  steps: Step[];
  materials: Material[];
}

// Manual List APIs
export interface GetManualsListRequest {
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface GetManualsListResponse {
  manuals: Manual[];
  total: number;
  hasMore: boolean;
}

// Firebase Storage APIs
export interface UploadManualRequest {
  manual: Manual;
  steps: Step[];
  materials: Material[];
  userId: string;
}

export interface UploadManualResponse {
  success: boolean;
  firebasePath: string;
  manualId: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Generic API Response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ErrorState;
  timestamp: Date;
}

// Loading wrapper for async operations
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ErrorState | null;
  lastUpdated?: Date;
}

// Error recovery configuration
export interface ErrorRecovery {
  retryAttempts: number;
  fallbackData?: any;
  userNotification: string;
  logLevel: 'info' | 'warn' | 'error';
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ============================================================================
// FIREBASE SPECIFIC TYPES
// ============================================================================

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseStoragePaths {
  manuals: {
    demo: string;
    generated: string;
  };
  images: {
    thumbnails: string;
    steps: string;
  };
}

// ============================================================================
// GEMINI AI TYPES
// ============================================================================

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface GeminiPrompt {
  productIdea: string;
  context?: string;
  constraints?: string[];
}

export interface GeminiResponse {
  steps: Omit<Step, 'imageURL'>[];
  materials: Omit<Material, 'imageURL' | 'amazonURL'>[];
  projectName: string;
  estimatedTotalTime: number;
}

// ============================================================================
// RE-EXPORTS FROM SPECIALIZED TYPE FILES
// ============================================================================

// Export all API-related types
export * from './api';

// Export all state management types
export * from './state';

// Export all component-related types
export * from './components';

// Export all constants and configuration
export * from './constants';