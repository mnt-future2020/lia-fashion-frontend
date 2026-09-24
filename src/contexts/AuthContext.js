'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, removeAuthToken } from '../lib/auth';

const defaultState = {
  isAuthenticated: false,
  isLoading: true,
  initialized: false
};

const AuthContext = createContext(defaultState);

export function AuthProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const router = useRouter();

  const checkAuth = () => {
    const token = getAuthToken();
    if (!token && state.isAuthenticated) {
      setState(prev => ({ ...prev, isAuthenticated: false }));
      router.replace('/admin/login');
    }
    // Return the SAME state object when nothing changed so React skips the re-render.
    // The 1s poll otherwise created a fresh object every tick and re-rendered the whole
    // app tree every second. Behaviour (token detection + redirect above) is unchanged.
    setState(prev => {
      const authed = !!token;
      if (prev.isAuthenticated === authed && prev.initialized === true && prev.isLoading === false) {
        return prev;
      }
      return {
        ...prev,
        isAuthenticated: authed,
        isLoading: false,
        initialized: true
      };
    });
  };

  useEffect(() => {
    checkAuth();
    
    // Check for token removal
    const interval = setInterval(checkAuth, 1000);
    window.addEventListener('storage', checkAuth);
    document.addEventListener('tokenRemoved', checkAuth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkAuth);
      document.removeEventListener('tokenRemoved', checkAuth);
    };
  }, [router]);

  const logout = () => {
    removeAuthToken();
    document.dispatchEvent(new Event('tokenRemoved'));
  };

  const value = {
    ...state,
    logout,
    updateAuth: (newState) => setState(prev => ({ ...prev, ...newState }))
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
