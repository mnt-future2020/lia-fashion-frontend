"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { optimizeCloudinary } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import { ChevronDown, Wallet } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { paymentService } from "@/services/paymentService"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserCart } from "@/contexts/UserCartContext"
import { useUserAuth } from "@/contexts/UserAuthContext"
import axios from "../../../lib/axios"
import { calculateCartSummary } from "@/utils/cartSummary";

const colorMap = {
  'blue': '#0066FF',
  'red': '#FF0000',
  'green': '#00FF00',
  'black': '#000000',
  'white': '#FFFFFF',
  'pink': '#FF69B4',
  'purple': '#800080',
  'yellow': '#FFD700',
  'orange': '#FFA500',
  'brown': '#8B4513'
};

// Shipping Controller Class
class ShippingController {
  constructor() {
    this.weightRules = [];
    this.locationRules = [];
    this.initialized = false;
  }

  async initialize() {
    try {
      // Attempt to fetch rules silently without logging on first try
      const [weightResponse, locationResponse] = await Promise.allSettled([
        axios.get('/api/admin/shipping-rules?type=weight'),
        axios.get('/api/admin/shipping-rules?type=location')
      ]);

      // Handle weight rules response
      if (weightResponse.status === 'fulfilled' && weightResponse.value?.data?.status === 'success') {
        const weightData = weightResponse.value.data.data;
        const weightRules = Array.isArray(weightData?.data) ? weightData.data :
                           Array.isArray(weightData) ? weightData : [];
        
        this.weightRules = weightRules.length ? weightRules : this.getDefaultWeightRules();
      } else {
        this.weightRules = this.getDefaultWeightRules();
      }

      // Handle location rules response
      if (locationResponse.status === 'fulfilled' && locationResponse.value?.data?.status === 'success') {
        const locationData = locationResponse.value.data.data;
        const locationRules = Array.isArray(locationData?.data) ? locationData.data :
                             Array.isArray(locationData) ? locationData : [];
        
        this.locationRules = locationRules.length ? locationRules : this.getDefaultLocationRules();
      } else {
        this.locationRules = this.getDefaultLocationRules();
      }

      this.initialized = true;
    } catch (error) {
      // console.error('Shipping rules fetch failed, using defaults:', error);
      this.weightRules = this.getDefaultWeightRules();
      this.locationRules = this.getDefaultLocationRules();
      this.initialized = true;
    }
  }
  getDefaultWeightRules() {
    return [];  // Return empty array instead of default rule
  }

  getDefaultLocationRules() {
    return [];  // Return empty array instead of default rule
  }

  // Calculate total weight with unit conversion
  calculateCartWeight(cartItems) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return 0;
    }

    const totalWeight = cartItems.reduce((total, item) => {
      let itemWeight = 0;
      let weightUnit = 'kg';

      if (item.product?.weight && item.product?.weight_unit) {
        itemWeight = parseFloat(item.product.weight) || 0;
        weightUnit = item.product.weight_unit.toLowerCase();
      }

      // Convert grams to kg if needed
      if (weightUnit === 'g' || weightUnit === 'gram' || weightUnit === 'grams') {
        itemWeight = itemWeight / 1000;
      }

      const itemTotalWeight = itemWeight * item.quantity;

      return total + itemTotalWeight;
    }, 0);

    return parseFloat(totalWeight.toFixed(2));
  }

  // Find matching weight rule for given weight
  findWeightRule(totalWeight) {
    if (!Array.isArray(this.weightRules) || this.weightRules.length === 0) {
      // console.warn('Weight rules not available, using defaults');
      this.weightRules = this.getDefaultWeightRules();
    }

    const weightKg = parseFloat(totalWeight);

    const matchingRule = this.weightRules.find(rule => {
      const fromWeight = parseFloat(rule.from_weight);
      const toWeight = parseFloat(rule.to_weight);
      const matches = weightKg >= fromWeight && weightKg <= toWeight;

      return matches;
    });

    return matchingRule;
  }

  // Find matching location rule for given state
  findLocationRule(state) {
    if (!Array.isArray(this.locationRules) || this.locationRules.length === 0) {
      // console.warn('Location rules not available, using defaults');
      this.locationRules = this.getDefaultLocationRules();
    }

    if (!state) {
      // console.warn('No state provided for location rule matching');
      return null;
    }

    // Check for exact match first
    let rule = this.locationRules.find(rule =>
      rule.location &&
      rule.location.toLowerCase() === state.toLowerCase()
    );

    // If no exact match and not a special state, use "Other States" rule
    if (!rule && !this.isSpecialState(state)) {
      rule = this.locationRules.find(rule =>
        rule.location &&
        rule.location.toLowerCase() === 'other states'
      );
    }

    return rule;
  }

  // Check if state is special (Tamil Nadu, Puducherry)
  isSpecialState(state) {
    const specialStates = ['tamil nadu', 'puducherry'];
    return specialStates.some(specialState =>
      state.includes(specialState) || specialState.includes(state)
    );
  }

  // Calculate shipping charge based on weight and location
  calculateShippingCharge(cartItems, state, orderSubtotal = 0) {
    try {
      if (!this.initialized) {
        // console.warn('Shipping controller not initialized, initializing with defaults');
        this.weightRules = this.getDefaultWeightRules();
        this.locationRules = this.getDefaultLocationRules();
        this.initialized = true;
      }

      // Check if we have cart items and state
      if (!Array.isArray(cartItems) || cartItems.length === 0 || !state) {
        // console.warn('No cart items or state provided');
        return {
          charge: 0,
          type: 'no_items_or_state',
          rule: null,
          freeShipping: false,
          totalWeight: 0
        };
      }

      const totalWeight = this.calculateCartWeight(cartItems);
      let totalShippingCharge = 0;
      let weightCharge = 0;
      let locationCharge = 0;
      let appliedRules = [];
      let freeShipping = false;

      // Calculate weight-based charge (only if weight rules exist)
      if (Array.isArray(this.weightRules) && this.weightRules.length > 0) {
        const weightRule = this.findWeightRule(totalWeight);
        if (weightRule) {
          weightCharge = parseFloat(weightRule.price) || 0;
          const freeShippingAmount = parseFloat(weightRule.free_shipping_amount) || 0;
          freeShipping = freeShippingAmount > 0 && orderSubtotal >= freeShippingAmount;

          if (freeShipping) {
            weightCharge = 0; // Free shipping applies to weight portion
          }

          appliedRules.push({
            type: 'weight',
            rule: weightRule,
            charge: weightCharge,
            originalCharge: parseFloat(weightRule.price) || 0,
            freeShipping: freeShipping
          });
        }
      }

      // Calculate location-based charge (only if location rules exist)
      if (Array.isArray(this.locationRules) && this.locationRules.length > 0) {
        const locationRule = this.findLocationRule(state);
        if (locationRule) {
          locationCharge = parseFloat(locationRule.shipping_charge) || 0;

          appliedRules.push({
            type: 'location',
            rule: locationRule,
            charge: locationCharge
          });
        }
      }

      // Calculate total shipping charge
      totalShippingCharge = weightCharge + locationCharge;

      // Return combined result if we have any rules applied
      if (appliedRules.length > 0) {
        return {
          charge: totalShippingCharge,
          type: 'combined',
          rule: {
            weightRule: appliedRules.find(r => r.type === 'weight')?.rule || null,
            locationRule: appliedRules.find(r => r.type === 'location')?.rule || null,
            appliedRules: appliedRules
          },
          freeShipping: freeShipping,
          totalWeight,
          breakdown: {
            weightCharge,
            locationCharge,
            freeShipping
          }
        };
      }

      // If no rules found, return default fallback
      // console.warn('No shipping rules found, using default fallback');
      return {
        charge: 0, // Default fallback charge
        type: 'fallback',
        rule: {
          location: 'Default',
          shipping_charge: 0,
          estimated_days: '3-5 days'
        },
        freeShipping: false,
        totalWeight
      };

    } catch (error) {
      // console.error('Error calculating shipping charge:', error);
      return {
        charge: 0, // Default fallback charge
        type: 'error',
        rule: {
          location: 'Default',
          shipping_charge: 0,
          estimated_days: '3-5 days'
        },
        freeShipping: false,
        totalWeight: this.calculateCartWeight(cartItems || [])
      };
    }
  }

  // Get shipping details for display
  getShippingDetails(result) {
    if (!result || !result.rule) {
      return { message: 'No shipping rule applied', details: [] };
    }

    const details = [];

    if (result.type === 'location') {
      details.push(`Location: ${result.rule.location}`);
      if (result.rule.estimated_days) {
        details.push(`Delivery: ${result.rule.estimated_days}`);
      }
    } else if (result.type === 'weight') {
      details.push(`Weight range: ${result.rule.from_weight}kg - ${result.rule.to_weight}kg`);
      if (result.freeShipping) {
        details.push(`Free shipping applied (order ≥ ₹${result.rule.free_shipping_amount})`);
      }
    }

    return {
      message: result.freeShipping ? 'Free Shipping!' : `Shipping: ₹${result.charge}`,
      details
    };
  }
}

const CheckoutPage = () => {  const { cartData, isLoading, updateCartData, validateStockAvailability } = useUserCart();
  const { user, isAuthenticated } = useUserAuth();
  const router = useRouter();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Section visibility state
  const [sectionsOpen, setSectionsOpen] = useState({
    contact: true,
    shipping: true,
    payment: true,
    summary: false
  });

  // Toggle section visibility
  const toggleSection = useCallback((section) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Form state
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    mobile: "",
    email: "",
  })

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pincode: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("online")

  // Coupon state
  const [couponState, setCouponState] = useState({
    code: "",
    isApplying: false,
    appliedCoupon: null,
    discount: 0,
    error: ""
  })

  // Shipping state
  const [shippingController] = useState(() => new ShippingController())
  const [shippingControllerReady, setShippingControllerReady] = useState(false)
  const [shippingResult, setShippingResult] = useState({
    charge: 0,
    type: 'default',
    rule: null,
    freeShipping: false,
    totalWeight: 0  })

  // Payment state
  const [paymentDetails, setPaymentDetails] = useState({
    orderId: null,
    processing: false
  });

  // Track initial load to prevent skeleton flashing
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Auto-fill user data when authenticated and user data is available
  useEffect(() => {
    const fetchAndFillUserData = async () => {
      if (isAuthenticated && user) {
        try {
          // Fetch full user profile to get address details
          const response = await axios.get('/api/user/profile');
          const userData = response.data;
          const userDetails = userData.details || {};

          // Auto-fill contact information
          setContactInfo({
            fullName: userData.name || "",
            mobile: userData.phone || "",
            email: userData.email || "",
          });

          // Auto-fill shipping address
          setShippingAddress({
            addressLine1: userDetails.address1 || "",
            city: userDetails.city || "",
            district: userDetails.district || "",
            state: userDetails.state || "",
            country: userDetails.country || "",
            pincode: userDetails.pincode || "",
          });
        } catch (error) {
          // console.error('Error fetching user profile for auto-fill:', error);
          // If profile fetch fails, use basic user data from context
          if (user) {
            setContactInfo({
              fullName: user.name || "",
              mobile: user.phone || "",
              email: user.email || "",
            });
          }
        }
      }
    };

    fetchAndFillUserData();
  }, [isAuthenticated, user]);

  // Track when cart data is first loaded
  useEffect(() => {
    if (cartData !== null && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [cartData, hasInitiallyLoaded]);

  // Calculate summary using shared logic (includes offers, bulk, GST)
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    // Try to restore offers from storage immediately to avoid flicker on refresh
    try {
      const saved = localStorage.getItem('activeOffers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOffers(parsed);
        }
      }
    } catch (_e) {}
  }, []);

  const calculateSummary = useCallback(() => {
    return calculateCartSummary(cartData, offers);
  }, [cartData, offers]);

  // Initialize shipping controller
  const initShipping = useCallback(async () => {
    try {
      await shippingController.initialize();
      setShippingControllerReady(true);

      // Force a shipping calculation update after initialization
      if (cartData?.items?.length > 0 && shippingAddress.state) {
        const summary = calculateSummary();
        const result = shippingController.calculateShippingCharge(
          cartData.items,
          shippingAddress.state,
          summary.subtotal
        );
        setShippingResult(result);
      }
    } catch (error) {      // ShippingController now handles errors internally with fallbacks
      // console.warn('Shipping initialization error:', error);
      setShippingControllerReady(true); // Still set as ready even with fallbacks
    }
  }, [cartData?.items, shippingAddress.state, calculateSummary, shippingController]);

  // Add Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []); // This effect doesn't need dependencies

  // Initialize shipping controller
  useEffect(() => {
    initShipping();
  }, [initShipping]); // Add initShipping as dependency

  // Update shipping when cart or state changes
  useEffect(() => {
    // Only calculate shipping if shipping controller is ready, we have cart data and state
    if (shippingControllerReady && hasInitiallyLoaded && cartData?.items?.length && shippingAddress.state) {
      const summary = calculateSummary();
      const result = shippingController.calculateShippingCharge(
        cartData.items,
        shippingAddress.state,
        summary.subtotal
      );
      setShippingResult(result);
    } else if (shippingControllerReady && hasInitiallyLoaded) {
      // Reset shipping when no items or state
      setShippingResult({
        charge: 0,
        type: 'no_items',
        rule: null,
        freeShipping: false,
        totalWeight: cartData?.items?.length ? shippingController.calculateCartWeight(cartData.items) : 0
      });
    }
  }, [
    cartData,
    shippingAddress.state,
    hasInitiallyLoaded,
    shippingControllerReady,
    calculateSummary,
    shippingController
  ]); // Add all dependencies

  // Fix handlePayment to be async
  const handlePayment = async (transactionId) => {
    try {
      setPaymentDetails(prev => ({ ...prev, processing: true, error: null }));

      // console.log('Initiating payment for transaction:', transactionId);
      let orderResponse = null;
      let retryCount = 0;

      // Prepare cart data
      const cartItemsData = cartData?.items.map(item => ({
        product_id: item.product?.id,
        name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        color: item.color,
        size: item.size,
        tax_percentage: item.product?.tax_percentage || 0,
        tax_amount: ((item.unit_price * item.quantity * (item.product?.tax_percentage || 0)) / 100)
      })) || [];

      // Pass coupon_id if available
      const coupon_id = couponState.appliedCoupon?.id || null;

      while (retryCount < 3) {
        try {
          orderResponse = await paymentService.createOrder(transactionId, { cart_data: { items: cartItemsData, coupon_id } });
          break;
        } catch (error) {
          // console.error(`Payment order creation failed (attempt ${retryCount + 1}):`, error);
          retryCount++;
          if (retryCount === 3) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!orderResponse) {
        throw new Error('Failed to create payment order after retries');
      }

      const options = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: orderResponse.data.name,
        description: orderResponse.data.description,
        order_id: orderResponse.data.order_id,
        handler: async function(_response) {
          try {
            setPaymentDetails(prev => ({ 
              ...prev, 
              processing: true,
              error: null 
            }));

            // Show success message immediately - actual processing will happen in webhook
            toast.success('Payment received! Your order will be processed shortly.');

            // Clear cart and redirect
            try {
              await axios.delete('/api/cart/clear');
              await updateCartData();
              
              // Set success and redirect after a short delay
              setPaymentSuccess(true);
              setTimeout(() => {
                router.push('/user/orders');
              }, 2000);
            } catch (_error) {
              toast.warning('Payment successful! Please refresh the page to see your order.');
            }
          } catch (_error) {
            toast.error('There was an issue completing your order. Please check your orders page or contact support.');
          } finally {
            setPaymentDetails(prev => ({ ...prev, processing: false }));
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#ed1c75'
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to initialize payment';
      // console.error('Payment initialization error:', error);    
        toast.error(errorMessage);
    } finally {
      setPaymentDetails(prev => ({ ...prev, processing: false }));
    }
  };

  // Remove stock validation function
  // const validateStockAvailability = () => { ... };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = [];
    if (!contactInfo.fullName?.trim()) missingFields.push('Full Name');
    if (!contactInfo.mobile?.trim()) missingFields.push('Mobile No');
    if (contactInfo.mobile && contactInfo.mobile.length > 15) {
      toast.error('Mobile number must be 15 characters or fewer');
      return;
    }
    if (!contactInfo.email?.trim()) missingFields.push('Email Address');
    if (!shippingAddress.addressLine1?.trim()) missingFields.push('Address');
    if (!shippingAddress.city?.trim()) missingFields.push('City');
    if (!shippingAddress.district?.trim()) missingFields.push('District');
    if (!shippingAddress.state?.trim()) missingFields.push('State');
    if (!shippingAddress.pincode?.trim()) missingFields.push('Pincode');
    if (!shippingAddress.country?.trim()) missingFields.push('Country');

    if (missingFields.length > 0) {
      toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate stock availability before proceeding
    const stockValidation = validateStockAvailability();
    if (!stockValidation.isValid) {
      toast.error(stockValidation.message);
      return;
    }

    try {
      // Prepare order data
      const orderData = {
        contactInfo,
        shippingAddress,
        paymentMethod,
        cartItems: cartData?.items || [],
        summary: calculateSummary(),
        shippingCharge: shippingResult.charge,
        appliedCoupon: couponState.appliedCoupon ? {
          id: couponState.appliedCoupon.id,
          code: couponState.appliedCoupon.code,
          discount: couponState.discount
        } : null,
        totalAmount: calculateSummary().total - calculateSummary().totalBulkDiscount - couponState.discount + shippingResult.charge
      };

      // Create transaction first
      // console.log('Creating transaction...', orderData);
      const transactionResponse = await axios.post('/api/transactions', orderData);

      if (transactionResponse.data.status === 'success') {
        // console.log('Transaction created:', transactionResponse.data.data);

        // Add a small delay to ensure transaction is committed
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If payment method is online, initiate Razorpay payment
        if (paymentMethod === 'online') {
          await handlePayment(transactionResponse.data.data.id);
        } else {
          // For COD or other payment methods
          alert("Order placed successfully!");
          // Add navigation to order confirmation page here
        }
      } else {
        throw new Error(transactionResponse.data.message || 'Failed to create transaction');
      }
    } catch (error) {
      // console.error('Order placement failed:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to place order. Please try again.";
      alert(errorMessage);
    }
  };

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponState.code.trim()) {
      setCouponState(prev => ({ ...prev, error: "Please enter a coupon code" }));
      return;
    }

    if (!isAuthenticated || !user) {
      setCouponState(prev => ({ ...prev, error: "Please login to apply coupon" }));
      return;
    }

    setCouponState(prev => ({
      ...prev,
      isApplying: true,
      error: ""
    }));

    try {
      const summary = calculateSummary();
      const orderTotal = summary.total - summary.totalBulkDiscount;

      // Call backend API to validate coupon and calculate discount
      const response = await axios.post('/api/admin/coupons/validate', {
        code: couponState.code.toUpperCase(),
        order_amount: orderTotal,
        user_id: user.id
      });
      
      // Check valid property in response
      if (response.data.valid === true) {
        const { coupon, discount } = response.data;
        setCouponState(prev => ({
          ...prev,
          isApplying: false,
          appliedCoupon: coupon,
          discount: discount,
          error: ""
        }));
      } else {
        setCouponState(prev => ({
          ...prev,
          isApplying: false,
          error: response.data.message || "Invalid coupon"
        }));
      }
    } catch (error) {
      setCouponState(prev => ({
        ...prev,
        isApplying: false,
        error: error.response?.data?.message || "Failed to apply coupon"
      }));
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setCouponState({
      code: "",
      isApplying: false,
      appliedCoupon: null,
      discount: 0,
      error: ""
    });
  };

  // Loading state - Only show skeleton for initial load, not subsequent updates
  if (isLoading && !hasInitiallyLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty (only after initial load)
  if (hasInitiallyLoaded && !cartData?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Please add items to your cart before checkout.</p>
        <a href="/products" className="text-pink-600 hover:text-pink-700">
          Continue Shopping
        </a>
      </div>
    );
  }
  // Safety check - if cart data is temporarily null during updates, don't render
      if (!cartData && hasInitiallyLoaded) {
        return (
          <div className="max-w-7xl mx-auto px-4 py-8 text-center">
            <div className="text-gray-500">Loading cart data...</div>
          </div>
        );
      }  return (
    <div className="checkout-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          {isAuthenticated && user && (
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user.name}! Your information has been pre-filled.
            </p>
          )}
        </div>

        {/* First Row - Contact and Shipping */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6 sm:gap-8 sm:mb-8">
          {/* Contact Information */}
          <div className="w-full lg:w-1/2">
            <div className="border-b pb-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("contact")}
              >
                <h2 className="text-xl font-medium">Contact Information</h2>
                <ChevronDown className={`transition-transform ${sectionsOpen.contact ? "rotate-180" : ""}`} />
              </div>
              {sectionsOpen.contact && (
                <div className="mt-4 space-y-4 bg-pink-50 p-6 rounded-md">
                  <div>
                    <label htmlFor="fullName" className="block mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="fullName"
                      value={contactInfo.fullName}
                      onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block mb-1">
                      Mobile No <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      id="mobile"
                      value={contactInfo.mobile}
                      onChange={(e) => {
                        const raw = e.target.value || ""
                        // Allow digits, +, space, hyphen; enforce max 15 chars
                        const cleaned = raw.replace(/[^0-9+\-\s]/g, '').slice(0, 15)
                        setContactInfo({ ...contactInfo, mobile: cleaned })
                      }}
                      required
                      maxLength={15}
                      inputMode="tel"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      id="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="w-full lg:w-1/2">
            <div className="border-b pb-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection("shipping")}
              >
                <h2 className="text-xl font-medium">Shipping Address</h2>
                <ChevronDown className={`transition-transform ${sectionsOpen.shipping ? "rotate-180" : ""}`} />
              </div>
              {sectionsOpen.shipping && (
                <div className="mt-4 space-y-4 bg-pink-50 p-6 rounded-md">
                  <div>
                    <label htmlFor="addressLine1" className="block mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="addressLine1"
                      value={shippingAddress.addressLine1}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          addressLine1: e.target.value,
                        })
                      }
                      required
                      placeholder="Enter your complete address"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block mb-1">
                        City/ Town/ Village <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        required
                        placeholder="Enter city/town/village"
                      />
                    </div>
                    <div>
                      <label htmlFor="district" className="block mb-1">
                        District <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="district"
                        value={shippingAddress.district}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            district: e.target.value,
                          })
                        }
                        required
                        placeholder="Enter district"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="state" className="block mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={shippingAddress.state}
                        onValueChange={(value) => setShippingAddress({ ...shippingAddress, state: value })}
                        required
                      >
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                          <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                          <SelectItem value="Assam">Assam</SelectItem>
                          <SelectItem value="Bihar">Bihar</SelectItem>
                          <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                          <SelectItem value="Goa">Goa</SelectItem>
                          <SelectItem value="Gujarat">Gujarat</SelectItem>
                          <SelectItem value="Haryana">Haryana</SelectItem>
                          <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                          <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                          <SelectItem value="Karnataka">Karnataka</SelectItem>
                          <SelectItem value="Kerala">Kerala</SelectItem>
                          <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                          <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                          <SelectItem value="Manipur">Manipur</SelectItem>
                          <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                          <SelectItem value="Mizoram">Mizoram</SelectItem>
                          <SelectItem value="Nagaland">Nagaland</SelectItem>
                          <SelectItem value="Odisha">Odisha</SelectItem>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                          <SelectItem value="Sikkim">Sikkim</SelectItem>
                          <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                          <SelectItem value="Telangana">Telangana</SelectItem>
                          <SelectItem value="Tripura">Tripura</SelectItem>
                          <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                          <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                          <SelectItem value="West Bengal">West Bengal</SelectItem>
                          <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                          <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                          <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                          <SelectItem value="Delhi">Delhi</SelectItem>
                          <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                          <SelectItem value="Ladakh">Ladakh</SelectItem>
                          <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                          <SelectItem value="Puducherry">Puducherry</SelectItem>
                          <SelectItem value="Other States">Other States</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="pincode" className="block mb-1">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        id="pincode"
                        value={shippingAddress.pincode}
                        onChange={(e) =>
                          setShippingAddress({
                            ...shippingAddress,
                            pincode: e.target.value,
                          })
                        }
                        required
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="country" className="block mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      required
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second Row - Payment and Coupon */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6 sm:gap-8 sm:mb-8">
          {/* Payment Details */}
          <div className="w-full lg:w-1/2">
            <div className="bg-pink-50 rounded-md">
              <div
                className="flex justify-between items-center cursor-pointer p-4 border-b"
                onClick={() => toggleSection("payment")}
              >
                <h2 className="text-xl font-medium">Payment Details</h2>
                <ChevronDown
                  className={`transition-transform ${sectionsOpen.payment ? "rotate-180" : ""}`}
                />
              </div>
              {sectionsOpen.payment && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="payOnline"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="w-4 h-4 text-pink-600"
                    />
                    <label htmlFor="payOnline" className="ml-2">
                      Pay via Online
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coupon Section */}
          <div className="w-full lg:w-1/2">
            <div className="bg-pink-50 rounded-md p-6">
              <h2 className="text-xl font-medium mb-4">Apply Coupon</h2>

              {!couponState.appliedCoupon ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      className="flex-1"
                      value={couponState.code}
                      onChange={(e) => setCouponState(prev => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                        error: ""
                      }))}
                      disabled={couponState.isApplying}
                    />
                    <Button
                      variant="default"
                      className="bg-[#ed1c75] hover:bg-pink-700"
                      onClick={applyCoupon}
                      disabled={couponState.isApplying || !couponState.code.trim()}
                    >
                      {couponState.isApplying ? "Applying..." : "Apply"}
                    </Button>
                  </div>

                  {/* Error Message */}
                  {couponState.error && (
                    <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">
                      {couponState.error}
                    </div>
                  )}
                </>
              ) : (
                /* Applied Coupon Display */
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-green-800">
                        Coupon Applied: {couponState.appliedCoupon.code}
                      </div>
                      <div className="text-sm text-green-600">
                        {couponState.appliedCoupon.name}
                      </div>
                      {couponState.appliedCoupon.description && (
                        <div className="text-xs text-green-600 mt-1">
                          {couponState.appliedCoupon.description}
                        </div>
                      )}
                   
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      Remove
                    </Button>
                  </div>


                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Items and Order Summary */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="w-full lg:w-[65%]">
            <Card className="w-full mb-6 sm:mb-0">
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Cart View */}
                <div className="block lg:hidden space-y-4">
                  {cartData?.items?.map((item) => (
                    <div key={item.id} className="border-b p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 relative flex-shrink-0">
                          <Image
                            src={optimizeCloudinary(item.image) || "/placeholder.svg"}
                            alt={item.product_name}
                            fill
                            className="object-cover rounded-md"
                            onError={(e) => {
                              e.target.src = "/images/placeholder.jpg";
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-500">{item.product?.category_name || item.product?.category?.name}</div>
                          <div className="font-medium truncate">{item.product_name}</div>
                          <div className="flex items-center text-xs mt-1 mb-2">
                            <div className="mr-3">
                              COLOR{" "}
                              <span
                                className="w-3 h-3 rounded-full inline-block ml-1 align-middle"
                                style={{
                                  backgroundColor: colorMap[item.color?.toLowerCase()] || item.color,
                                  border: item.color?.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                                }}
                              ></span>
                            </div>
                            <div>SIZE {item.size}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Price: ₹{item.unit_price?.toLocaleString()}</div>
                            <div>Qty: {item.quantity}</div>
                            <div>Weight: {item.product?.weight}{item.product?.weight_unit}</div>
                            <div>GST ({item.product?.tax_percentage || 0}%): ₹{(((item.unit_price || 0) * item.quantity * (item.product?.tax_percentage || 0)) / 100).toLocaleString()}</div>
                            <div className="text-pink-600 font-medium">
                              Total: ₹{((item.unit_price || 0) * item.quantity).toLocaleString()}
                            </div>
                            {item.has_bulk_discount && item.quantity >= item.min_quantity_for_discount && (
                              <div className="text-green-600 text-xs col-span-2">
                                Bulk discount: -₹{(item.bulk_discount_amount * item.quantity).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) || []}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader className="bg-[#ed1c75]">
                      <TableRow>
                        <TableHead className="w-[300px] text-white">Item</TableHead>
                        <TableHead className="text-center text-white">Price</TableHead>
                        <TableHead className="text-center text-white">Quantity</TableHead>
                        <TableHead className="text-center text-white">Weight</TableHead>
                        <TableHead className="text-center text-white">GST</TableHead>
                        <TableHead className="text-right text-white">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartData?.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 relative">
                                <Image
                                  src={optimizeCloudinary(item.image) || "/placeholder.svg"}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover rounded-md"
                                  onError={(e) => {
                                    e.target.src = "/images/placeholder.jpg";
                                    e.target.onerror = null;
                                  }}
                                />
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">{item.product?.category_name || item.product?.category?.name}</div>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="flex items-center text-xs mt-1">
                                  <div className="mr-3">
                                    COLOR{" "}
                                    <span
                                      className="w-3 h-3 rounded-full inline-block ml-1"
                                      style={{
                                        backgroundColor: colorMap[item.color?.toLowerCase()] || item.color,
                                        border: item.color?.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                                      }}
                                    ></span>
                                  </div>
                                  <div>SIZE {item.size}</div>
                                </div>
                                {item.has_bulk_discount && item.quantity >= item.min_quantity_for_discount && (
                                  <div className="text-xs text-green-600 mt-1">
                                    Bulk discount applied: -₹{(item.bulk_discount_amount * item.quantity).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            Rs. {item.unit_price?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">
                            {item.product?.weight}{item.product?.weight_unit}
                          </TableCell>
                          <TableCell className="text-center">
                            Rs. {(((item.unit_price || 0) * item.quantity * (item.product?.tax_percentage || 0)) / 100).toLocaleString()}
                            <div className="text-xs text-gray-500">({item.product?.tax_percentage || 0}%)</div>
                          </TableCell>
                          <TableCell className="text-right text-pink-600 font-medium">
                            Rs. {((item.unit_price || 0) * item.quantity).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-[35%]">
            <Card className="w-full bg-pink-50 lg:sticky lg:top-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Cart Weight Information */}
                <div className="bg-white p-3 rounded-md">
                  <div className="text-sm text-gray-600 mb-1">Total Cart Weight:</div>
                  <div className="font-medium">{shippingResult.totalWeight.toFixed(2)} kg</div>
                  {shippingResult.rule && (() => {
                    const shippingDetails = shippingController.getShippingDetails(shippingResult);
                    return (
                      <div className="text-xs text-gray-500 mt-1">
                        {shippingDetails.details.map((detail, index) => (
                          <div key={index}>{detail}</div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Original Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Original Subtotal:</span>
                  <span className="font-medium">₹{calculateSummary().originalSubtotal.toFixed(2)}</span>
                </div>

                {/* Bulk Discounts Section */}
                {calculateSummary().bulkDiscounts.length > 0 && (
                  <>
                    <div className="text-sm text-gray-600">Bulk Discounts:</div>
                    {calculateSummary().bulkDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-sm text-green-600">
                        <span>{discount.productName} ({discount.quantity} items @ ₹{discount.discountPerItem} off):</span>
                        <span>-₹{discount.savedAmount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Total Bulk Discount:</span>
                      <span>-₹{calculateSummary().totalBulkDiscount.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* GST Details */}
                {/* {calculateSummary().gstDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span>GST ({detail.taxPercentage}%) on {detail.productName}:</span>
                    <span>₹{detail.gstAmount.toFixed(2)}</span>
                  </div>
                ))} */}

                {/* Total GST */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total GST:</span>
                  <span className="font-medium">₹{calculateSummary().totalGst.toFixed(2)}</span>
                </div>

                {/* Coupon Discount Section */}
                {couponState.appliedCoupon && couponState.discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <div className="flex flex-col">
                      <span className="font-medium">Coupon Discount ({couponState.appliedCoupon.code}):</span>
                      <span className="text-xs text-green-500">
                        {couponState.appliedCoupon.discount_type === 'amount'
                          ? `₹${couponState.appliedCoupon.discount_value} off`
                          : `${couponState.appliedCoupon.discount_value}% off`
                        }
                      </span>
                    </div>
                    <span className="font-medium">-₹{couponState.discount.toFixed(2)}</span>
                  </div>
                )}

                {/* Shipping Charges */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-gray-700">Shipping Charges:</span>
                    {shippingResult.rule?.locationRule?.estimated_days && (
                      <div className="text-xs text-gray-500">
                        Delivery: {shippingResult.rule.locationRule.estimated_days}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">
                    {shippingResult.charge === 0 ? (
                      <span className="text-green-600">Free!</span>
                    ) : (
                      `₹${shippingResult.charge.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Total Amount */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-lg font-bold">₹{(calculateSummary().total - calculateSummary().totalBulkDiscount - couponState.discount + shippingResult.charge).toFixed(2)}</span>
                  </div>

                  {/* Total Savings Display */}
                  {(calculateSummary().totalBulkDiscount > 0 || couponState.discount > 0) && (
                    <div className="mt-2 p-2 bg-green-50 rounded-md">
                      <div className="text-sm text-green-700 font-medium mb-1 flex items-center gap-1">
                        <Wallet className="w-4 h-4" />
                        Your Total Savings:
                      </div>
                      {calculateSummary().totalBulkDiscount > 0 && (
                        <div className="text-xs text-green-600">
                          • Bulk Discounts: ₹{calculateSummary().totalBulkDiscount.toFixed(2)}
                        </div>
                      )}
                      {couponState.discount > 0 && (
                        <div className="text-xs text-green-600">
                          • Coupon Discount ({couponState.appliedCoupon.code}): ₹{couponState.discount.toFixed(2)}
                        </div>
                      )}
                      <div className="text-sm text-green-700 font-semibold mt-1">
                        Total Saved: ₹{(calculateSummary().totalBulkDiscount + couponState.discount).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {shippingResult.freeShipping && shippingAddress.state && (
                    <div className="text-sm text-green-600 mt-2">
                      🚚 Free shipping applied!
                    </div>
                  )}
                </div>                {/* Pay Now Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#ed1c75] hover:bg-pink-700 relative"
                  onClick={handleSubmit}
                  disabled={!shippingAddress.state || paymentDetails.processing}
                >
                  {paymentDetails.processing ? (
                    <>
                      <span className="absolute left-1/2 transform -translate-x-1/2">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      <span className="opacity-0">Proceed to Payment</span>
                    </>
                  ) : !shippingAddress.state ? (
                    "Please select shipping state"
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Section
        <section className={`checkout-section ${sectionsOpen.payment ? 'open' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('payment')}>
            <h2>Payment</h2>
            <span className="toggle-icon">{sectionsOpen.payment ? '−' : '+'}</span>
          </div>
          {sectionsOpen.payment && (            <div className="payment-methods">
              <button
                onClick={handlePayment}
                className="razorpay-btn"
                disabled={paymentDetails.processing}
              >
                {paymentDetails.processing ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          )}
        </section> */}

        {/* Order Summary Section */}
        <aside className={`order-summary ${sectionsOpen.summary ? 'open' : ''}`}>
          {/* <div className="summary-header" onClick={() => toggleSection('summary')}>
            <h2>Order Summary</h2>
            <span className="toggle-icon">{sectionsOpen.summary ? '−' : '+'}</span>
          </div> */}
          {sectionsOpen.summary && (
            <div className="summary-content">
              <div className="summary-items">
                {cartData?.items.map((item) => (
                  <div key={item.id} className="summary-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{calculateTotalAmount().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (18%)</span>
                  <span>₹{(calculateTotalAmount() * 0.18).toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{(calculateTotalAmount() * 1.18).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
      <Toaster position="top-right" duration={3000} />
    </div>
  )
}

export default CheckoutPage