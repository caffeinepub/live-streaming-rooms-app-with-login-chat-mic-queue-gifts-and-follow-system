import { useState, useEffect, useRef } from 'react';

export interface ZegoExpressEngineError {
  type: 'cdn-load' | 'initialization' | 'not-available';
  message: string;
  details?: string;
}

export interface UseZegoExpressEngineSdkReturn {
  isReady: boolean;
  isLoading: boolean;
  error: ZegoExpressEngineError | null;
  ZegoExpressEngine: any | null;
  retry: () => void;
}

export function useZegoExpressEngineSdk(): UseZegoExpressEngineSdkReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ZegoExpressEngineError | null>(null);
  const [ZegoExpressEngine, setZegoExpressEngine] = useState<any>(null);
  const retryCountRef = useRef(0);
  const checkIntervalRef = useRef<number | null>(null);
  const maxRetries = 3;
  const maxCheckAttempts = 30; // Check for 3 seconds (30 * 100ms)

  const loadSdk = () => {
    setIsLoading(true);
    setError(null);
    setIsReady(false);

    console.log('[ZEGO SDK] Starting SDK load sequence...');

    let checkAttempts = 0;

    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Check for CDN global with polling
    const checkForSdk = () => {
      checkAttempts++;
      console.log(`[ZEGO SDK] Checking for CDN global (attempt ${checkAttempts}/${maxCheckAttempts})...`);

      if (typeof window !== 'undefined' && (window as any).ZegoExpressEngine) {
        console.log('[ZEGO SDK] ✓ Found CDN global ZegoExpressEngine');
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        setZegoExpressEngine((window as any).ZegoExpressEngine);
        setIsReady(true);
        setIsLoading(false);
        retryCountRef.current = 0;
        return;
      }

      // If max attempts reached, show error
      if (checkAttempts >= maxCheckAttempts) {
        console.error('[ZEGO SDK] ✗ CDN global not found after maximum attempts');
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

        setError({
          type: 'cdn-load',
          message: 'Failed to load ZEGOCLOUD Express Engine SDK',
          details: 'The SDK could not be loaded from CDN. Please check your internet connection and refresh the page.',
        });
        setIsLoading(false);
      }
    };

    // Initial check
    checkForSdk();

    // If not found immediately, poll every 100ms
    if (!isReady) {
      checkIntervalRef.current = window.setInterval(checkForSdk, 100);
    }
  };

  const retry = () => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1;
      console.log(`[ZEGO SDK] Retry attempt ${retryCountRef.current}/${maxRetries}`);
      loadSdk();
    } else {
      console.error('[ZEGO SDK] Max retries reached');
      setError({
        type: 'initialization',
        message: 'Maximum retry attempts reached',
        details: 'Please refresh the page to try again.',
      });
    }
  };

  useEffect(() => {
    loadSdk();

    // Cleanup interval on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, []);

  return {
    isReady,
    isLoading,
    error,
    ZegoExpressEngine,
    retry,
  };
}
