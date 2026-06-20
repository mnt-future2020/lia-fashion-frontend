"use client"

import { Suspense, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

// Loading component
export function LoadingSpinner({ size = "default", message = "Loading..." }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#eb1c75]`} />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// Error component
export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  showDetails = false 
}) {
  const isNetworkError = !error?.response && error?.request;
  const isServerError = error?.response?.status >= 500;

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-2">
              {isNetworkError 
                ? "Please check your internet connection and try again."
                : isServerError
                ? "Our servers are having trouble. Please try again in a moment."
                : error?.userMessage || error?.message || "An unexpected error occurred."
              }
            </p>
          </div>

          {showDetails && error && (
            <Alert variant="destructive">
              <AlertDescription>
                <details className="text-left">
                  <summary className="cursor-pointer font-semibold">Technical Details</summary>
                  <div className="mt-2 text-xs font-mono">
                    <div>Status: {error.response?.status || 'Network Error'}</div>
                    <div>Message: {error.message}</div>
                    {error.response?.data?.message && (
                      <div>Server: {error.response.data.message}</div>
                    )}
                  </div>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state component
export function EmptyState({ 
  title = "No data found", 
  description = "There's nothing to display right now.",
  action 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Higher-order component for data fetching
export function withLoadingAndError(WrappedComponent) {
  return function WithLoadingAndErrorComponent(props) {
    const { loading, error, onRetry, ...otherProps } = props;

    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <ErrorDisplay 
          error={error} 
          onRetry={onRetry}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      );
    }

    return <WrappedComponent {...otherProps} />;
  };
}

// Hook for common loading/error state
export function useAsyncState(initialState = null) {
  const [state, setState] = useState({
    data: initialState,
    loading: false,
    error: null
  });

  const setLoading = (loading) => {
    setState(prev => ({ ...prev, loading, error: null }));
  };

  const setData = (data) => {
    setState({ data, loading: false, error: null });
  };

  const setError = (error) => {
    setState(prev => ({ ...prev, loading: false, error }));
  };

  const reset = () => {
    setState({ data: initialState, loading: false, error: null });
  };

  return {
    ...state,
    setLoading,
    setData,
    setError,
    reset
  };
}

// Page-level loading wrapper
export function PageLoadingWrapper({ 
  children, 
  loading, 
  error, 
  onRetry,
  loadingMessage = "Loading page...",
  minHeight = "min-h-screen"
}) {
  if (loading) {
    return (
      <div className={`${minHeight} bg-gray-50 flex items-center justify-center`}>
        <LoadingSpinner size="lg" message={loadingMessage} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${minHeight} bg-gray-50 flex items-center justify-center p-4`}>
        <ErrorDisplay 
          error={error} 
          onRetry={onRetry}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    );
  }

  return children;
}

// Suspense wrapper with error boundary
export function SuspenseWrapper({ 
  children, 
  fallback,
  errorFallback 
}) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}