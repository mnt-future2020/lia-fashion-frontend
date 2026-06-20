"use client"

import { useState, useEffect, useContext } from "react"
import { Search, ShoppingCart, Minus, Plus, Trash2, Loader2, UserCircle, Clock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CheckoutModal from "@/components/POS/CheckoutModal"
import OrderCompleteModal from "@/components/POS/OrderCompleteModal"
import DeleteConfirmation from "@/components/DeleteConfirmation/Confirmation"
import axios from '../../lib/axios'  // Using custom axios instance
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CartContext } from "@/contexts/CartContext"

// Helper functions for localStorage - only use on client side
const saveToLocalStorage = (key, data) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      // console.error(`Error saving ${key} to localStorage:`, error);
    }
  }
};

const loadFromLocalStorage = (key, defaultValue) => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      // console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Add this helper function to parse sizes string
const parseSizes = (sizesString) => {
  if (!sizesString) return [];
  return sizesString.split(',').map(size => {
    const [name, stock] = size.trim().split('(');
    return {
      name: name.trim(),
      stock: parseInt(stock?.replace(')', '')) || 0,
      price: 0 // We'll use the base price for now
    };
  });
};

// Add a helper function to parse price
const parsePrice = (priceString) => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  // Remove ₹ symbol and commas, then parse to float
  return parseFloat(priceString.toString().replace(/[₹,]/g, '')) || 0;
};

// Add a helper function to get price for a specific size
const getSizePrice = (product, selectedSize) => {
  if (!selectedSize) return product.price;
  
  const size = product.sizes.find(s => s.name === selectedSize);
  return size?.price || product.price;
};

// Update the getSizeIcon function
const getSizeIcon = (size) => {
  // Normalize the size string by trimming and converting to lowercase
  const normalizedSize = size.toString().trim().toLowerCase();
  
  // Check for various forms of "free" size
  if (normalizedSize === 'free' || normalizedSize === 'free-size' || normalizedSize === 'freesize') {
    return '∞';
  }
  return size;
};

export default function POS() {
// Initialize with default empty values first to prevent hydration errors
const [products, setProducts] = useState([])
const [categories, setCategories] = useState([])
const [subcategories, setSubcategories] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [shouldRefreshProducts, setShouldRefreshProducts] = useState(false)
const { cart, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart } = useContext(CartContext)
const [selectedCategory, setSelectedCategory] = useState("all")
const [selectedSubCategory, setSelectedSubCategory] = useState("all")
const [searchQuery, setSearchQuery] = useState("")
const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
const [isOrderCompleteOpen, setIsOrderCompleteOpen] = useState(false)
const [paymentMethod, setPaymentMethod] = useState("Cash")
const [collectCustomerInfo, setCollectCustomerInfo] = useState(false)
const [customerInfo, setCustomerInfo] = useState({
  name: "",
  phone: "",
  email: "",
})
const [orderNumber, setOrderNumber] = useState("")
const [holdOrders, setHoldOrders] = useState([])
const [holdDialogOpen, setHoldDialogOpen] = useState(false)
const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
const [holdCustomerName, setHoldCustomerName] = useState("")
const [activeHoldOrderId, setActiveHoldOrderId] = useState(null)
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [deleteOrderId, setDeleteOrderId] = useState(null)
const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)
const [invoiceNumber, setInvoiceNumber] = useState("")
const [selectedSizes, setSelectedSizes] = useState({})
const [selectedColors, setSelectedColors] = useState({})
const [hideOutOfStock, setHideOutOfStock] = useState(false)

// Load data from localStorage only after initial render on client side
const [isClient, setIsClient] = useState(false)

// Add currentCartData state
const [currentCartData, setCurrentCartData] = useState(null);

// Add new state for stock management
const [stockModalOpen, setStockModalOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);
const [productModalOpen, setProductModalOpen] = useState(false);

// Add new state for stock alert
const [stockAlert, setStockAlert] = useState({
  isOpen: false,
  size: '',
  message: ''
});

useEffect(() => {
  setIsClient(true)
  
  // Now it's safe to load from localStorage
  setHoldOrders(loadFromLocalStorage('posHoldOrders', []))
  setCustomerInfo(loadFromLocalStorage('posCustomerInfo', {
    name: "",
    phone: "",
    email: "",
  }))
  setActiveHoldOrderId(loadFromLocalStorage('posActiveHoldOrderId', null))
}, []) // Only run once on mount

// Function to refresh products
const refreshProducts = async () => {
  try {
    setLoading(true)
    const response = await axios.get('/api/admin/products')

    // Transform the data to match our component's expected format
    const formattedProducts = response.data.map(product => {
      // Parse sizes and their prices
      const sizes = product.sizes ? product.sizes.split(',').map(sizeStr => {
        // Example size string: "S (10)"
        const [sizeName, stockStr] = sizeStr.trim().split('(');
        const stock = parseInt(stockStr?.replace(')', '')) || 0;
        
        // Find the price for this size from size_prices array
        const sizePrice = product.size_prices?.find(sp => sp.size === sizeName.trim())?.price || 0;
        
        return {
          name: sizeName.trim(),
          stock,
          price: sizePrice
        };
      }) : [];
      
      // Parse colors from the color string
      const colors = product.color ? product.color.split(',').map(colorStr => colorStr.trim()) : [];
      
      // Get base price from first size or product price
      const basePrice = sizes.length > 0 ? sizes[0].price : parsePrice(product.price);
      
      return {
        id: product.id,
        name: product.name,
        category: product.category || '',
        subCategory: product.subcategory || '',
        subcategoryId: product.subcategory_id?.toString() || null,
        sku_code: product.sku_code || '',
        price: basePrice,
        taxPercentage: product.tax_percentage || 0,
        stock: product.stock || 0,
        image: product.image || "/placeholder.svg",
        sizes: sizes,
        colors: colors
      }
    })
    
    setProducts(formattedProducts)
    setError(null)
  } catch (error) {
    // console.error("Failed to fetch products:", error)
    setError("Failed to load products. Please try again later.")
  } finally {
    setLoading(false)
  }
}

// Load products from API
useEffect(() => {
  refreshProducts()
}, [shouldRefreshProducts]) // Add shouldRefreshProducts as dependency

// Fetch categories
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/admin/categories')
      setCategories(response.data)
    } catch (error) {
      // console.error("Failed to fetch categories:", error)
    }
  }
  
  fetchCategories()
}, [])

// Fetch subcategories
useEffect(() => {
  const fetchSubcategories = async () => {
    try {
      const response = await axios.get('/api/admin/subcategories')
      setSubcategories(response.data)
    } catch (error) {
      // console.error("Failed to fetch subcategories:", error)
    }
  }
  
  fetchSubcategories()
}, [])

// Get filtered subcategories based on selected category
const filteredSubcategories = selectedCategory && selectedCategory !== "all"
  ? subcategories.filter(subcategory => subcategory.category_id === parseInt(selectedCategory))
  : [];

// Update filtered subcategories when category changes - removed filteredSubcategories from dependencies
useEffect(() => {
  if (selectedCategory !== "all") {
    // Log the filtered subcategories without creating a dependency cycle
    const currentFilteredSubcategories = subcategories.filter(
      subcategory => subcategory.category_id === parseInt(selectedCategory)
    );
  }
}, [selectedCategory, subcategories])

// Log when subcategory selection changes
useEffect(() => {
  if (selectedSubCategory !== "all") {
    // Find the selected subcategory object for debugging
    const subcategory = subcategories.find(s => s.id.toString() === selectedSubCategory);
  }
}, [selectedSubCategory, subcategories, products])

// Helper functions to get names by ID - moved above filteredProducts
const getCategoryNameById = (categoryId) => {
  if (categoryId === "all") return "all";
  const category = categories.find(cat => cat.id.toString() === categoryId);
  return category ? category.name : '';
};

const getSubcategoryNameById = (subcategoryId) => {
  if (subcategoryId === "all") return "all";
  const subcategory = subcategories.find(subcat => subcat.id.toString() === subcategoryId);
  return subcategory ? subcategory.name : '';
};

// Filter products by category and search query
const filteredProducts = products.filter((product) => {
  // For category, check if the selected category name matches product category
  const categoryName = selectedCategory === "all" 
    ? "all" 
    : categories.find(c => c.id.toString() === selectedCategory)?.name;
    
  const matchesCategory = categoryName === "all" || product.category === categoryName;
  
  // For subcategory, check if the selected subcategory ID matches product subcategory ID
  const matchesSubCategory = selectedSubCategory === "all" || 
                           product.subcategoryId === selectedSubCategory;
  
  // Enhanced search to include both product name and SKU code
  const searchLower = searchQuery.toLowerCase();
  const matchesSearch = product.name.toLowerCase().includes(searchLower) || 
                       (product.sku_code && product.sku_code.toLowerCase().includes(searchLower));
  
  // Add filter for out of stock products
  const matchesStock = !hideOutOfStock || product.stock > 0;
  
  return matchesCategory && matchesSubCategory && matchesSearch && matchesStock;
});

// Calculate subtotal
const { subtotal } = cartTotal;

// Calculate tax for individual product
const calculateProductTax = (price, taxPercentage, quantity) => {
  return (price * (taxPercentage / 100) * quantity);
}

// Calculate total tax from all products
const totalTax = cart.reduce((sum, item) => 
  sum + calculateProductTax(item.product.price, item.product.taxPercentage, item.quantity), 
  0
);

// Calculate total
const { total } = cartTotal;

// Add a function to fetch the next invoice number from the API
const fetchNextInvoiceNumber = async () => {
  try {
    // Use axios custom instance which has the proper baseURL configured
    const response = await axios.get('/api/admin/invoice-settings/generate-number');
    
    // Check if we have a valid invoice number in the response
    if (response.data && response.data.invoice_number) {
      return response.data.invoice_number;
    } else {
      throw new Error("Invoice number not found in API response");
    }
  } catch (error) {
    // console.error("Failed to fetch next invoice number:", error);
    
    // Fall back to a generated number if the API call fails
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `TEMP${year}${month}${day}-${random}`;
  }
};

// Handle checkout - update to fetch invoice number
const handleCheckout = async () => {
  try {
    // Show loading state
    setLoading(true);
    
    // Fetch invoice number
    // console.log("Starting checkout process - fetching invoice number");
    const newInvoiceNumber = await fetchNextInvoiceNumber();
    // console.log("Received invoice number for checkout:", newInvoiceNumber);
    
    // Validate invoice number
    if (!newInvoiceNumber) {
      // console.error("Failed to get any invoice number");
      alert("Failed to generate invoice number. Please try again.");
      setLoading(false);
      return;
    }
    
    // Check if we're using a temporary fallback number
    if (newInvoiceNumber.startsWith('TEMP')) {
      // console.warn("Using temporary invoice number due to API issue");
      
      // No need to show another warning - we've already shown one in fetchNextInvoiceNumber
    }
    
    // Set the invoice number in state
    setInvoiceNumber(newInvoiceNumber);
    // console.log("Invoice number set in state:", newInvoiceNumber);
    
    // Open checkout modal
    setIsCheckoutOpen(true);
    
  } catch (error) {
    // console.error("Error preparing checkout:", error);
    alert("There was an error preparing checkout: " + (error.message || "Unknown error"));
  } finally {
    setLoading(false);
  }
}

// Close modals
const closeCheckout = () => {
  // console.log("Closing checkout modal");
  try {
    // First remove the invoice number to avoid issues with subsequent checkouts
    setInvoiceNumber("");
    // Then close the modal
    setIsCheckoutOpen(false);
  } catch (error) {
    // console.error("Error closing checkout:", error);
    // Force close as a fallback
    setIsCheckoutOpen(false);
  }
}

// Add a function to fetch the next order number from the API
const fetchNextOrderNumber = async () => {
  try {
    const response = await axios.get('/api/admin/pos/next-order-number');
    return response.data.next_order_number;
  } catch (error) {
    // console.error("Failed to fetch next order number:", error);
    // Fallback to a client-generated number if API fails
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `LIA_${randomNum}`;
  }
};

// Update the handleCompletePurchase function
const handleCompletePurchase = async (discountedTotal, discountAmount) => {
  try {
    // console.log("Starting handleCompletePurchase with invoice:", invoiceNumber);
    
    // Use discounted total if provided, otherwise use original total
    const finalTotal = discountedTotal !== undefined ? discountedTotal : total;
    
    // Store current cart data and totals before any operations
    const cartData = {
      cart: [...cart],
      subtotal: subtotal,
      tax: totalTax,
      total: finalTotal,
      discountAmount: discountAmount || 0,
      customerInfo: { ...customerInfo },
      paymentMethod: paymentMethod
    };
    
    // Set the current cart data
    setCurrentCartData(cartData);
    
    // Check if we have an invoice number
    if (!invoiceNumber) {
      try {
        // console.log("No invoice number present, fetching one");
        const newInvoiceNumber = await fetchNextInvoiceNumber();
        if (!newInvoiceNumber) {
          // console.error("Failed to get invoice number");
          alert("Could not generate an invoice number. Please try again.");
          closeCheckout();
          return;
        }
        setInvoiceNumber(newInvoiceNumber);
        // console.log("Successfully fetched new invoice number:", newInvoiceNumber);
      } catch (error) {
        // console.error("Error fetching invoice number:", error);
        alert("Error generating invoice number: " + error.message);
        closeCheckout();
        return;
      }
    }
    
    // Fetch next order number from API
    const orderNum = await fetchNextOrderNumber();
    setOrderNumber(orderNum);
    // console.log("Fetched order number:", orderNum);
    
    // Reset the active hold order ID since it's being checked out
    setActiveHoldOrderId(null);
    
    // Prepare items data using stored cart data
    const orderItems = cartData.cart.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      tax_percentage: item.product.taxPercentage,
      size: item.selectedSize || null,
      color: item.selectedColor || null
    }));
    
    // Prepare order data using stored totals
    const orderData = {
      order_number: orderNum,
      customer_name: collectCustomerInfo ? cartData.customerInfo.name : null,
      customer_phone: collectCustomerInfo ? cartData.customerInfo.phone : null,
      customer_email: collectCustomerInfo ? cartData.customerInfo.email : null,
      payment_method: cartData.paymentMethod,
      total_amount: cartData.total,
      subtotal: cartData.subtotal,
      tax_amount: cartData.tax,
      discount_amount: cartData.discountAmount,
      items: orderItems, // Send as array, not as JSON string
      invoice_number: invoiceNumber
    };
    
    // console.log("Submitting order to API:", orderData);
    
    // Close the checkout modal first to prevent UI issues
    setIsCheckoutOpen(false);
    
    try {
      // Submit the order to the API
      const response = await axios.post('/api/admin/pos/orders', orderData);
      // console.log('Order submitted successfully:', response.data);
      
      // Set the invoice number from the response if it's different
      if (response.data.order && response.data.order.invoice_number && 
          response.data.order.invoice_number !== invoiceNumber) {
        setInvoiceNumber(response.data.order.invoice_number);
        // console.log("Updated invoice number from API:", response.data.order.invoice_number);
      }
      
      // Open the order complete modal with the stored data
      setIsOrderCompleteOpen(true);
      setOrderNumber(orderNum);
      setInvoiceNumber(response.data.order.invoice_number || invoiceNumber);

      // Clear cart and reset states
      clearCart();
      setCustomerInfo({
        name: "",
        phone: "",
        email: "",
      });
      setPaymentMethod("Cash");
      setCollectCustomerInfo(false);
      clearPosDataFromLocalStorage();

      // Refresh products after a short delay to ensure modal data is displayed
      setTimeout(() => {
        setShouldRefreshProducts(prev => !prev);
      }, 1000);

    } catch (error) {
      // console.error('Failed to submit order to API:', error);
      const errorMessage = error.response?.data?.message || error.message;
      alert("Failed to submit order: " + errorMessage);
      // Show specific error details if available
      if (error.response?.data?.errors) {
        // console.error('Validation errors:', error.response.data.errors);
      }
      return;
    }
  } catch (err) {
    // console.error("Error during checkout process:", err);
    alert("There was an error processing your order. Please try again.");
    setIsCheckoutOpen(false);
  }
};

// Clear all POS data from localStorage
const clearPosDataFromLocalStorage = () => {
  localStorage.removeItem('posCurrentCart');
  localStorage.removeItem('posActiveHoldOrderId');
  localStorage.removeItem('posCustomerInfo');
  // We don't remove posHoldOrders or posLastOrderNumber as those should persist
  
  // console.log("Cleared POS data from localStorage");
};

// Close order complete modal with improved localStorage handling
const closeOrderComplete = () => {
  setIsOrderCompleteOpen(false);
  setCurrentCartData(null);
  
  // First, clear localStorage to prevent any race conditions
  clearPosDataFromLocalStorage();
  
  // Then update state
  resetCart();
  setInvoiceNumber(""); // Clear the invoice number
  setActiveHoldOrderId(null);
  setCustomerInfo({
    name: "",
    phone: "",
    email: "",
  });
  
  // console.log("Order completed and cart cleared");
};

// Add this function with your other functions
const resetFilters = () => {
  setSelectedCategory("all");
  setSelectedSubCategory("all");
  setSearchQuery("");
  setHideOutOfStock(false);
};

// Adding a new function to cancel the current order
const cancelCurrentOrder = () => {
  // If this was a held order that we're canceling, put it back in held orders
  if (activeHoldOrderId && cart.length > 0) {
    const timestamp = new Date().toLocaleTimeString()
    const holdOrder = {
      id: activeHoldOrderId,
      customerName: customerInfo.name || "Customer",
      timestamp: timestamp,
      date: new Date().toLocaleDateString(),
      cart: [...cart],
      total: total,
      subtotal: subtotal,
      tax: totalTax
    }
    
    setHoldOrders([...holdOrders, holdOrder])
  }
  
  // Clear the cart and active hold order ID
  resetCart();
  // Explicitly remove cart from localStorage
  if (isClient) {
    localStorage.removeItem('posCurrentCart');
  }
}

// Add a function to clear all held orders
const clearAllHeldOrders = () => {
  if (holdOrders.length === 0) return;
  
  // Open the confirmation dialog
  setClearAllDialogOpen(true);
  // Close the resume dialog to prevent overlapping modals
  setResumeDialogOpen(false);
};

// Function to confirm clearing all held orders
const confirmClearAllHeldOrders = () => {
  setHoldOrders([]);
  setClearAllDialogOpen(false);
};

// Add a function to remove a specific hold order
const removeHoldOrder = (orderId, e) => {
  // Stop event propagation to prevent resuming the order when clicking delete
  e.stopPropagation();
  
  // Set the order ID to delete and open confirmation
  setDeleteOrderId(orderId);
  setDeleteConfirmOpen(true);
  // Close the resume dialog to prevent overlapping modals
  setResumeDialogOpen(false);
};

// Function to handle actual deletion after confirmation
const confirmDeleteHoldOrder = () => {
  if (deleteOrderId) {
    const updatedHoldOrders = holdOrders.filter(order => order.id !== deleteOrderId);
    setHoldOrders(updatedHoldOrders);
    setDeleteOrderId(null);
    setDeleteConfirmOpen(false);
  }
};

// Handle Enter key press for customer name input
const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    saveHoldOrder();
  }
};

// Add back the useEffect hooks for localStorage
useEffect(() => {
  if (!isClient) return;
  
  if (cart.length > 0) {
    saveToLocalStorage('posCurrentCart', cart);
  } else {
    // Clear from localStorage when cart is empty
    localStorage.removeItem('posCurrentCart');
  }
}, [cart, isClient]);

// Add effect to save held orders to localStorage - only after client is ready
useEffect(() => {
  if (isClient) {
    saveToLocalStorage('posHoldOrders', holdOrders);
  }
}, [holdOrders, isClient]);

// Add effect to save customer info to localStorage - only after client is ready
useEffect(() => {
  if (isClient) {
    saveToLocalStorage('posCustomerInfo', customerInfo);
  }
}, [customerInfo, isClient]);

// Add effect to save active hold order ID to localStorage - only after client is ready
useEffect(() => {
  if (!isClient) return;
  
  if (activeHoldOrderId) {
    saveToLocalStorage('posActiveHoldOrderId', activeHoldOrderId);
  } else {
    localStorage.removeItem('posActiveHoldOrderId');
  }
}, [activeHoldOrderId, isClient]);

// Add a function to hold the current order
const handleHoldOrder = () => {
  if (cart.length === 0) return;
  
  // Clear the hold customer name when opening the dialog
  setHoldCustomerName("");
  // Open the hold order dialog
  setHoldDialogOpen(true);
};

// Function to save a hold order
const saveHoldOrder = () => {
  if (cart.length === 0) return;
  
  // Generate a unique ID for the hold order
  const holdOrderId = Date.now().toString();
  
  // Create a timestamp for when the order was held
  const timestamp = new Date().toLocaleTimeString();
  
  // Create a hold order object
  const holdOrder = {
    id: holdOrderId,
    customerName: holdCustomerName || "Customer",
    timestamp: timestamp,
    date: new Date().toLocaleDateString(),
    cart: [...cart],
    total: total,
    subtotal: subtotal,
    tax: totalTax
  };
  
  // Add the hold order to the list of hold orders
  setHoldOrders(prevHoldOrders => [...prevHoldOrders, holdOrder]);
  
  // Close the hold order dialog
  setHoldDialogOpen(false);
  
  // Clear the cart
  resetCart();
}

// Function to resume a hold order
const resumeOrder = (order) => {
  // Check if there's anything in the current cart
  if (cart.length > 0) {
    // Confirm before replacing current cart
    if (!window.confirm("This will replace your current cart. Continue?")) {
      return;
    }
    
    // Clear the current cart first
    resetCart();
  }
  
  try {
    // Validate order structure
    if (!order || !Array.isArray(order.cart)) {
      // console.error("Invalid order structure:", order);
      alert("Error: Invalid order structure");
      return;
    }

    // Set the cart to the held order's cart
    order.cart.forEach(item => {
      // Validate item structure
      if (!item || !item.product || typeof item.product.id === 'undefined') {
        // console.error("Invalid cart item structure:", item);
        return;
      }

      // Create a properly structured cart item
      const cartItem = {
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image || "/placeholder.svg",
          price: item.product.price || 0,
          taxPercentage: item.product.taxPercentage || 0,
          selectedSize: item.selectedSize,
          sizeStock: item.product.sizeStock || item.product.stock || 0
        },
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize
      };

      // Safely add to cart with error handling
      try {
        addToCart(cartItem);
      } catch (error) {
        // console.error("Error adding item to cart:", error);
      }
    });
    
    // Set the active hold order ID to track which order is being resumed
    setActiveHoldOrderId(order.id);
    
    // Set customer info
    setCustomerInfo({
      name: order.customerName !== "Customer" ? order.customerName : "",
      phone: "",
      email: ""
    });
    
    // Remove this order from the hold orders list
    const updatedHoldOrders = holdOrders.filter(holdOrder => holdOrder.id !== order.id);
    setHoldOrders(updatedHoldOrders);
    
    // Close the resume dialog
    setResumeDialogOpen(false);
  } catch (error) {
    // console.error("Error resuming order:", error);
    alert("There was an error resuming the order. Please try again.");
  }
};

// Clear cart and reset
const resetCart = () => {
  clearCart(); // Call the context clearCart
  setActiveHoldOrderId(null);
  
  // Clear the customer info when clearing the cart
  setCustomerInfo({
    name: "",
    phone: "",
    email: "",
  });
};

// Update the handleAddToCart function
const handleAddToCart = (product, selectedSize, selectedColor = null) => {
  // Find the selected size's stock and price first
  const size = product.sizes.find(s => s.name === selectedSize);
  const sizeStock = size?.stock || 0;
  const sizePrice = size?.price || product.price;

  // Check size-specific stock instead of general product stock
  if (sizeStock <= 0) {
    setStockAlert({
      isOpen: true,
      size: selectedSize,
      message: `Size ${selectedSize} is out of stock`
    });
    return;
  }

  const existingItem = cart.find(item => 
    item.product.id === product.id && 
    item.selectedSize === selectedSize && 
    item.selectedColor === selectedColor
  );

  if (existingItem) {
    // Check if adding one more would exceed size-specific stock
    if (existingItem.quantity >= sizeStock) {
      setStockAlert({
        isOpen: true,
        size: selectedSize,
        availableStock: sizeStock,
        message: `Only ${sizeStock} items available in size ${selectedSize}`
      });
      return;
    }
    handleUpdateQuantity(product.id, existingItem.quantity + 1, selectedSize, selectedColor);
  } else {
    // For new items, add with quantity 1 and selected size/color
    const cartItem = {
      product: {
        id: product.id,
        name: product.name,
        image: product.image || "/placeholder.svg",
        price: sizePrice,
        taxPercentage: product.taxPercentage || 0,
        selectedSize: selectedSize,
        sizeStock: sizeStock
      },
      quantity: 1,
      selectedSize: selectedSize,
      selectedColor: selectedColor
    };
    
    addToCart(cartItem);
  }
};

// Update the handleUpdateQuantity function
const handleUpdateQuantity = (productId, newQuantity, selectedSize, selectedColor = null) => {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  // Find the size-specific stock
  const size = product.sizes.find(s => s.name === selectedSize);
  const sizeStock = size?.stock || 0;

  // Ensure quantity doesn't exceed available size-specific stock
  if (newQuantity > sizeStock) {
    setStockAlert({
      isOpen: true,
      size: selectedSize,
      message: `Only ${sizeStock} items available in size ${selectedSize}`
    });
    return;
  }

  // Ensure quantity is at least 1
  if (newQuantity < 1) {
    return;
  }

  updateQuantity(productId, newQuantity, selectedSize, selectedColor);
};

// Add function to handle product click
const handleProductClick = (product) => {
  setSelectedProduct(product);
  setProductModalOpen(true);
};

// Add function to close product modal
const closeProductModal = () => {
  setProductModalOpen(false);
  setSelectedProduct(null);
};

// Add this new function near your other state management functions
const handleSizeSelection = (productId, sizeName) => {
  // Clear all previous selections for this product
  setSelectedSizes(prev => ({
    ...prev,
    [productId]: sizeName
  }));
  // Clear color selection when size changes
  setSelectedColors(prev => ({
    ...prev,
    [productId]: undefined
  }));
};

// Add function to handle color selection
const handleColorSelection = (productId, colorName) => {
  setSelectedColors(prev => ({
    ...prev,
    [productId]: colorName
  }));
};

return (
  <div className="min-h-screen bg-white">
    <header className="bg-white p-4 shadow-sm flex justify-between items-center">
      <h1 className="text-2xl font-bold">POS System</h1>

      {/* Hold Orders Button & Counter */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => setResumeDialogOpen(true)} 
          className="bg-pink-600 hover:bg-pink-600 text-white"
          disabled={holdOrders.length === 0}
        >
          <Clock className="mr-2 h-4 w-4" />
          Held Orders ({holdOrders.length})
        </Button>
        <Button 
          onClick={handleHoldOrder} 
          className="bg-green-600 hover:bg-green-600 text-white"
          disabled={cart.length === 0}
        >
          <UserCircle className="mr-2 h-4 w-4" />
          Hold Order
        </Button>
      </div>
    </header>

    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Products Section */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 bg-slate-50 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by product name or SKU code..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategory Select */}
          <Select 
            value={selectedSubCategory} 
            onValueChange={setSelectedSubCategory}
            disabled={!selectedCategory || selectedCategory === "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {filteredSubcategories.map(subcategory => (
                <SelectItem key={subcategory.id} value={subcategory.id.toString()}>
                  {subcategory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add a reset button next to the filters */}
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="whitespace-nowrap"
          >
            Reset Filters
          </Button>
          <Button 
            variant={hideOutOfStock ? "default" : "outline"}
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className="whitespace-nowrap bg-[#eb1c75] text-white hover:bg-pink-600 hover:text-white"
          >
            {hideOutOfStock ? "Show All Products" : "Hide Out of Stock"}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <div className="text-xl ml-2">Loading products...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            <div className="text-xl">{error}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl">No products found. Try adjusting your filters.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              const selectedSize = selectedSizes[product.id];
              const currentPrice = getSizePrice(product, selectedSize);

              return (
                <Card
                  key={product.id}
                  className={`overflow-hidden ${product.stock > 0 ? 'hover:shadow-md' : 'opacity-70 cursor-not-allowed'} transition-shadow relative`}
                >
                  <div className="relative">
                    {product.stock === 0 && (
                      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                        <div className="absolute top-[20px] right-[-35px] bg-red-500 text-white py-1 px-10 transform rotate-45 shadow">
                          Out of Stock
                        </div>
                      </div>
                    )}
                    <div className="h-32 bg-gray-100 flex items-center justify-center">
                      <img src={product.image || "/placeholder.svg"} alt={product.name} className="h-full object-cover" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{product.category}</span>
                      <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                    </div>
                    {product.sku_code && (
                      <div className="mt-1 bg-gray-50 rounded px-2 py-1">
                        <span className="text-xs font-medium text-gray-600">SKU: </span>
                        <span className="text-xs font-semibold text-[#eb1c75]">{product.sku_code}</span>
                      </div>
                    )}                    {/* Size Selection Section */}
                    <div className="mt-2 border-t pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Size:</span>
                        {selectedSize && (
                          <span className="text-xs text-gray-500">
                            Stock: {product.sizes.find(s => s.name === selectedSize)?.stock || 0}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {product.sizes?.map((size) => (
                          <button
                            key={size.name}
                            onClick={() => {
                              handleSizeSelection(product.id, size.name);
                            }}
                            disabled={size.stock <= 0}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
                              ${selectedSizes[product.id] === size.name 
                                ? 'bg-[#eb1c75] text-white ring-1 ring-[#eb1c75] ring-offset-1' 
                                : size.stock <= 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            title={`${size.name} (${size.stock} available)`}
                          >
                            {getSizeIcon(size.name)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selection */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">Color:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                handleColorSelection(product.id, color);
                              }}
                              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
                                ${selectedColors[product.id] === color 
                                  ? 'bg-[#eb1c75] text-white ring-1 ring-[#eb1c75] ring-offset-1' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              title={color}
                            >
                                                          <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            ></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Display */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {selectedSize ? `Size ${selectedSize}` : 'Select size'}
                      </div>
                      <span className="text-sm font-semibold text-[#eb1c75]">
                        ₹{currentPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <Button
                      className="w-full mt-2 bg-[#eb1c75] hover:bg-[#d81b60] text-white text-sm py-1 h-8"
                      disabled={
                        product.stock <= 0 || 
                        !selectedSizes[product.id] || 
                        (product.colors && product.colors.length > 0 && !selectedColors[product.id])
                      }
                      onClick={() => handleAddToCart(product, selectedSizes[product.id], selectedColors[product.id])}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-[400px] bg-white border-l">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="flex items-center">
            <ShoppingCart className="mr-2" size={20} />
            <h2 className="text-lg font-medium">Customer Cart</h2>
            </div>
            <div className="flex items-center">
            <div className="ml-2 bg-pink-500 text-white px-2 py-1 rounded-xl text-base">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </div>
          </div>
          {cart.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-500"
                onClick={cancelCurrentOrder}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-auto h-[calc(100vh-350px)]">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Cart is empty. Add products to get started.</div>
          ) : (
            <div className="divide-y">
              {cart.map((item) => {
                const itemPrice = item.product.price || 0;
                const itemTax = item.product.taxPercentage || 0;
                
                return (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor || 'no-color'}`} className="p-4 flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded mr-3">
                      <img
                        src={item.product.image || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <div className="text-sm text-gray-500">
                        <p>Size: {item.selectedSize}</p>
                        {item.selectedColor && (
                          <div className="flex items-center gap-2">
                            <span>Color:</span>
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.selectedColor }}
                              title={item.selectedColor}
                            ></div>
                          </div>
                        )}
                        <p>Price: ₹{itemPrice.toFixed(2)}</p>
                        <p>Tax: ₹{(itemPrice * (itemTax / 100) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity > 1) {
                            handleUpdateQuantity(item.product.id, item.quantity - 1, item.selectedSize, item.selectedColor);
                          }
                        }}
                      >
                        <Minus size={16} />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`h-8 w-8 ${item.quantity >= (item.product.sizeStock || item.product.stock) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (item.quantity < (item.product.sizeStock || item.product.stock)) {
                            handleUpdateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor);
                          }
                        }}
                        disabled={item.quantity >= (item.product.sizeStock || item.product.stock)}
                      >
                        <Plus size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span>₹{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full text-white bg-[#eb1c75] hover:bg-[#d81b60]" size="lg" disabled={cart.length === 0} onClick={handleCheckout}>
            Checkout
          </Button>
        </div>
      </div>
    </div>

    {/* Checkout Modal */}
    {isCheckoutOpen && (
      <CheckoutModal
        cart={cart}
        subtotal={subtotal}
        tax={totalTax}
        total={total}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        collectCustomerInfo={collectCustomerInfo}
        setCollectCustomerInfo={setCollectCustomerInfo}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
        onCancel={closeCheckout}
        onComplete={handleCompletePurchase}
        onClose={closeCheckout}
        invoiceNumber={invoiceNumber}
      />
    )}

    {/* Order Complete Modal */}
    {isOrderCompleteOpen && (
      <OrderCompleteModal
        orderNumber={orderNumber}
        invoiceNumber={invoiceNumber}
        cart={currentCartData?.cart || []}
        subtotal={currentCartData?.subtotal || 0}
        tax={currentCartData?.tax || 0}
        total={currentCartData?.total || 0}
        paymentMethod={currentCartData?.paymentMethod || "Cash"}
        customerInfo={currentCartData?.customerInfo || {}}
        onClose={closeOrderComplete}
      />
    )}

    {/* Add the Hold Order Dialog */}
    <Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hold Order</DialogTitle>
          <DialogDescription>
            Enter a customer name to identify this order later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="holdCustomerName" className="text-right">
              Customer Name
            </Label>
            <Input
              id="holdCustomerName"
              value={holdCustomerName}
              onChange={(e) => setHoldCustomerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter customer name"
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setHoldDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveHoldOrder} className="bg-[#eb1c75] hover:bg-[#d81b60] text-white">
            Hold Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Resume Held Orders Dialog */}
    <Dialog open={resumeDialogOpen} onOpenChange={setResumeDialogOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Resume Held Orders</DialogTitle>
          <DialogDescription>
            Select a held order to resume.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-auto">
          {holdOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No held orders available</p>
          ) : (
            <>
              <div className="flex justify-end mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-500 border-red-500"
                  onClick={clearAllHeldOrders}
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-3 py-2">
                {holdOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-md p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                    onClick={() => resumeOrder(order)}
                  >
                    <div>
                      <h3 className="font-medium">{order.customerName}</h3>
                      <p className="text-sm text-gray-500">Held at: {order.timestamp}</p>
                      <p className="text-sm text-gray-500">{order.cart.length} items, Total: ₹{order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1 text-green-600"
                      >
                        <Play size={16} /> Resume
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={(e) => removeHoldOrder(order.id, e)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <DeleteConfirmation
      isOpen={deleteConfirmOpen}
      onClose={() => setDeleteConfirmOpen(false)}
      onDelete={confirmDeleteHoldOrder}
      title="Delete Held Order"
      description="Are you sure you want to delete this held order? This action cannot be undone."
    />
    
    {/* Clear All Confirmation Dialog */}
    <DeleteConfirmation
      isOpen={clearAllDialogOpen}
      onClose={() => setClearAllDialogOpen(false)}
      onDelete={confirmClearAllHeldOrders}
      title="Clear All Held Orders"
      description="Are you sure you want to clear all held orders? This action cannot be undone."
    />

    {/* Add Product Modal */}
    <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Size</DialogTitle>
          <DialogDescription>
            Choose a size for {selectedProduct?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {selectedProduct?.sizes?.map((size) => (
            <div key={size.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSizes(prev => ({
                      ...prev,
                      [selectedProduct.id]: prev[selectedProduct.id] === size.name ? null : size.name
                    }));
                  }}
                  disabled={size.stock <= 0}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${selectedSizes[selectedProduct.id] === size.name 
                      ? 'bg-[#eb1c75] text-white ring-2 ring-[#eb1c75] ring-offset-2' 
                      : size.stock <= 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                >
                  {getSizeIcon(size.name)}
                </button>
                <div>
                  <p className="font-medium">Size {size.name}</p>
                  <p className="text-sm text-gray-500">Stock: {size.stock}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#eb1c75]">₹{size.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeProductModal}>
            Cancel
          </Button>
          <Button 
            className="bg-[#eb1c75] hover:bg-[#d81b60] text-white"
            onClick={() => {
              if (selectedSizes[selectedProduct.id]) {
                handleAddToCart(selectedProduct, selectedSizes[selectedProduct.id], selectedColors[selectedProduct.id]);
                closeProductModal();
              }
            }}
            disabled={!selectedSizes[selectedProduct?.id]}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Add the stock alert dialog */}
    <DeleteConfirmation 
      isOpen={stockAlert.isOpen}
      onClose={() => setStockAlert({ isOpen: false, size: '', message: '' })}
      onDelete={() => setStockAlert({ isOpen: false, size: '', message: '' })}
      title="Stock Alert"
      description={stockAlert.message}
      confirmButtonText="OK"
      hideCancel={true} // Add this prop
    />
  </div>
)
}