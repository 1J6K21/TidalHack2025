// API-specific type definitions for BuildFlow

// Note: Avoiding circular imports by not importing from index.ts
// These types are re-exported in index.ts

// Re-declare core types to avoid circular imports
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AI_GENERATION = 'ai_generation',
  FIREBASE = 'firebase',
  UNKNOWN = 'unknown'
}

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ErrorState;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

// ============================================================================
// FIREBASE API TYPES
// ============================================================================

export interface FirebaseUploadOptions {
  contentType?: string;
  customMetadata?: Record<string, string>;
  cacheControl?: string;
}

export interface FirebaseDownloadOptions {
  maxSizeBytes?: number;
  timeout?: number;
}

export interface FirebaseListOptions {
  maxResults?: number;
  pageToken?: string;
  prefix?: string;
}

// ============================================================================
// GEMINI AI API TYPES
// ============================================================================

export interface GeminiGenerationConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
}

export interface GeminiSafetySettings {
  category: string;
  threshold: string;
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: GeminiGenerationConfig;
  safetySettings?: GeminiSafetySettings[];
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// ============================================================================
// REQUEST/RESPONSE VALIDATION TYPES
// ============================================================================

export interface ValidationRule<T> {
  field: keyof T;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationSchema<T> {
  rules: ValidationRule<T>[];
}

export interface RequestValidation {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}