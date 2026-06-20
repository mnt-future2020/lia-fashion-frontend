"use client"

import { useState, useEffect } from "react"
import { calculateCartSummary } from "@/utils/cartSummary";
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { optimizeCloudinary } from "@/lib/utils"
import axios from '../../../lib/axios';
import { toast } from 'react-toastify'
import { useUserCart } from "@/contexts/UserCartContext";
import { useUserAuth } from "@/contexts/UserAuthContext";

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

const CartPage = () => {
  const [updating, setUpdating] = useState(false);
  const [offers, setOffers] = useState([]);
  const [mounted, setMounted] = useState(false);

  const { cartData, updateCartData, updateCartItem, isLoading, validateStockAvailability } = useUserCart();
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  
  // Handle component mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging and authentication handling
  useEffect(() => {
    if (!mounted) return;
    
    console.log('Cart: Auth state changed', { isAuthenticated, authLoading });
    
    // Don't redirect during auth loading
    if (authLoading) {
      console.log('Cart: Auth still loading...');
      return;
    }

    // Check if user has a valid token but context says not authenticated
    // This can happen during page refresh before the context fully loads
    if (!isAuthenticated && typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-token='))
        ?.split('=')[1];
      
      if (token) {
        console.log('Cart: Token exists but context not authenticated, waiting for auth to complete...');
        return; // Don't redirect yet, let the context finish loading
      }
    }
  }, [isAuthenticated, authLoading, mounted]);

  // Fetch offers on mount - only when authenticated
  useEffect(() => {
    if (!mounted || authLoading) return;
    
    const fetchOffers = async () => {
      try {
        const res = await axios.get('/api/admin/offers');
        if (res.data.status === 'success') {
          // Sort offers by discount amount (highest first) for consistent processing
          const sortedOffers = (res.data.data || []).sort((a, b) => {
            return parseFloat(b.discount_amount) - parseFloat(a.discount_amount);
          });
          setOffers(sortedOffers);
          try {
            localStorage.setItem('activeOffers', JSON.stringify(sortedOffers));
          } catch (_e) {}
        }
      } catch (_error) {
        // Optionally show error
      }
    };
    
    // Only fetch offers after auth is resolved and user is authenticated
    if (isAuthenticated) {
      fetchOffers();
    }
  }, [mounted, authLoading, isAuthenticated]);

  // Add this helper function to get available stock for a size
  const getAvailableStock = (product, size) => {
    if (!product?.sizes) {
      // console.log('No sizes data for product:', product?.name);
      return 0;
    }
    
    let sizesArray;
    
    // Check if sizes is already an array or needs to be parsed
    if (Array.isArray(product.sizes)) {
      sizesArray = product.sizes;
      // console.log('Sizes is already an array:', sizesArray);
    } else if (typeof product.sizes === 'string') {
      try {
        sizesArray = JSON.parse(product.sizes);
        // console.log('Parsed sizes from string:', sizesArray);
      } catch (_error) {
        // console.error('Error parsing sizes:', _error);
        return 0;
      }
    } else {
      // console.log('Sizes is neither array nor string:', typeof product.sizes, product.sizes);
      return 0;
    }
    
    const sizeData = sizesArray.find(s => s.size === size);
    const stock = sizeData ? parseInt(sizeData.stock) || 0 : 0;
    
    // console.log(`Stock check for ${product?.name} size ${size}:`, {
    //   sizeData,
    //   stock,
    //   allSizes: sizesArray
    // });
    
    return stock;
  };

  // Update quantity
  const updateQuantity = async (itemId, newQuantity) => {
    const item = cartData.items.find(item => item.id === itemId);
    if (!item) {
      return;
    }

    const availableStock = getAvailableStock(item.product, item.size);

    if (newQuantity < 1) {
      toast.error('Quantity cannot be less than 1');
      return;
    }

    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} items available in stock`);
      return;
    }

    try {
      // Use the optimistic update method from context
      await updateCartItem(itemId, newQuantity);

      // Show bulk discount message if applicable
      if (item.has_bulk_discount && newQuantity >= item.min_quantity_for_discount) {
        toast.success(`Bulk discount of ₹${item.bulk_discount_amount} per item applied!`);
      }
    } catch (_error) {
      toast.error('Failed to update cart');
    }
  }

  // Remove item
  const removeItem = async (itemId) => {
    try {
      await axios.delete(`/api/cart/items/${itemId}`);
      await updateCartData();
      // Removed toast message for item removal
    } catch {
      toast.error('Failed to remove item');
    }
  }

  // Clear cart
  const clearCart = async () => {
    try {
      setUpdating(true);
      await axios.delete('/api/cart/clear');
      await updateCartData();
      toast.success('Cart cleared successfully');
    } catch (_error) {
      // console.error('Failed to clear cart:', _error);
      toast.error('Failed to clear cart');
    } finally {
      setUpdating(false);
    }
  }

  // Use shared cart summary logic
  const summary = calculateCartSummary(cartData, offers);

  // Check if checkout should be disabled due to stock issues (only if cart has items)
  const stockValidation = cartData?.items?.length > 0 ? validateStockAvailability() : { isValid: true, message: null };
  const hasStockIssues = !stockValidation.isValid;

  const renderSkeleton = () => {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Skeleton */}
          <div className="lg:w-2/3 space-y-4">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-24 space-y-2">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Skeleton */}
          <div className="lg:w-1/3">
            <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="my-4 h-px bg-gray-200"></div>
                <div className="flex justify-between">
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show loading screen while auth is being checked or component is mounting
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1c75] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Additional check for token presence during auth resolution
  if (!isAuthenticated && typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('user-token='))
      ?.split('=')[1];
    
    if (token) {
      // User has token but context hasn't updated yet, show loading
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eb1c75] mx-auto mb-4"></div>
            <p className="text-gray-600">Authenticating...</p>
          </div>
        </div>
      );
    }
  }

  // Show skeleton ONLY for initial loading, not for updates
  if (isLoading && !cartData) {
    return renderSkeleton();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Stock warning banner */}
      {hasStockIssues && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Stock Issues Detected
              </h3>
              {/* <div className="mt-2 text-sm text-red-700">
                {stockValidation.message}
              </div> */}
            </div>
          </div>
        </div>
      )}

      {cartData?.items?.length === 0 ? (
        // Empty cart view component
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        // Cart content
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left side - Cart Items */}
          <div className="lg:w-2/3">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-4 font-medium">Item</th>
                    <th className="text-left py-4 font-medium">Price</th>
                    <th className="text-left py-4 font-medium">Quantity</th>
                    <th className="text-left py-4 font-medium">Subtotal</th>
                    <th className="text-left py-4 font-medium">GST</th>
                    <th className="py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cartData?.items?.map((item) => (
                    <tr key={item.id} className="py-4">
                      {/* Item column */}
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-20 h-20 mr-4 relative">
                            {item.image && (
                              <Link href={`/products/${item.product?.slug || item.product_id}`}> {/* Use slug if available, fallback to id */}
                                <Image
                                  src={optimizeCloudinary(item.image)}
                                  alt={item.product_name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover rounded-md cursor-pointer"
                                  onError={(e) => {
                                    e.target.src = "/images/placeholder.jpg";
                                    e.target.onerror = null;
                                  }}
                                />
                              </Link>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">
                              {item.product?.category_name || item.product?.category?.name}
                            </div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="mt-1 text-sm">
                              <div className="flex items-center">
                                <span className="mr-2">COLOR:</span>
                                <span
                                  className="w-4 h-4 rounded-full inline-block"
                                  style={{
                                    backgroundColor: colorMap[item.color?.toLowerCase()] || item.color,
                                    border: item.color?.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                                  }}
                                ></span>
                              </div>
                              <div>SIZE: {item.size}</div>
                              {/* Stock warning */}
                              {(() => {
                                const availableStock = getAvailableStock(item.product, item.size);
                                if (availableStock === 0) {
                                  return <div className="text-red-600 text-xs font-medium mt-1">⚠️ Out of stock</div>;
                                } else if (availableStock < item.quantity) {
                                  return <div className="text-orange-600 text-xs font-medium mt-1">⚠️ Only {availableStock} available</div>;
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Price column */}
                      <td className="py-4">
                        <div>
                          <div className="text-gray-900">
                            Rs. {item.unit_price?.toLocaleString()}
                          </div>
                          {item.has_bulk_discount && (
                            <div className="text-xs text-gray-500">
                              Bulk discount: {item.min_quantity_for_discount}+ items @ Rs.{item.bulk_discount_amount} off each
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Quantity column */}
                      <td className="py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center border rounded-md w-24">
                            <button
                              className={`px-3 py-1 text-gray-600 ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-center flex-1">{item.quantity}</span>
                            <button
                              className={`px-3 py-1 text-gray-600 ${item.quantity >= getAvailableStock(item.product, item.size) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= getAvailableStock(item.product, item.size)}
                            >
                              +
                            </button>
                          </div>
                          {item.has_bulk_discount && item.quantity >= item.min_quantity_for_discount && (
                            <div className="text-xs text-green-600 font-medium">
                              Bulk discount applied!
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Subtotal column */}
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-pink-600 font-medium">
                            Rs. {((item.unit_price || 0) * item.quantity).toLocaleString()}
                          </span>
                          {item.has_bulk_discount && item.quantity >= item.min_quantity_for_discount && (
                            <span className="text-xs text-green-600">
                              Saved: Rs.{(item.bulk_discount_amount * item.quantity).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* GST column */}
                      <td className="py-4 text-gray-600">
                        Rs. {(((item.unit_price || 0) * item.quantity * (item.product?.tax_percentage || 0)) / 100).toLocaleString()}
                        <span className="text-xs text-gray-500 ml-1">
                          ({item.product?.tax_percentage || 0}%)
                        </span>
                      </td>
                      {/* Remove button column */}
                      <td className="py-4">
                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {cartData?.items?.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                  {/* Product Header with Remove Button */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-xs text-gray-500">
                      {item.product?.category_name || item.product?.category?.name}
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-24 h-24 relative flex-shrink-0">
                      {item.image && (
                        <Link href={`/products/${item.product?.slug || item.product_id}`}>
                          <Image
                            src={optimizeCloudinary(item.image)}
                            alt={item.product_name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover rounded-md cursor-pointer"
                            onError={(e) => {
                              e.target.src = "/images/placeholder.jpg";
                              e.target.onerror = null;
                            }}
                          />
                        </Link>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center">
                          <span className="text-sm mr-2">COLOR:</span>
                          <span
                            className="w-4 h-4 rounded-full inline-block"
                            style={{
                              backgroundColor: colorMap[item.color?.toLowerCase()] || item.color,
                              border: item.color?.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                            }}
                          ></span>
                        </div>
                        <div className="text-sm">SIZE: {item.size}</div>
                        {/* Stock warning */}
                        {(() => {
                          const availableStock = getAvailableStock(item.product, item.size);
                          if (availableStock === 0) {
                            return <div className="text-red-600 text-xs font-medium mt-1">⚠️ Out of stock</div>;
                          } else if (availableStock < item.quantity) {
                            return <div className="text-orange-600 text-xs font-medium mt-1">⚠️ Only {availableStock} available</div>;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Price and Quantity Controls */}
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-gray-900 font-medium">
                        Rs. {item.unit_price?.toLocaleString()}
                      </div>
                      {item.has_bulk_discount && (
                        <div className="text-xs text-gray-500">
                          Bulk discount: {item.min_quantity_for_discount}+ items @ Rs.{item.bulk_discount_amount} off each
                        </div>
                      )}
                    </div>
                    <div className="flex items-center border rounded-md">
                      <button
                        className={`px-3 py-1 text-gray-600 ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-center">{item.quantity}</span>
                      <button
                        className={`px-3 py-1 text-gray-600 ${item.quantity >= getAvailableStock(item.product, item.size) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= getAvailableStock(item.product, item.size)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Subtotal and GST */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="text-pink-600 font-medium">
                        Rs. {((item.unit_price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST ({item.product?.tax_percentage || 0}%):</span>
                      <span className="text-gray-600">
                        Rs. {(((item.unit_price || 0) * item.quantity * (item.product?.tax_percentage || 0)) / 100).toLocaleString()}
                      </span>
                    </div>
                    {item.has_bulk_discount && item.quantity >= item.min_quantity_for_discount && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Bulk Discount Savings:</span>
                        <span>Rs. {(item.bulk_discount_amount * item.quantity).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Actions */}
            <div className="flex justify-between mt-8">
              <button
                onClick={clearCart}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={updating}
              >
                {updating ? 'Clearing...' : 'Clear Cart'}
              </button>
            </div>
          </div>

          {/* Right side - Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-pink-50 rounded-md p-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Original Subtotal:</span>
                  <span>₹{summary.originalSubtotal.toFixed(2)}</span>
                </div>

                {/* Offer Applied Section */}
                {summary.totalOfferDiscount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-pink-600">
                    <span>Offer Discount:</span>
                    <span>-₹{summary.totalOfferDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Bulk Discounts Section */}
                {summary.bulkDiscounts.length > 0 && (
                  <>
                    <div className="text-sm text-gray-600">Bulk Discounts:</div>
                    {summary.bulkDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-sm text-green-600">
                        <span>{discount.productName} ({discount.quantity} items @ ₹{discount.discountPerItem} off):</span>
                        <span>-₹{discount.savedAmount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-medium text-green-600">
                      <span>Total Bulk Discount:</span>
                      <span>-₹{summary.totalBulkDiscount.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {/* GST Details */}
                {/* {summary.gstDetails.map((detail, index) => (
                  <div key={index} className="flex justify-between text-sm text-gray-600">
                    <span>GST ({detail.taxPercentage}%) on {detail.productName}:</span>
                    <span>₹{detail.gstAmount.toFixed(2)}</span>
                  </div>
                ))} */}

                {/* Total GST */}
                <div className="flex justify-between text-sm font-medium">
                  <span>Total GST:</span>
                  <span>₹{summary.totalGst.toFixed(2)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total Amount:</span>
                    <span>₹{(summary.total - summary.totalBulkDiscount).toFixed(2)}</span>
                  </div>
                  {summary.totalBulkDiscount > 0 && (
                    <div className="text-sm text-green-600 mt-2">
                      You saved ₹{summary.totalBulkDiscount.toFixed(2)} with bulk discounts!
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={hasStockIssues ? "#" : "/user/checkout"}
                onClick={(e) => {
                  if (hasStockIssues) {
                    e.preventDefault();
                    toast.error(stockValidation.message || "Cannot proceed to checkout due to stock issues");
                  }
                }}
                className={`mt-6 w-full block text-center px-6 py-3 rounded-md ${
                  hasStockIssues 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {hasStockIssues ? 'Cannot Checkout - Stock Issues' : 'Proceed to Checkout'}
              </Link>
          
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CartPage