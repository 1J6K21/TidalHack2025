import { useState, useEffect, useCallback } from 'react';
import { loadImage, loadFirebaseImage, ImageLoadOptions, ImageLoadResult } from '../services/imageLoader';
import { ErrorState, ErrorType } from '../types';

export interface UseImageLoaderState {
  loading: boolean;
  loaded: boolean;
  error: ErrorState | null;
  url: string;
  fromCache: boolean;
  loadTime: number;
}

export interface UseImageLoaderOptions extends ImageLoadOptions {
  loadOnMount?: boolean;
  resetOnUrlChange?: boolean;
}

/**
 * Hook for loading images with loading states and error handling
 */
export function useImageLoader(
  imageUrl: string | null,
  options: UseImageLoaderOptions = {}
) {
  const {
    loadOnMount = true,
    resetOnUrlChange = true,
    ...loadOptions
  } = options;

  const [state, setState] = useState<UseImageLoaderState>({
    loading: false,
    loaded: false,
    error: null,
    url: '',
    fromCache: false,
    loadTime: 0
  });

  const loadImageAsync = useCallback(async (url: string) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      loaded: false
    }));

    try {
      const result: ImageLoadResult = await loadImage(url, loadOptions);
      
      setState(prev => ({
        ...prev,
        loading: false,
        loaded: result.success,
        error: result.error || null,
        url: result.success ? result.url : '',
        fromCache: result.fromCache || false,
        loadTime: result.loadTime || 0
      }));

      return result;
    } catch (error) {
      const errorState: ErrorState = {
        type: ErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        retryable: true
      };

      setState(prev => ({
        ...prev,
        loading: false,
        loaded: false,
        error: errorState,
        url: '',
        fromCache: false,
        loadTime: 0
      }));

      return { success: false, url: '', error: errorState };
    }
  }, [loadOptions]);

  const retry = useCallback(() => {
    if (imageUrl) {
      loadImageAsync(imageUrl);
    }
  }, [imageUrl, loadImageAsync]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      loaded: false,
      error: null,
      url: '',
      fromCache: false,
      loadTime: 0
    });
  }, []);

  // Load image when URL changes or on mount
  useEffect(() => {
    if (!imageUrl) {
      if (resetOnUrlChange) {
        reset();
      }
      return;
    }

    if (loadOnMount || resetOnUrlChange) {
      loadImageAsync(imageUrl);
    }
  }, [imageUrl, loadOnMount, resetOnUrlChange, loadImageAsync, reset]);

  return {
    ...state,
    retry,
    reset,
    load: loadImageAsync
  };
}

/**
 * Hook for loading Firebase images
 */
export function useFirebaseImageLoader(
  firebasePath: string | null,
  options: UseImageLoaderOptions = {}
) {
  const {
    loadOnMount = true,
    resetOnUrlChange = true,
    ...loadOptions
  } = options;

  const [state, setState] = useState<UseImageLoaderState>({
    loading: false,
    loaded: false,
    error: null,
    url: '',
    fromCache: false,
    loadTime: 0
  });

  const loadFirebaseImageAsync = useCallback(async (path: string) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      loaded: false
    }));

    try {
      const result: ImageLoadResult = await loadFirebaseImage(path, loadOptions);
      
      setState(prev => ({
        ...prev,
        loading: false,
        loaded: result.success,
        error: result.error || null,
        url: result.success ? result.url : '',
        fromCache: result.fromCache || false,
        loadTime: result.loadTime || 0
      }));

      return result;
    } catch (error) {
      const errorState: ErrorState = {
        type: ErrorType.FIREBASE,
        message: error instanceof Error ? error.message : 'Firebase image loading failed',
        timestamp: new Date(),
        retryable: true
      };

      setState(prev => ({
        ...prev,
        loading: false,
        loaded: false,
        error: errorState,
        url: '',
        fromCache: false,
        loadTime: 0
      }));

      return { success: false, url: '', error: errorState };
    }
  }, [loadOptions]);

  const retry = useCallback(() => {
    if (firebasePath) {
      loadFirebaseImageAsync(firebasePath);
    }
  }, [firebasePath, loadFirebaseImageAsync]);

  const reset = useCallback(() => {
    setState({
      loading: false,
      loaded: false,
      error: null,
      url: '',
      fromCache: false,
      loadTime: 0
    });
  }, []);

  // Load image when path changes or on mount
  useEffect(() => {
    if (!firebasePath) {
      if (resetOnUrlChange) {
        reset();
      }
      return;
    }

    if (loadOnMount || resetOnUrlChange) {
      loadFirebaseImageAsync(firebasePath);
    }
  }, [firebasePath, loadOnMount, resetOnUrlChange, loadFirebaseImageAsync, reset]);

  return {
    ...state,
    retry,
    reset,
    load: loadFirebaseImageAsync
  };
}

/**
 * Hook for loading multiple images
 */
export function useMultipleImageLoader(
  imageUrls: string[],
  options: UseImageLoaderOptions = {}
) {
  const [states, setStates] = useState<Record<string, UseImageLoaderState>>({});
  const [overallLoading, setOverallLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const loadImages = useCallback(async () => {
    if (imageUrls.length === 0) return;

    setOverallLoading(true);
    setLoadedCount(0);
    setErrorCount(0);

    // Initialize states
    const initialStates: Record<string, UseImageLoaderState> = {};
    imageUrls.forEach(url => {
      initialStates[url] = {
        loading: true,
        loaded: false,
        error: null,
        url: '',
        fromCache: false,
        loadTime: 0
      };
    });
    setStates(initialStates);

    // Load all images
    const loadPromises = imageUrls.map(async (url) => {
      try {
        const result = await loadImage(url, options);
        
        setStates(prev => ({
          ...prev,
          [url]: {
            loading: false,
            loaded: result.success,
            error: result.error || null,
            url: result.success ? result.url : '',
            fromCache: result.fromCache || false,
            loadTime: result.loadTime || 0
          }
        }));

        if (result.success) {
          setLoadedCount(prev => prev + 1);
        } else {
          setErrorCount(prev => prev + 1);
        }

        return result;
      } catch (error) {
        const errorState: ErrorState = {
          type: ErrorType.UNKNOWN,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        };

        setStates(prev => ({
          ...prev,
          [url]: {
            loading: false,
            loaded: false,
            error: errorState,
            url: '',
            fromCache: false,
            loadTime: 0
          }
        }));

        setErrorCount(prev => prev + 1);
        return { success: false, url: '', error: errorState };
      }
    });

    await Promise.all(loadPromises);
    setOverallLoading(false);
  }, [imageUrls, options]);

  const retry = useCallback(() => {
    loadImages();
  }, [loadImages]);

  const retryFailed = useCallback(() => {
    const failedUrls = imageUrls.filter(url => {
      const state = states[url];
      return state && !state.loaded && state.error;
    });

    if (failedUrls.length === 0) return;

    failedUrls.forEach(async (url) => {
      setStates(prev => ({
        ...prev,
        [url]: {
          ...prev[url],
          loading: true,
          error: null
        }
      }));

      try {
        const result = await loadImage(url, options);
        
        setStates(prev => ({
          ...prev,
          [url]: {
            loading: false,
            loaded: result.success,
            error: result.error || null,
            url: result.success ? result.url : '',
            fromCache: result.fromCache || false,
            loadTime: result.loadTime || 0
          }
        }));

        if (result.success) {
          setLoadedCount(prev => prev + 1);
          setErrorCount(prev => prev - 1);
        }
      } catch (error) {
        const errorState: ErrorState = {
          type: ErrorType.UNKNOWN,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
          retryable: true
        };

        setStates(prev => ({
          ...prev,
          [url]: {
            loading: false,
            loaded: false,
            error: errorState,
            url: '',
            fromCache: false,
            loadTime: 0
          }
        }));
      }
    });
  }, [imageUrls, states, options]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      loadImages();
    }
  }, [imageUrls, loadImages]);

  return {
    states,
    overallLoading,
    loadedCount,
    errorCount,
    totalCount: imageUrls.length,
    allLoaded: loadedCount === imageUrls.length,
    hasErrors: errorCount > 0,
    retry,
    retryFailed,
    load: loadImages
  };
}