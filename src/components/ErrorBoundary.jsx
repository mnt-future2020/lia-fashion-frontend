"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Bug, AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details in state
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log to external service if available
    this.logErrorToService(error, errorInfo, errorId);
  }

  logErrorToService = (error, errorInfo, errorId) => {
    try {
      // You can integrate with error logging services like Sentry, LogRocket, etc.
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || 'anonymous'
      };

      // Store in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('clientErrors') || '[]');
      existingErrors.push(errorData);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('clientErrors', JSON.stringify(existingErrors));

      // Optional: Send to backend logging endpoint
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(() => {}); // Silent fail for logging

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const isDevMode = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                  {errorId && (
                    <div className="mt-2 text-sm text-gray-600">
                      Error ID: <code className="bg-gray-100 px-1 rounded">{errorId}</code>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Development mode: Show error details */}
              {isDevMode && error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-mono text-sm">
                      <div className="font-semibold">Error:</div>
                      <div className="mt-1 text-red-700">{error.message}</div>
                      {error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-semibold">Stack Trace</summary>
                          <pre className="mt-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                If the problem persists, please contact support or try refreshing the page.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;