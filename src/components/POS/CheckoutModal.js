"use client"
import { useState, useContext, useEffect } from "react"
import { X, Check, CreditCard, DollarSign, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "react-toastify"
import axios from '../../lib/axios'
import OrderCompleteModal from "./OrderCompleteModal"
import { CartContext } from "@/contexts/CartContext"

// Create a safer toast wrapper to prevent errors
const safeToast = {
  success: (message) => {
    try {
      return toast.success(message);
    } catch (e) {
      // console.warn('Toast error:', e);
    }
  },
  error: (message) => {
    try {
      return toast.error(message);
    } catch (e) {
      // console.warn('Toast error:', e);
      // Fallback to alert if toast fails
      alert(message);
    }
  }
};

export default function CheckoutModal({
  cart,
  subtotal,
  tax,
  total,
  paymentMethod,
  setPaymentMethod,
  collectCustomerInfo,
  setCollectCustomerInfo,
  customerInfo,
  setCustomerInfo,
  onCancel,
  onComplete,
  onClose,
  invoiceNumber
}) {
  const [cashReceived, setCashReceived] = useState("")
  const [showCashInput, setShowCashInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [processingMessage, setProcessingMessage] = useState("")
  const [processingSteps, setProcessingSteps] = useState([])
  const [showOrderComplete, setShowOrderComplete] = useState(false)
  const [orderCompleteData, setOrderCompleteData] = useState(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)
  const [discount, setDiscount] = useState("")
  
  const { clearCart } = useContext(CartContext)

  useEffect(() => {
    if (!invoiceNumber) {
      // console.warn("CheckoutModal opened without invoice number");
    } else {
      // console.log("CheckoutModal opened with invoice number:", invoiceNumber);
    }
  }, [invoiceNumber]);

  // Add function to fetch customer data
  const fetchCustomerData = async (phone) => {
    if (!phone || phone.length !== 10) return;
    
    try {
      setIsLoadingCustomer(true);
      const response = await axios.get('/api/admin/pos/customers');
      
      if (response.data && Array.isArray(response.data)) {
        // Find customer with matching phone number
        const customerData = response.data.find(customer => customer.phone === phone);
        
        if (customerData) {
          // console.log('Found customer data:', customerData); // Debug log
          
          // Create a new customer info object with all fields
          const newCustomerInfo = {
            name: customerData.name || '',
            phone: phone, // Use the phone number we searched with
            email: customerData.email || ''
          };
          
          // console.log('Setting customer info:', newCustomerInfo); // Debug log
          
          // Update all fields at once
          setCustomerInfo(newCustomerInfo);
          
          // Enable customer info collection
          setCollectCustomerInfo(true);
        } else {
          // console.log('No customer found for phone:', phone); // Debug log
          // If no customer found, keep the phone number but clear other fields
          setCustomerInfo(prev => ({
            ...prev,
            phone: phone,
            name: '',
            email: ''
          }));
        }
      }
    } catch (error) {
      // console.error('Error fetching customer data:', error);
      // Keep the phone number but clear other fields on error
      setCustomerInfo(prev => ({
        ...prev,
        phone: phone,
        name: '',
        email: ''
      }));
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  // Add phone number handler
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and limit to 10 digits
    const phone = value.replace(/\D/g, '').slice(0, 10);
    
    setCustomerInfo({ ...customerInfo, phone });
    
    // Clear other fields if phone is empty
    if (!phone) {
      setCustomerInfo({ ...customerInfo, phone: '', name: '', email: '' });
      return;
    }
    
    // Fetch customer data if phone number is exactly 10 digits
    if (phone.length === 10) {
      fetchCustomerData(phone);
    }
  };

  const handleCashPayment = (e) => {
    const value = e.target.value
    setCashReceived(value)
  }

  const calculateChange = () => {
    if (!cashReceived) return 0
    const change = parseFloat(cashReceived) - calculateDiscountedTotal()
    return change >= 0 ? change : 0
  }

  // Calculate discounted total
  const calculateDiscountedTotal = () => {
    const discountAmount = parseFloat(discount) || 0
    return Math.max(0, total - discountAmount)
  }

  const handleDiscountChange = (e) => {
    const value = e.target.value
    // Only allow positive numbers
    if (value === "" || (!isNaN(value) && parseFloat(value) >= 0)) {
      setDiscount(value)
    }
  }

  const handleSubmit = async () => {
    // Basic validation
    const finalTotal = calculateDiscountedTotal()
    if (paymentMethod === "Cash" && (parseFloat(cashReceived) < finalTotal || !cashReceived)) {
      setError("Please enter a valid cash amount that covers the total")
      return
    }

    // Clear any previous errors
    setError("")
    setProcessingSteps([])
    
    // Validate customer info if checked
    if (collectCustomerInfo) {
      if (!customerInfo.phone || customerInfo.phone.length !== 10) {
        setError("Please enter a valid 10-digit phone number")
        return
      }
      
      if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
        setError("Please enter a valid email address")
        return
      }
    }

    try {
      setIsProcessing(true)
      setIsSubmitting(true)
      
      // Display informative processing messages in steps
      setProcessingMessage("Processing order...")
      
      // Step 1: Generate invoice number
      setProcessingSteps(prev => [...prev, `Invoice number: ${invoiceNumber || 'Generating...'}`]);
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Step 2: Get order number
      setProcessingSteps(prev => [...prev, "Creating order reference..."]);
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 3: Process payment
      setProcessingSteps(prev => [...prev, "Processing payment..."]);
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Step 4: Save transaction
      setProcessingSteps(prev => [...prev, "Saving transaction details..."]);
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Complete the order process - ensure data is properly formatted
      const discountedTotal = calculateDiscountedTotal()
      const discountAmount = parseFloat(discount) || 0
      await onComplete(discountedTotal, discountAmount)
    } catch (err) {
      // console.error("Error completing checkout:", err)
      setError("Failed to process order. Please try again.")
      safeToast.error("Failed to submit order: " + (err.response?.data?.message || err.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
      setIsSubmitting(false)
      setProcessingMessage("")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md relative max-h-[90vh] overflow-auto">
        <button 
          onClick={onCancel} 
          className="absolute right-4 top-4 text-white bg-pink-500 hover:bg-pink-600 rounded-xl p-2"
          disabled={isProcessing}
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Complete Purchase</h2>

          {invoiceNumber && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded-md text-sm">
              Invoice #: {invoiceNumber}
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="border rounded-md p-3 mb-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex flex-col py-1">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity} x {item.product.name}
                    </span>
                    <span>₹{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end text-sm text-gray-500">
                    <span>Tax ({item.product.taxPercentage}%): 
                      ₹{((item.product.price * item.product.taxPercentage/100) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tax:</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Discount:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">₹</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={handleDiscountChange}
                    className="w-20 h-8 text-right text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {discount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount Applied:</span>
                  <span>-₹{(parseFloat(discount) || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Final Total:</span>
                <span>₹{calculateDiscountedTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4 flex items-center">
              <Checkbox
                id="collectInfo"
                checked={collectCustomerInfo}
                onCheckedChange={(checked) => setCollectCustomerInfo(checked)}
              />
              <Label htmlFor="collectInfo" className="ml-2">
                Collect Customer Information
              </Label>
            </div>

            {collectCustomerInfo && (
              <div className="border rounded-md p-4 mb-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <span className="mr-2">Customer Details</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10 digit phone number"
                        value={customerInfo.phone}
                        onChange={handlePhoneChange}
                        maxLength={10}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        required
                      />
                      {isLoadingCustomer && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#eb1c75]"></div>
                        </div>
                      )}
                    </div>
                    {customerInfo.phone && customerInfo.phone.length !== 10 && (
                      <p className="text-sm text-red-500 mt-1">Please enter a valid 10-digit phone number</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Customer name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      value={customerInfo.email || ''}
                      onChange={(e) => {
                        setCustomerInfo(prev => ({
                          ...prev,
                          email: e.target.value
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {paymentMethod || "Select Payment Method"}
                        <CreditCard className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem
                        onClick={() => {
                          setPaymentMethod("Cash")
                          setShowCashInput(true)
                        }}
                      >
                        Cash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setPaymentMethod("Card")
                          setShowCashInput(false)
                        }}
                      >
                        Card
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setPaymentMethod("UPI/QR")
                          setShowCashInput(false)
                        }}
                      >
                        UPI/QR
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {paymentMethod === "Cash" && (
                  <div className="border rounded-md p-4 mb-4 space-y-3">
                    <div>
                      <Label htmlFor="cashReceived">Cash Received</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="cashReceived"
                          type="number"
                          placeholder="Enter amount"
                          value={cashReceived}
                          onChange={handleCashPayment}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="font-medium">Total Due:</span>
                      <span className="text-lg font-bold">₹{calculateDiscountedTotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">Change Due:</span>
                      <span className={`text-lg font-bold ${calculateChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{calculateChange().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === "Card" && (
                  <div className="border rounded-md p-4 space-y-3">
                    <div>
                      <Label htmlFor="cardAmount">Card Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="cardAmount"
                          type="number"
                          value={calculateDiscountedTotal().toFixed(2)}
                          readOnly
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "UPI/QR" && (
                  <div className="border rounded-md p-4 space-y-3">
                    <div>
                      <Label htmlFor="upiAmount">UPI Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <Input
                          id="upiAmount"
                          type="number"
                          value={calculateDiscountedTotal().toFixed(2)}
                          readOnly
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center items-center text-gray-500">
                  <CreditCard className="mr-2" size={24} />
                  <span>{paymentMethod || "No"} payment method selected</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                <span>{error}</span>
              </div>
            )}

            {isProcessing && (
              <div className="border rounded-md p-3 mb-4 bg-blue-50">
                <h4 className="font-medium mb-2 text-blue-800">Processing Order</h4>
                <ul className="space-y-2">
                  {processingSteps.map((step, index) => (
                    <li key={index} className={`flex items-center ${index === 0 ? 'text-pink-600 font-medium' : 'text-blue-700'}`}>
                      <Check className={`mr-2 h-4 w-4 ${index === 0 ? 'text-pink-600' : 'text-blue-700'}`} /> 
                      {step}
                      {index === 0 && <span className="ml-1 text-xs text-pink-500">(will appear on receipt)</span>}
                    </li>
                  ))}
                  {isProcessing && processingSteps.length < 4 && (
                    <li className="flex items-center text-blue-700">
                      <span className="mr-2 h-4 w-4 inline-block animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
                      <span>{processingMessage}</span>
                    </li>
                  )}
                </ul>
                {/* <div className="mt-3 text-xs text-gray-600 border-t pt-2">
                  <p className="mb-1"><strong>About Invoice Numbers:</strong> A unique invoice number will be generated for this transaction.</p>
                  <p>This number serves as an official record for accounting, tax purposes, and order tracking. It will appear on the customer receipt.</p>
                </div> */}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                className="w-full text-white bg-[#EB1C75] hover:bg-[#d1007d]"
                disabled={isSubmitting || isProcessing} 
                onClick={handleSubmit}
              >
                {isSubmitting || isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  'Complete Payment'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showOrderComplete && orderCompleteData && (
        <OrderCompleteModal 
          {...orderCompleteData}
          onClose={() => setShowOrderComplete(false)} 
        />
      )}
    </div>
  )
}