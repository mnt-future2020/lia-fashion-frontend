import axios from '../lib/axios';
interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  tax_percentage: number;
  tax_amount: number;
}

interface CartData {
  cart_data: {
    items: CartItem[];
  };
}

interface CreateOrderResponse {
  status: string;
  data: {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image: string;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
    theme: {
      color: string;
    };
  };
}

interface AxiosError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      errors?: {
        transaction_id?: string[];
      };
    };
  };
}

interface PaymentVerificationResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    shipping_status?: 'success' | 'error';
    shipping_error?: string | null;
  };
}

interface RazorpayOrderItem {
  id: number;
  payment_transaction_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  color?: string;
  size?: string;
  metadata: {
    tax_percentage?: number;
    tax_amount?: number;
  };
}

export const paymentService = {
  createOrder: async (transaction_id: number, cartData?: CartData): Promise<CreateOrderResponse> => {
    try {
      // console.log('Creating Razorpay order for transaction:', transaction_id);
      const response = await axios.post('/api/razorpay/create-order', {
        transaction_id: transaction_id,
        cart_data: cartData?.cart_data
      });
      // console.log('Razorpay order created:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.errors?.transaction_id?.[0] || 
        'Failed to create payment order';
      
      // console.error('Payment order creation failed:', {
      //   error: errorMessage,
      //   details: axiosError.response?.data
      // });
      
      throw new Error(errorMessage);
    }
  },
  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    transaction_id: number;
    shipping_details?: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      pin_code: string;
      order_items: Array<{
        name: string;
        sku: string;
        quantity: number;
        price: number;
        weight: number;
        weight_unit: string;
      }>;
    };
  }): Promise<PaymentVerificationResponse> => {
    try {
      // console.log('Verifying payment:', paymentData);
      
      // Validate input data
      if (!paymentData.razorpay_payment_id || !paymentData.razorpay_order_id || !paymentData.razorpay_signature) {
        throw new Error('Missing required payment verification data');
      }

      const response = await axios.post('/api/razorpay/verify-payment', paymentData);
      // console.log('Payment verified:', response.data);

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from payment verification');
      }

      if (!response.data.status || typeof response.data.status !== 'string') {
        throw new Error('Missing or invalid status in verification response');
      }

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Payment verification failed');
      }

      // For successful responses, ensure we have the expected data structure
      if (response.data.status === 'success') {
        if (!response.data.data || typeof response.data.data !== 'object') {
          // console.warn('Success response missing data object:', response.data);
        }

        // Ensure shipping_status is properly set even if backend didn't provide it
        const verificationResponse: PaymentVerificationResponse = {
          status: response.data.status,
          message: response.data.message || 'Payment verified successfully',
          data: {
            shipping_status: response.data.data?.shipping_status || 'success',
            shipping_error: response.data.data?.shipping_error || null
          }
        };

        return verificationResponse;
      }

      // If we get here, something unexpected happened
      throw new Error('Unexpected verification response status');
      
    } catch (error) {
      // console.error('Payment verification failed:', error);

      const axiosError = error as AxiosError;
      let errorMessage = 'Payment verification failed';

      if (axiosError.response?.data) {
        errorMessage = axiosError.response.data.message || 
                      axiosError.response.data.error || 
                      'Payment verification failed';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Verify payment directly from Razorpay API
   * This method can be used to resolve pending payment issues
   */
  verifyPaymentDirect: async (paymentId: string, orderId?: string): Promise<{
    status: string;
    message: string;
    payment_status?: string;
    amount?: number;
    currency?: string;
  }> => {
    try {
      const response = await axios.post('/api/razorpay/verify-payment-direct', {
        payment_id: paymentId,
        order_id: orderId
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorMessage = 'Direct payment verification failed';

      if (axiosError.response?.data) {
        errorMessage = axiosError.response.data.message || 
                      axiosError.response.data.error || 
                      'Direct payment verification failed';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Get pending payments that need verification
   */
  getPendingPayments: async (): Promise<{
    status: string;
    data: {
      pending_payments: Array<{
        id: number;
        razorpay_order_id: string;
        razorpay_payment_id: string | null;
        amount: number;
        status: string;
        created_at: string;
        transaction?: {
          id: number;
          order_number: string;
          customer_name: string;
          payment_status: string;
        } | null;
        user?: {
          id: number;
          name: string;
          email: string;
        } | null;
      }>;
    };
  }> => {
    try {
      const response = await axios.get('/api/razorpay/pending-payments');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorMessage = 'Failed to get pending payments';

      if (axiosError.response?.data) {
        errorMessage = axiosError.response.data.message || 
                      axiosError.response.data.error || 
                      'Failed to get pending payments';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  /**
   * Bulk verify all pending payments
   */
  verifyPendingPayments: async (): Promise<{
    status: string;
    message: string;
    data: {
      results: Array<{
        payment_id: string;
        result: {
          status: string;
          message: string;
          payment_status?: string;
          amount?: number;
          currency?: string;
        };
      }>;
      summary: {
        total: number;
        success: number;
        errors: number;
      };
    };
  }> => {
    try {
      const response = await axios.post('/api/razorpay/verify-pending-payments');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorMessage = 'Bulk payment verification failed';

      if (axiosError.response?.data) {
        errorMessage = axiosError.response.data.message || 
                      axiosError.response.data.error || 
                      'Bulk payment verification failed';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  getRazorpayOrderItems: async (transactionId: number): Promise<RazorpayOrderItem[]> => {
    try {
      const response = await axios.get(`/api/razorpay/transactions/${transactionId}/items`);
      return response.data.data.items;
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data?.message || 'Failed to fetch order items';
      // console.error('Failed to fetch order items:', {
      //   error: errorMessage,
      //   details: axiosError.response?.data
      // });
      throw new Error(errorMessage);
    }
  }
};
