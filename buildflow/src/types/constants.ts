// Constants and configuration types for BuildFlow application

// ============================================================================
// APPLICATION CONSTANTS
// ============================================================================

export const APP_CONFIG = {
  NAME: 'BuildFlow',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered DIY project manual generator',
  AUTHOR: 'BuildFlow Team',
} as const;

export const ROUTES = {
  HOME: '/',
  MATERIALS: '/materials',
  FLIPBOOK: '/flipbook',
  INPUT: '/input',
} as const;

export const STORAGE_KEYS = {
  APP_STATE: 'buildflow_app_state',
  USER_PREFERENCES: 'buildflow_user_preferences',
  CACHED_MANUALS: 'buildflow_cached_manuals',
  THEME: 'buildflow_theme',
} as const;

// ============================================================================
// FIREBASE CONSTANTS
// ============================================================================

export const FIREBASE_PATHS = {
  MANUALS: {
    DEMO: 'manuals/demo',
    GENERATED: 'manuals/generated',
  },
  IMAGES: {
    THUMBNAILS: 'images/thumbnails',
    STEPS: 'images/steps',
  },
} as const;

export const FIREBASE_COLLECTIONS = {
  MANUALS: 'manuals',
  USERS: 'users',
  ANALYTICS: 'analytics',
} as const;

// ============================================================================
// API CONSTANTS
// ============================================================================

export const API_ENDPOINTS = {
  GEMINI: {
    GENERATE: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const REQUEST_TIMEOUTS = {
  DEFAULT: 10000, // 10 seconds
  GENERATION: 30000, // 30 seconds
  UPLOAD: 60000, // 1 minute
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 1050,
  TOOLTIP: 1100,
  NOTIFICATION: 1200,
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION_RULES = {
  PRODUCT_IDEA: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
  MANUAL_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  STEP_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SLUG: /^[a-z0-9-]+$/,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK: {
    OFFLINE: 'You appear to be offline. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
  },
  VALIDATION: {
    REQUIRED: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_URL: 'Please enter a valid URL.',
    TOO_SHORT: 'Input is too short.',
    TOO_LONG: 'Input is too long.',
  },
  AI_GENERATION: {
    FAILED: 'Failed to generate manual. Please try again.',
    INVALID_RESPONSE: 'Received invalid response from AI service.',
    RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  },
  FIREBASE: {
    UPLOAD_FAILED: 'Failed to upload data. Please try again.',
    DOWNLOAD_FAILED: 'Failed to download data. Please try again.',
    PERMISSION_DENIED: 'Permission denied. Please check your access rights.',
  },
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  MANUAL_GENERATED: 'Manual generated successfully!',
  MANUAL_SAVED: 'Manual saved successfully!',
  DATA_LOADED: 'Data loaded successfully!',
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_DARK_MODE: true,
  ENABLE_ANIMATIONS: true,
  ENABLE_PREMIUM_FEATURES: false,
} as const;

// ============================================================================
// TYPE HELPERS FOR CONSTANTS
// ============================================================================

export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];

export type StorageKey = keyof typeof STORAGE_KEYS;
export type StorageValue = typeof STORAGE_KEYS[StorageKey];

export type FirebasePathKey = keyof typeof FIREBASE_PATHS;
export type FirebaseCollectionKey = keyof typeof FIREBASE_COLLECTIONS;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

export type BreakpointKey = keyof typeof BREAKPOINTS;
export type BreakpointValue = typeof BREAKPOINTS[BreakpointKey];

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
export type FeatureFlagValue = typeof FEATURE_FLAGS[FeatureFlagKey];