"use client"

import { useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { setupGlobalErrorHandler } from '@/utils/errorHandler';
import { Toaster } from "@/components/ui/sonner";

export default function ClientErrorProvider({ children }) {
  useEffect(() => {
    // Set up global error handlers
    setupGlobalErrorHandler();

    // Optional: Add network status monitoring
    const handleOnline = () => {
      console.log('Connection restored');
    };

    const handleOffline = () => {
      console.warn('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      {children}
      {/* Add Sonner toaster for better error notifications */}
      <Toaster 
        position="top-right" 
        duration={4000}
        richColors
        closeButton
      />
    </ErrorBoundary>
  );
}