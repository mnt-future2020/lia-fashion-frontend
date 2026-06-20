import axios from '../lib/axios';

interface OrderResponse {
  status: string;
  data: {
    data: Order[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'manual' | 'shiprocket';
  total_amount: number;
  payment_status: string;
  shipping_status: string;
  notes: string | null;
  shipping_details: unknown;
  payment_details: unknown;
  created_at: string;
  user: {
    name: string;

    
    email: string;
  } | null;
}

export interface UserOrder extends Order {
  items: {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  delivery_date: string | null;
  shipping_address: string;
  billing_address: string;
}

interface UserOrderResponse {
  data: {
    data: UserOrder[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface OrderDetails extends Order {
  items: {
    id: number;
    product: {
      id: number;
      name: string;
    };
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal_amount: number;
  tax_amount: number;
  shipping_charge: number;
  payment_method: string;
  payment_status: string;
  transaction_type: string;
  address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export const orderService = {
  getOrders: async (params?: {
    page?: number;
    per_page?: number;
    status?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<OrderResponse> => {
    try {
      const response = await axios.get('/api/admin/orders', { params });
      return response.data;
    } catch (error) {
      // console.error('Failed to fetch orders:', error);
      throw new Error((error as Error).message || 'Failed to fetch orders');
    }
  },
  updateOrderStatus: async (orderId: number, data: { status: string; delivered_at?: string }): Promise<{ status: string; message: string }> => {
    try {
      const response = await axios.patch(`/api/admin/orders/${orderId}/status`, data);
      return response.data;
    } catch (error) {
      // console.error('Failed to update order status:', error);
      throw new Error((error as Error).message || 'Failed to update order status');
    }
  },

  updateNote: async (orderId: number, note: string): Promise<{ status: string; message: string }> => {
    try {
      const response = await axios.patch(`/api/admin/orders/${orderId}/note`, { note });
      return response.data;
    } catch (error) {
      // console.error('Failed to update order note:', error);
      throw new Error((error as Error).message || 'Failed to update order note');
    }
  },

  getOrder: async (id: number): Promise<{ status: string; data: Order }> => {
    try {
      const response = await axios.get(`/api/admin/orders/${id}`);
      return response.data;
    } catch (error: unknown) {
      // console.error('Failed to fetch order:', error);
      throw new Error((error as Error).message || 'Failed to fetch order');
    }
  },

  // User order methods
  getUserOrders: async (page = 1, perPage = 10): Promise<UserOrderResponse> => {
    try {
      const response = await axios.get('/api/orders', {
        params: {
          page,
          per_page: perPage
        }
      });
      return response.data;
    } catch (error) {
      // console.error('Failed to fetch user orders:', error);
      throw error;
    }
  },

  getUserOrderDetails: async (orderId: number): Promise<{ data: UserOrder }> => {
    try {
      const response = await axios.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      // console.error(`Failed to fetch order ${orderId}:`, error);
      throw error;
    }
  },
  getOrderDetails: async (orderId: number): Promise<{ status: string; data: OrderDetails }> => {
    try {
      const response = await axios.get(`/api/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      // console.error(`Failed to fetch order details ${orderId}:`, error);
      throw error;
    }
  }
};
