"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUserAuth } from "./UserAuthContext";
import axios from "../lib/axios";

// Define interface for cart item
interface CartItem {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: string;
  tax_amount: string;
  size?: string;
  product?: {
    tax_percentage?: number;
    sizes?: Array<{ size: string; stock: string | number }> | string;
  };
  [key: string]: unknown; // For other properties
}

// Define interface for cart data
interface CartData {
  items: CartItem[];
  [key: string]: unknown; // For other properties
}

interface CartContextType {
  cartCount: number;
  cartData: CartData | null;
  updateCartData: () => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  validateStockAvailability: () => { isValid: boolean; message?: string };
  isLoading: boolean;
}

const UserCartContext = createContext<CartContextType>({
  cartCount: 0,
  cartData: null,
  updateCartData: async () => {},
  updateCartItem: async () => {},
  validateStockAvailability: () => ({ isValid: true }),
  isLoading: true,
});

export function UserCartProvider({ children }: { children: ReactNode }) {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();

  const updateCartData = async () => {
    setIsLoading(true);
    
    // Wait for auth to be loaded before making decisions
    if (authLoading) {
      setIsLoading(false);
      return;
    }
    
    if (!isAuthenticated) {
      setCartCount(0);
      setCartData(null);
      setIsLoading(false);
      return;
    }
    
    try {
      const { data } = await axios.get("/api/cart");
      setCartData(data);
      setCartCount(data?.items?.length || 0);
    } catch (error) {
      // console.error("Failed to fetch cart data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optimistic update for cart items
  const updateCartItem = async (itemId: number, newQuantity: number) => {
    if (!cartData || !cartData.items) return;
    
    // First update UI optimistically
    const updatedItems = cartData.items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            quantity: newQuantity,
            subtotal: (item.unit_price * newQuantity).toFixed(2),
            tax_amount: ((item.unit_price * newQuantity * (item.product?.tax_percentage || 0)) / 100).toFixed(2)
          }
        : item
    );

    setCartData({
      ...cartData,
      items: updatedItems
    });

    try {
      // Then send API request
      const { data } = await axios.patch(`/api/cart/items/${itemId}`, {
        quantity: newQuantity
      });
      
      // Update with server response if needed
      setCartData(data);
    } catch (error) {
      // console.error("Failed to update cart item:", error);
      // Revert to original data by refreshing cart
      updateCartData();
    }
  };

  // Validate stock availability for all cart items
  const validateStockAvailability = () => {
    if (!cartData?.items || cartData.items.length === 0) {
      return { isValid: false, message: "Cart is empty" };
    }

    for (const item of cartData.items) {
      if (!item.product) {
        return { isValid: false, message: `Product information missing for ${item.product_name}` };
      }

      const availableStock = getAvailableStock(item.product, item.size || '');
      
      if (availableStock < item.quantity) {
        return { 
          isValid: false, 
          message: `Insufficient stock for ${item.product_name} (${item.size || 'N/A'}). Only ${availableStock} available, but ${item.quantity} requested.` 
        };
      }

      if (availableStock === 0) {
        return { 
          isValid: false, 
          message: `${item.product_name} (${item.size || 'N/A'}) is out of stock.` 
        };
      }
    }

    return { isValid: true };
  };

  // Helper function to get available stock
  const getAvailableStock = (product: CartItem['product'], size: string) => {
    if (!product?.sizes) {
      return 0;
    }
    
    let sizesArray;
    
    if (Array.isArray(product.sizes)) {
      sizesArray = product.sizes;
    } else if (typeof product.sizes === 'string') {
      try {
        sizesArray = JSON.parse(product.sizes);
      } catch (error) {
        return 0;
      }
    } else {
      return 0;
    }
    
    const sizeData = sizesArray.find((s: { size: string; stock: string | number }) => s.size === size);
    return sizeData ? parseInt(String(sizeData.stock)) || 0 : 0;
  };

  // Update cart data whenever auth state changes
  useEffect(() => {
    // Only update cart data when auth is loaded
    if (!authLoading) {
      updateCartData();
    }
  }, [authLoading, isAuthenticated]);

  // Set up interval to refresh cart data more frequently to catch stock changes
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(updateCartData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <UserCartContext.Provider value={{ cartCount, cartData, updateCartData, updateCartItem, validateStockAvailability, isLoading }}>
      {children}
    </UserCartContext.Provider>
  );
}

export const useUserCart = () => useContext(UserCartContext);
