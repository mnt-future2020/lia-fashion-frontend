"use client"

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoadingWrapper, ErrorDisplay, LoadingSpinner } from './LoadingErrorWrapper';
import { safeApiCall } from '@/lib/axios';
import { handleAsyncError } from '@/utils/errorHandler';
import axios from '@/lib/axios';

// Example component showing best practices for error handling
export default function ExampleEnhancedComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Method 1: Using safeApiCall wrapper
  const fetchDataSafe = async () => {
    const result = await safeApiCall(
      () => axios.get('/api/example-endpoint'),
      {
        fallbackValue: [], // Return empty array on error
        onError: (error) => {
          console.log('Custom error handling:', error);
          // Custom error handling logic here
        }
      }
    );
    
    setData(result?.data || []);
  };

  // Method 2: Using handleAsyncError utility
  const fetchDataWithRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await handleAsyncError(
        () => axios.get('/api/example-endpoint'),
        {
          retries: 2,
          showToast: true,
          errorMessage: "Failed to load data",
          onRetry: (attempt) => {
            console.log(`Retrying... Attempt ${attempt}`);
          }
        }
      );
      
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Manual error handling with enhanced axios
  const fetchDataManual = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/example-endpoint');
      setData(response.data);
    } catch (err) {
      // Enhanced axios already provides userMessage and errorType
      setError(err);
      
      // Custom handling based on error type
      if (err.errorType === 'NETWORK_ERROR') {
        console.log('Network issue detected');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataWithRetry();
  }, []);

  const handleRetry = () => {
    fetchDataWithRetry();
  };

  return (
    <PageLoadingWrapper 
      loading={loading} 
      error={error} 
      onRetry={handleRetry}
      loadingMessage="Loading example data..."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Error Handling Example</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={fetchDataSafe} variant="outline">
                  Fetch with Safe Wrapper
                </Button>
                <Button onClick={fetchDataWithRetry} variant="outline">
                  Fetch with Retry Logic
                </Button>
                <Button onClick={fetchDataManual} variant="outline">
                  Manual Error Handling
                </Button>
              </div>

              {/* Data display */}
              {data && (
                <div className="mt-4">
                  <h3 className="font-semibold">Data loaded successfully:</h3>
                  <pre className="bg-gray-100 p-4 rounded mt-2 text-sm overflow-auto">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Debugging Panel (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle>Error Debugging (Dev Only)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Client Errors (localStorage):</h4>
                  <Button 
                    onClick={() => {
                      const errors = JSON.parse(localStorage.getItem('clientErrors') || '[]');
                      console.log('Client Errors:', errors);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View Client Errors
                  </Button>
                </div>
                
                <div>
                  <h4 className="font-medium">Global Errors (localStorage):</h4>
                  <Button 
                    onClick={() => {
                      const errors = JSON.parse(localStorage.getItem('globalErrors') || '[]');
                      console.log('Global Errors:', errors);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    View Global Errors
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium">Test Error Scenarios:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      onClick={() => {
                        throw new Error('Test React Error');
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      Throw React Error
                    </Button>
                    
                    <Button 
                      onClick={async () => {
                        try {
                          await axios.get('/api/non-existent-endpoint');
                        } catch (err) {
                          console.log('API Error Test:', err);
                        }
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      Test API Error
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        Promise.reject(new Error('Unhandled Promise Rejection Test'));
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      Test Promise Rejection
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLoadingWrapper>
  );
}