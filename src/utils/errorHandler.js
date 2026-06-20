import { toast } from "sonner";

// Error types for better categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Get user-friendly error messages
export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (!error) return defaultMessage;

  // Handle Axios errors
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data?.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return data?.message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data?.message || `Server error (${status}). Please try again.`;
    }
  }

  // Handle network errors
  if (error.request) {
    return 'Network error. Please check your internet connection.';
  }

  // Handle JavaScript errors
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

// Determine error type for better handling
export const getErrorType = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;

  if (error.response) {
    const { status } = error.response;
    
    if (status === 401) return ErrorTypes.AUTHENTICATION;
    if (status === 403) return ErrorTypes.PERMISSION;
    if (status === 422 || status === 400) return ErrorTypes.VALIDATION;
    if (status >= 500) return ErrorTypes.SERVER;
    
    return ErrorTypes.CLIENT;
  }

  if (error.request) {
    return ErrorTypes.NETWORK;
  }

  return ErrorTypes.UNKNOWN;
};

// Enhanced async error handler with retry logic
export const handleAsyncError = async (
  asyncFn, 
  options = {}
) => {
  const {
    retries = 0,
    showToast = true,
    errorMessage,
    onError,
    onRetry,
    retryDelay = 1000
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // Log error for debugging
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      const errorType = getErrorType(error);
      const message = getErrorMessage(error, errorMessage);
      
      // Don't retry on authentication or validation errors
      if (errorType === ErrorTypes.AUTHENTICATION || 
          errorType === ErrorTypes.VALIDATION ||
          errorType === ErrorTypes.PERMISSION) {
        break;
      }
      
      // If we have more retries left, wait and try again
      if (attempt < retries) {
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      // This was the last attempt, handle the error
      if (showToast) {
        if (errorType === ErrorTypes.AUTHENTICATION) {
          toast.error(message, {
            action: {
              label: 'Login',
              onClick: () => window.location.href = '/login'
            }
          });
        } else {
          toast.error(message);
        }
      }
      
      if (onError) {
        onError(error, errorType);
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

// Wrapper for API calls with standardized error handling
export const apiCall = async (apiFunction, options = {}) => {
  return handleAsyncError(apiFunction, {
    retries: 2,
    retryDelay: 1000,
    ...options
  });
};

// Safe JSON parse with error handling
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
};

// Safe property access to prevent undefined errors
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn('Safe get failed:', error);
    return defaultValue;
  }
};

// Global error handler for uncaught errors
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Log to error reporting service
    logErrorToService({
      type: 'unhandledRejection',
      error: event.reason,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Prevent default browser error handling
    event.preventDefault();
    
    // Show user-friendly message
    toast.error('An unexpected error occurred. Please try refreshing the page.');
  });

  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    
    // Log to error reporting service
    logErrorToService({
      type: 'uncaughtError',
      error: event.error,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  });
};

// Log errors to storage/service
const logErrorToService = (errorData) => {
  try {
    // Store in localStorage for debugging
    const existingErrors = JSON.parse(localStorage.getItem('globalErrors') || '[]');
    existingErrors.push(errorData);
    
    // Keep only last 20 errors
    if (existingErrors.length > 20) {
      existingErrors.shift();
    }
    
    localStorage.setItem('globalErrors', JSON.stringify(existingErrors));

    // Optional: Send to backend logging endpoint
    // fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorData)
    // }).catch(() => {}); // Silent fail for logging

  } catch (loggingError) {
    console.error('Failed to log global error:', loggingError);
  }
};

// Helper to check if user is online
export const isOnline = () => {
  return navigator.onLine;
};

// Retry wrapper for network-dependent operations
export const withNetworkRetry = async (fn, maxRetries = 3) => {
  return handleAsyncError(fn, {
    retries: maxRetries,
    onRetry: (attempt) => {
      if (!isOnline()) {
        toast.warning('Network connection lost. Retrying when connection is restored...');
      }
    }
  });
};