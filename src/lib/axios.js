import axios from 'axios';
import { getAuthToken } from './auth';
import { getErrorMessage, getErrorType } from '@/utils/errorHandler';

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    withCredentials: true,
    timeout: 10000, // 10 second timeout
});

// Request retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Add request ID for tracking
instance.interceptors.request.use(
    (config) => {
        // Add request timestamp and ID for debugging
        config.metadata = {
            startTime: Date.now(),
            requestId: Math.random().toString(36).substr(2, 9)
        };

        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add retry count
        config.retryCount = config.retryCount || 0;

        return config;
    },
    (error) => {
        console.error('Request setup error:', error);
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with retry logic
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const config = error.config;
        
        // Log error details (only for actual errors, not successful requests)
        if (config?.metadata && error.response?.status >= 400) {
            const duration = Date.now() - config.metadata.startTime;
            console.error(`❌ API Error [${config.metadata.requestId}]: ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`, {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                retryCount: config.retryCount
            });
        }

        // Don't retry if we've exceeded max retries
        if (config.retryCount >= MAX_RETRIES) {
            return Promise.reject(error);
        }

        // Determine if we should retry
        const shouldRetry = getShouldRetry(error);
        
        if (shouldRetry) {
            config.retryCount++;
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => 
                setTimeout(resolve, RETRY_DELAY * Math.pow(2, config.retryCount - 1))
            );
            
            return instance(config);
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
            // Add a small delay to allow auth context to initialize on page refresh
            setTimeout(() => {
                handleAuthenticationError();
            }, 500);
        }

        // Enhance error with user-friendly message
        const errorType = getErrorType(error);
        const userMessage = getErrorMessage(error);
        
        // Attach enhanced error info
        error.userMessage = userMessage;
        error.errorType = errorType;
        error.isRetryable = shouldRetry;

        return Promise.reject(error);
    }
);

// Determine if request should be retried
const getShouldRetry = (error) => {
    // Don't retry if no config (probably not an HTTP error)
    if (!error.config) return false;

    // Don't retry authentication errors
    if (error.response?.status === 401) return false;

    // Don't retry validation errors
    if (error.response?.status === 422 || error.response?.status === 400) return false;

    // Don't retry permission errors
    if (error.response?.status === 403) return false;

    // Don't retry not found errors
    if (error.response?.status === 404) return false;

    // Retry network errors
    if (!error.response) return true;

    // Retry server errors (5xx)
    if (error.response.status >= 500) return true;

    // Retry timeout errors
    if (error.code === 'ECONNABORTED') return true;

    // Retry rate limiting
    if (error.response.status === 429) return true;

    return false;
};

// Handle authentication errors
const handleAuthenticationError = () => {
    // Clear stored tokens
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if on a protected user route and not already on login page
        const isUserRoute = window.location.pathname.startsWith('/user/');
        const isLoginPage = window.location.pathname.includes('/login');
        const isAdminRoute = window.location.pathname.startsWith('/admin/');
        
        // Check if there's a valid user token before redirecting
        // This prevents redirects during page refresh when auth context is loading
        const userToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('user-token='))
            ?.split('=')[1];
        
        // Don't redirect if:
        // 1. Already on login page
        // 2. On public pages (not user or admin routes)
        // 3. This is an admin route (admin has its own auth handling)
        // 4. User has a valid token (auth context might still be loading)
        if (!isLoginPage && isUserRoute && !isAdminRoute && !userToken) {
            console.log('Axios: Redirecting to login due to 401 error');
            window.location.href = '/login';
        } else if (userToken && isUserRoute) {
            console.log('Axios: 401 error but user token exists, not redirecting (auth context might be loading)');
        }
    }
};

// Request cancellation support
export const createCancelToken = () => axios.CancelToken.source();

// Helper to check if error is cancellation
export const isCancel = axios.isCancel;

// Safe API wrapper with automatic error handling
export const safeApiCall = async (apiFunction, options = {}) => {
    const { 
        showErrorToast = true, 
        fallbackValue = null,
        onError 
    } = options;

    try {
        return await apiFunction();
    } catch (error) {
        // Log error for debugging
        console.error('Safe API call failed:', error);
        
        // Call custom error handler if provided
        if (onError) {
            onError(error);
        }

        // Show error toast if enabled and not cancelled
        if (showErrorToast && !isCancel(error)) {
            const { toast } = await import('sonner');
            toast.error(error.userMessage || getErrorMessage(error));
        }

        // Return fallback value or rethrow based on options
        if (fallbackValue !== null) {
            return fallbackValue;
        }

        throw error;
    }
};

export default instance;
