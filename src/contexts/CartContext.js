"use client";

import { createContext, useState, useContext, useEffect } from "react";

// Create context
export const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage if available
  const [cart, setCart] = useState([]);
  const [cartTotal, setCartTotal] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('liaCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        // console.error("Error parsing saved cart:", error);
        localStorage.removeItem('liaCart');
      }
    }
  }, []);

  // Update localStorage whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('liaCart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('liaCart');
    }
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price.replace(/[₹,]/g, '')) 
        : (item.product.price || 0);
      return sum + (price * item.quantity);
    }, 0);
    
    const tax = cart.reduce((sum, item) => {
      const price = typeof item.product.price === 'string' 
        ? parseFloat(item.product.price.replace(/[₹,]/g, '')) 
        : (item.product.price || 0);
      const itemTax = (price * item.quantity) * 
        ((item.product.taxPercentage || 0) / 100);
      return sum + itemTax;
    }, 0);
    
    setCartTotal({
      subtotal,
      tax,
      total: subtotal + tax
    });
  }, [cart]);

  // Add item to cart
  const addToCart = (cartItem) => {
    setCart(prevCart => {
      // Validate cartItem structure
      if (!cartItem || !cartItem.product || typeof cartItem.product.id === 'undefined') {
        // console.error("Invalid cart item structure:", cartItem);
        return prevCart;
      }

      // Check if item already exists in cart with same size and color
      const existingItemIndex = prevCart.findIndex(
        item => item.product && 
               item.product.id === cartItem.product.id && 
               item.selectedSize === cartItem.selectedSize &&
               item.selectedColor === cartItem.selectedColor
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += cartItem.quantity || 1;
        return updatedCart;
      } else {
        // Add new item with default quantity if not specified
        const newItem = {
          ...cartItem,
          quantity: cartItem.quantity || 1
        };
        return [...prevCart, newItem];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (productId, quantity, selectedSize, selectedColor = null) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId, selectedSize, selectedColor = null) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.product.id === productId && 
          item.selectedSize === selectedSize && 
          item.selectedColor === selectedColor)
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('liaCart');
    // Reset cart totals when clearing the cart
    setCartTotal({
      subtotal: 0,
      tax: 0,
      total: 0
    });
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartTotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 