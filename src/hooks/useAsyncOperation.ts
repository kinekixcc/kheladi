import { useState, useCallback, useRef } from 'react';

interface UseAsyncOperationOptions {
  timeout?: number;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

interface UseAsyncOperationReturn {
  execute: (operation: () => Promise<any>) => Promise<any>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export const useAsyncOperation = (options: UseAsyncOperationOptions = {}): UseAsyncOperationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const {
    timeout = 30000,
    onSuccess,
    onError,
    onFinally
  } = options;

  const execute = useCallback(async (operation: () => Promise<any>) => {
    // Cancel any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Operation timeout after ${timeout / 1000} seconds`));
        }, timeout);
        
        // Clear timeout if operation completes
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
        });
      });

      // Execute operation with timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise
      ]);

      // Check if operation was aborted
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operation was cancelled');
      }

      setError(null);
      onSuccess?.(result);
      return result;

    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(err?.message || 'Unknown error');
      
      // Don't set error if operation was cancelled
      if (error.message !== 'Operation was cancelled') {
        setError(error);
        onError?.(error);
      }
      
      throw error;
    } finally {
      setLoading(false);
      onFinally?.();
    }
  }, [timeout, onSuccess, onError, onFinally]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    execute,
    loading,
    error,
    reset
  };
};

// Specialized hook for form submissions
export const useFormSubmission = (options: UseAsyncOperationOptions = {}) => {
  const asyncOp = useAsyncOperation(options);
  
  const submitForm = useCallback(async (
    formData: any,
    submitFunction: (data: any) => Promise<any>
  ) => {
    return asyncOp.execute(() => submitFunction(formData));
  }, [asyncOp]);

  return {
    ...asyncOp,
    submitForm
  };
};

// Hook for handling file uploads
export const useFileUpload = (options: UseAsyncOperationOptions = {}) => {
  const asyncOp = useAsyncOperation({
    timeout: 120000, // 2 minutes for file uploads
    ...options
  });
  
  const uploadFile = useCallback(async (
    file: File,
    uploadFunction: (file: File) => Promise<any>
  ) => {
    return asyncOp.execute(() => uploadFunction(file));
  }, [asyncOp]);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    uploadFunction: (files: File[]) => Promise<any>
  ) => {
    return asyncOp.execute(() => uploadFunction(files));
  }, [asyncOp]);

  return {
    ...asyncOp,
    uploadFile,
    uploadMultipleFiles
  };
};
