"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';

export function useProtectedRoute(redirectTo = '/login') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    console.log('useProtectedRoute: Auth state changed', { isAuthenticated, isLoading });
    
    // Don't do anything while auth is loading
    if (isLoading) {
      console.log('useProtectedRoute: Auth still loading, waiting...');
      setShouldRender(false);
      return;
    }

    // Auth is loaded, now make decisions
    if (!isAuthenticated) {
      console.log('useProtectedRoute: User not authenticated, redirecting to', redirectTo);
      router.push(redirectTo);
      setShouldRender(false);
    } else {
      console.log('useProtectedRoute: User authenticated, allowing render');
      setShouldRender(true);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    shouldRender,
    isLoading,
    isAuthenticated
  };
}