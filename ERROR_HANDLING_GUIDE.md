 # Client-Side Error Handling System

This document outlines the comprehensive error handling system implemented to prevent and manage client-side exceptions in the frontend application.

## Overview

The error handling system consists of multiple layers:

1. **React Error Boundary** - Catches React component errors
2. **Global Error Handlers** - Catches unhandled promises and JavaScript errors
3. **Enhanced Axios Interceptors** - Handles API errors with retry logic
4. **Utility Functions** - Provides consistent error handling patterns
5. **UI Components** - User-friendly error displays and loading states

## Components

### 1. ErrorBoundary (`/src/components/ErrorBoundary.jsx`)

A React Error Boundary that catches JavaScript errors anywhere in the component tree.

**Features:**
- Catches and logs React component errors
- Displays user-friendly error UI
- Provides retry functionality
- Stores error details for debugging
- Shows technical details in development mode

**Usage:**
```jsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Global Error Handler (`/src/utils/errorHandler.js`)

Utilities for handling different types of errors consistently.

**Key Functions:**

#### `handleAsyncError(asyncFn, options)`
Wraps async functions with retry logic and error handling.

```javascript
import { handleAsyncError } from '@/utils/errorHandler';

const result = await handleAsyncError(
  () => api.fetchData(),
  {
    retries: 2,
    showToast: true,
    onRetry: (attempt) => console.log(`Retry ${attempt}`)
  }
);
```

#### `getErrorMessage(error, defaultMessage)`
Extracts user-friendly messages from error objects.

#### `safeJsonParse(jsonString, fallback)`
Safely parses JSON with fallback values.

#### `safeGet(obj, path, defaultValue)`
Safely accesses nested object properties.

### 3. Enhanced Axios Configuration (`/src/lib/axios.js`)

Enhanced HTTP client with automatic error handling and retry logic.

**Features:**
- Automatic retry for network and server errors
- Request/response logging in development
- User-friendly error messages
- Authentication error handling
- Request timeout configuration (10 seconds)
- Exponential backoff for retries

**Usage:**
```javascript
import axios, { safeApiCall } from '@/lib/axios';

// Method 1: Direct usage (includes automatic retry)
try {
  const response = await axios.get('/api/data');
} catch (error) {
  console.log(error.userMessage); // User-friendly message
}

// Method 2: Safe wrapper with fallback
const data = await safeApiCall(
  () => axios.get('/api/data'),
  { fallbackValue: [] }
);
```

### 4. Loading and Error UI Components (`/src/components/LoadingErrorWrapper.jsx`)

Reusable components for consistent loading and error states.

**Components:**
- `LoadingSpinner` - Customizable loading indicator
- `ErrorDisplay` - User-friendly error display
- `EmptyState` - No data state
- `PageLoadingWrapper` - Page-level loading/error wrapper

**Usage:**
```jsx
import { PageLoadingWrapper, ErrorDisplay } from '@/components/LoadingErrorWrapper';

function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  return (
    <PageLoadingWrapper 
      loading={loading} 
      error={error} 
      onRetry={() => fetchData()}
    >
      {/* Your content here */}
    </PageLoadingWrapper>
  );
}
```

## Error Types

The system categorizes errors for better handling:

- `NETWORK_ERROR` - Connection issues
- `AUTH_ERROR` - Authentication problems (401)
- `PERMISSION_ERROR` - Authorization issues (403)
- `VALIDATION_ERROR` - Input validation failures (400, 422)
- `SERVER_ERROR` - Server-side issues (5xx)
- `CLIENT_ERROR` - Client-side issues (4xx)
- `UNKNOWN_ERROR` - Unclassified errors

## Best Practices

### 1. Component Error Handling

```jsx
import { useState, useEffect } from 'react';
import { PageLoadingWrapper } from '@/components/LoadingErrorWrapper';
import { safeApiCall } from '@/lib/axios';

function DataComponent() {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await safeApiCall(
        () => axios.get('/api/data'),
        { 
          onError: (error) => {
            // Custom error handling
            console.log('Custom handling:', error);
          }
        }
      );
      
      setState({ data: response.data, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, loading: false, error }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageLoadingWrapper 
      loading={state.loading} 
      error={state.error} 
      onRetry={fetchData}
    >
      {/* Render data */}
    </PageLoadingWrapper>
  );
}
```

### 2. Form Error Handling

```jsx
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorHandler';

async function handleSubmit(formData) {
  try {
    await axios.post('/api/submit', formData);
    toast.success('Form submitted successfully!');
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to submit form');
    toast.error(message);
    
    // Handle validation errors
    if (error.response?.status === 422) {
      setValidationErrors(error.response.data.errors);
    }
  }
}
```

### 3. Safe Data Access

```jsx
import { safeGet } from '@/utils/errorHandler';

function UserProfile({ user }) {
  // Safe property access
  const name = safeGet(user, 'profile.name', 'Anonymous');
  const email = safeGet(user, 'contact.email', 'No email');
  
  return (
    <div>
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  );
}
```

## Debugging and Monitoring

### Error Logging

All errors are automatically logged to:
- Browser console (with detailed information)
- LocalStorage (for debugging)
- Optional: External logging service (configurable)

### Accessing Error Logs

```javascript
// View client-side errors
const clientErrors = JSON.parse(localStorage.getItem('clientErrors') || '[]');

// View global errors (unhandled)
const globalErrors = JSON.parse(localStorage.getItem('globalErrors') || '[]');
```

### Development Mode Features

- Detailed error information in UI
- Request/response logging
- Error boundary shows stack traces
- Debug buttons for testing error scenarios

## Configuration

### Environment Variables

```env
# Enable/disable detailed error logging
NEXT_PUBLIC_ENABLE_ERROR_LOGGING=true

# External error reporting service URL (optional)
NEXT_PUBLIC_ERROR_REPORTING_URL=https://your-error-service.com/api/errors
```

### Axios Configuration

```javascript
// Customize retry behavior
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const REQUEST_TIMEOUT = 10000;
```

## Integration

The error handling system is automatically integrated through:

1. **Root Layout** - `ClientErrorProvider` wraps the entire app
2. **Axios Instance** - All API calls use enhanced error handling
3. **Global Handlers** - Catch unhandled errors automatically

## Common Issues and Solutions

### Issue: "Application error: client side exception has occurred"

**Possible Causes:**
1. Unhandled promise rejections
2. Null/undefined property access
3. Network timeouts
4. Invalid JSON parsing
5. Component state issues

**Solutions:**
1. Use safe property access: `safeGet(obj, 'path', fallback)`
2. Wrap async operations: `handleAsyncError(asyncFn, options)`
3. Use safe JSON parsing: `safeJsonParse(str, fallback)`
4. Implement proper loading states
5. Add error boundaries around components

### Issue: Toast notifications not showing

**Solution:**
Ensure Sonner toaster is properly configured in layout:
```jsx
import { Toaster } from "@/components/ui/sonner";

<Toaster position="top-right" duration={4000} richColors closeButton />
```

### Issue: API errors not handled gracefully

**Solution:**
Use the enhanced axios instance or safe API wrapper:
```javascript
import { safeApiCall } from '@/lib/axios';

const data = await safeApiCall(
  () => axios.get('/api/data'),
  { fallbackValue: [], showErrorToast: true }
);
```

## Testing Error Scenarios

The system includes test functions for common error scenarios:

```javascript
// Test React error boundary
throw new Error('Test React Error');

// Test API error handling
await axios.get('/api/non-existent-endpoint');

// Test unhandled promise rejection
Promise.reject(new Error('Test Promise Rejection'));
```

## Maintenance

Regular maintenance tasks:

1. **Clear Error Logs**: Clear localStorage periodically
2. **Monitor Error Patterns**: Check common error types
3. **Update Error Messages**: Keep user messages helpful
4. **Review Retry Logic**: Adjust retry settings based on usage
5. **Update Dependencies**: Keep error handling libraries updated

## Conclusion

This comprehensive error handling system provides:
- **User Experience**: Graceful error handling with user-friendly messages
- **Developer Experience**: Detailed logging and debugging tools
- **Reliability**: Automatic retry logic and fallback mechanisms
- **Maintainability**: Consistent error handling patterns across the app

By following these patterns and using the provided utilities, you can significantly reduce client-side exceptions and provide a better user experience.