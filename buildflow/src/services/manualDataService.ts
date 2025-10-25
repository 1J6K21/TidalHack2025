import { 
  Manual, 
  GetManualsListResponse, 
  GetManualResponse,
  ApiResponse,
  ErrorState,
  ErrorType,
  LoadingState
} from '../types';
import { getManualsList, getManual } from './firebaseStorage';

// ============================================================================
// CACHING CONFIGURATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

interface CacheConfig {
  manualsList: number; // Cache duration in milliseconds
  manualDetails: number;
  maxEntries: number;
}

const CACHE_CONFIG: CacheConfig = {
  manualsList: 5 * 60 * 1000, // 5 minutes
  manualDetails: 10 * 60 * 1000, // 10 minutes
  maxEntries: 100
};

// ============================================================================
// IN-MEMORY CACHE IMPLEMENTATION
// ============================================================================

class ManualCache {
  private manualsListCache: CacheEntry<GetManualsListResponse> | null = null;
  private manualDetailsCache: Map<string, CacheEntry<GetManualResponse>> = new Map();

  // Cache manuals list
  setManualsList(data: GetManualsListResponse): void {
    const now = new Date();
    this.manualsListCache = {
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + CACHE_CONFIG.manualsList)
    };
  }

  getManualsList(): GetManualsListResponse | null {
    if (!this.manualsListCache) return null;
    
    const now = new Date();
    if (now > this.manualsListCache.expiresAt) {
      this.manualsListCache = null;
      return null;
    }
    
    return this.manualsListCache.data;
  }

  // Cache manual details
  setManualDetails(manualId: string, data: GetManualResponse): void {
    // Implement LRU eviction if cache is full
    if (this.manualDetailsCache.size >= CACHE_CONFIG.maxEntries) {
      const oldestKey = this.manualDetailsCache.keys().next().value;
      if (oldestKey) {
        this.manualDetailsCache.delete(oldestKey);
      }
    }

    const now = new Date();
    this.manualDetailsCache.set(manualId, {
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + CACHE_CONFIG.manualDetails)
    });
  }

  getManualDetails(manualId: string): GetManualResponse | null {
    const entry = this.manualDetailsCache.get(manualId);
    if (!entry) return null;
    
    const now = new Date();
    if (now > entry.expiresAt) {
      this.manualDetailsCache.delete(manualId);
      return null;
    }
    
    return entry.data;
  }

  // Clear all cache
  clear(): void {
    this.manualsListCache = null;
    this.manualDetailsCache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      manualsListCached: !!this.manualsListCache,
      manualDetailsCached: this.manualDetailsCache.size,
      manualsListExpiry: this.manualsListCache?.expiresAt || null
    };
  }
}

// Global cache instance
const cache = new ManualCache();

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

function createNetworkError(message: string, details?: any): ErrorState {
  return {
    type: ErrorType.NETWORK,
    message,
    details,
    timestamp: new Date(),
    retryable: true
  };
}



// ============================================================================
// RETRY LOGIC IMPLEMENTATION
// ============================================================================

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

async function withRetry<T>(
  operation: () => Promise<ApiResponse<T>>,
  config: RetryConfig = RETRY_CONFIG
): Promise<ApiResponse<T>> {
  let lastError: ErrorState | undefined;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const result = await operation();
      
      // If successful, return immediately
      if (result.success) {
        return result;
      }
      
      // If not retryable, return immediately
      if (result.error && !result.error.retryable) {
        return result;
      }
      
      lastError = result.error;
      
      // If this is the last attempt, return the error
      if (attempt === config.maxAttempts) {
        return result;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      
    } catch (error) {
      lastError = createNetworkError(
        `Network error on attempt ${attempt}`,
        error
      );
      
      if (attempt === config.maxAttempts) {
        return {
          data: {} as T,
          success: false,
          error: lastError,
          timestamp: new Date()
        };
      }
      
      // Wait before retry
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  return {
    data: {} as T,
    success: false,
    error: lastError || createNetworkError('Unknown error'),
    timestamp: new Date()
  };
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Fallback demo data when Firebase is not available
 */
const FALLBACK_DEMO_MANUALS: Manual[] = [
  {
    id: 'keyboard',
    productName: 'DIY Mechanical Keyboard',
    thumbnailURL: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
    firebaseManualPath: 'manuals/demo/keyboard',
    firebaseImagePath: 'manuals/demo/keyboard/images',
    createdAt: new Date('2024-01-01'),
    totalPrice: 89.99,
    stepCount: 8
  },
  {
    id: 'lamp',
    productName: 'Modern Table Lamp',
    thumbnailURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    firebaseManualPath: 'manuals/demo/lamp',
    firebaseImagePath: 'manuals/demo/lamp/images',
    createdAt: new Date('2024-01-02'),
    totalPrice: 45.50,
    stepCount: 5
  }
];

/**
 * Fetch list of manuals with caching and error handling
 */
export async function fetchManualsList(
  isDemo: boolean = true,
  forceRefresh: boolean = false
): Promise<ApiResponse<GetManualsListResponse>> {
  console.log('🚀 fetchManualsList called with isDemo:', isDemo, 'forceRefresh:', forceRefresh);
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && isDemo) {
      const cachedData = cache.getManualsList();
      if (cachedData) {
        return {
          data: cachedData,
          success: true,
          timestamp: new Date()
        };
      }
    }

    // Fetch from Firebase with retry logic
    console.log('🔥 Fetching manuals from Firebase...');
    const result = await withRetry(async () => {
      return await getManualsList(isDemo);
    });

    console.log('🔥 Firebase result:', { success: result.success, manualCount: result.data?.manuals?.length });

    // If Firebase fails and we're in demo mode, use fallback data
    if (!result.success && isDemo) {
      console.warn('Firebase unavailable, using fallback demo data');
      const fallbackData: GetManualsListResponse = {
        manuals: FALLBACK_DEMO_MANUALS,
        total: FALLBACK_DEMO_MANUALS.length,
        hasMore: false
      };
      
      // Cache the fallback data
      cache.setManualsList(fallbackData);
      
      return {
        data: fallbackData,
        success: true,
        timestamp: new Date()
      };
    }

    // Cache successful results for demo mode
    if (result.success && result.data && isDemo) {
      cache.setManualsList(result.data);
    }

    return result;

  } catch (error) {
    // If we're in demo mode and there's an error, use fallback data
    if (isDemo) {
      console.warn('Error fetching manuals, using fallback demo data:', error);
      const fallbackData: GetManualsListResponse = {
        manuals: FALLBACK_DEMO_MANUALS,
        total: FALLBACK_DEMO_MANUALS.length,
        hasMore: false
      };
      
      return {
        data: fallbackData,
        success: true,
        timestamp: new Date()
      };
    }

    return {
      data: {
        manuals: [],
        total: 0,
        hasMore: false
      },
      success: false,
      error: createNetworkError('Failed to fetch manuals list', error),
      timestamp: new Date()
    };
  }
}

/**
 * Fetch manual details with caching and error handling
 */
export async function fetchManualDetails(
  manualId: string,
  isDemo: boolean = true,
  forceRefresh: boolean = false
): Promise<ApiResponse<GetManualResponse>> {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedData = cache.getManualDetails(manualId);
      if (cachedData) {
        return {
          data: cachedData,
          success: true,
          timestamp: new Date()
        };
      }
    }

    // Fetch from Firebase with retry logic
    const result = await withRetry(async () => {
      return await getManual(manualId, isDemo);
    });

    // Cache successful results
    if (result.success && result.data) {
      cache.setManualDetails(manualId, result.data);
    }

    return result;

  } catch (error) {
    return {
      data: {
        manual: {} as Manual,
        steps: [],
        materials: []
      },
      success: false,
      error: createNetworkError('Failed to fetch manual details', error),
      timestamp: new Date()
    };
  }
}

/**
 * Prefetch manual details for better user experience
 */
export async function prefetchManualDetails(manualIds: string[], isDemo: boolean = true): Promise<void> {
  // Prefetch in parallel but limit concurrency
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < manualIds.length; i += BATCH_SIZE) {
    const batch = manualIds.slice(i, i + BATCH_SIZE);
    
    const prefetchPromises = batch.map(async (manualId) => {
      try {
        // Only prefetch if not already cached
        if (!cache.getManualDetails(manualId)) {
          await fetchManualDetails(manualId, isDemo);
        }
      } catch (error) {
        // Silently fail prefetch operations
        console.warn(`Failed to prefetch manual ${manualId}:`, error);
      }
    });
    
    await Promise.all(prefetchPromises);
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Validate network connectivity
 */
export async function validateConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small amount of data to test connectivity
    const result = await fetchManualsList(true);
    return result.success;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// LOADING STATE MANAGEMENT
// ============================================================================

interface LoadingStateManager {
  manualsList: LoadingState;
  manualDetails: Map<string, LoadingState>;
}

const loadingStates: LoadingStateManager = {
  manualsList: LoadingState.IDLE,
  manualDetails: new Map()
};

export function getLoadingState(type: 'manualsList' | 'manualDetails', manualId?: string): LoadingState {
  if (type === 'manualsList') {
    return loadingStates.manualsList;
  } else if (type === 'manualDetails' && manualId) {
    return loadingStates.manualDetails.get(manualId) || LoadingState.IDLE;
  }
  return LoadingState.IDLE;
}

export function setLoadingState(
  type: 'manualsList' | 'manualDetails', 
  state: LoadingState, 
  manualId?: string
): void {
  if (type === 'manualsList') {
    loadingStates.manualsList = state;
  } else if (type === 'manualDetails' && manualId) {
    loadingStates.manualDetails.set(manualId, state);
  }
}