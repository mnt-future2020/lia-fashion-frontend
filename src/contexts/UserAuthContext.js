'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from '../lib/axios';
import { setUserToken } from '../lib/auth';

const UserAuthContext = createContext({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    setAuth: () => {},
    logout: () => {}
});

export function UserAuthProvider({ children }) {
    const [state, setState] = useState({
        isAuthenticated: false,
        isLoading: true,
        user: null
    });
    const router = useRouter();

    useEffect(() => {
        // Add a function to watch token changes
        const watchToken = () => {
            const token = Cookies.get('user-token');
            if (!token && state.isAuthenticated) {
                setState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null
                });
                delete axios.defaults.headers.common['Authorization'];
            }
        };

        // Watch for token changes every second
        const tokenWatcher = setInterval(watchToken, 1000);
        
        const checkAuth = async (retryCount = 0) => {
            try {
                const token = Cookies.get('user-token');
                console.log('UserAuth: Checking auth, token exists:', !!token);
                
                if (!token) {
                    console.log('UserAuth: No token found, setting unauthenticated');
                    // Add small delay to prevent race conditions on page refresh
                    setTimeout(() => {
                        setState({
                            isAuthenticated: false,
                            isLoading: false,
                            user: null
                        });
                    }, 100);
                    delete axios.defaults.headers.common['Authorization'];
                    return;
                }

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                // console.log('UserAuth: Making API call to verify token');
                const response = await axios.get('/api/user');
                
                // console.log('UserAuth: Token valid, user authenticated');
                setState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: response.data
                });
            } catch (error) {
                console.error('UserAuth: Auth check failed:', error.response?.status, error.message);
                
                // Only clear token if it's actually invalid (401) or other auth-related errors
                // Don't clear on network errors that might happen during page refresh
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // console.log('UserAuth: Invalid token, clearing auth data');
                    Cookies.remove('user-token', { path: '/' });
                    delete axios.defaults.headers.common['Authorization'];
                    
                    setState({
                        isAuthenticated: false,
                        isLoading: false,
                        user: null
                    });
                } else {
                    // Network/5xx error — retry a FEW times, then STOP loading so the app can
                    // render (as unauthenticated) instead of showing "Loading..." forever.
                    if (retryCount < 2) {
                        console.log('UserAuth: network error, retry', retryCount + 1);
                        setTimeout(() => {
                            checkAuth(retryCount + 1);
                        }, 1000);
                    } else {
                        console.warn('UserAuth: could not verify session after retries; rendering as unauthenticated');
                        setState({
                            isAuthenticated: false,
                            isLoading: false,
                            user: null
                        });
                    }
                    return;
                }
            }
        };

        // Add a small delay before starting auth check to allow page to stabilize
        const initTimer = setTimeout(() => {
            checkAuth();
        }, 50);

        // Clean up intervals and timeouts on unmount
        return () => {
            clearInterval(tokenWatcher);
            clearTimeout(initTimer);
        };
    }, [state.isAuthenticated]); // Add state.isAuthenticated as dependency for watchToken

    const setAuth = (token, userData) => {
        // Set token in cookie (shared helper applies path/sameSite/secure consistently)
        setUserToken(token);
        
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update state
        setState({
            isAuthenticated: true,
            isLoading: false,
            user: userData
        });
    };

    const logout = async () => {
        try {
            // Call logout API endpoint if you have one
            await axios.post('/api/logout');
        } catch (_error) {
            // console.error('Logout error:', _error);
        } finally {
            // Clear everything regardless of API call success
            Cookies.remove('user-token', { path: '/' });
            delete axios.defaults.headers.common['Authorization'];
            setState({
                isAuthenticated: false,
                isLoading: false,
                user: null
            });
            router.push('/login');
        }
    };

    return (
        <UserAuthContext.Provider value={{ ...state, setAuth, logout }}>
            {children}
        </UserAuthContext.Provider>
    );
}

export const useUserAuth = () => {
    const context = useContext(UserAuthContext);
    if (!context) {
        throw new Error('useUserAuth must be used within UserAuthProvider');
    }
    return context;
};
