"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, Plus, Trash2, Search } from "lucide-react"
import axios from "../../../lib/axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const PurchaseEntryForm = () => {
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [purchaseNumber, setPurchaseNumber] = useState('')
  const [discount, setDiscount] = useState('')
  const [purchaseItems, setPurchaseItems] = useState([
    {
      id: 1,
      skuCode: "",
      productName: "",
      quantity: "",
      pricePerUnit: "",
      gst: "",
      totalCost: 0,
    },
  ])
  const [skuSearchFeedback, setSkuSearchFeedback] = useState({})
  const [skuSearchTimers, setSkuSearchTimers] = useState({})

  const router = useRouter()

  // Fetch products
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        const response = await axios.get('/api/admin/products')
        
        if (isMounted) {
          if (Array.isArray(response.data)) {
            // Transform the data to match our component's expected format
            const formattedProducts = response.data.map(product => ({
              id: product.id,
              name: product.name,
              sku_code: product.sku_code || "",
              price: parseFloat(product.price?.replace(/[₹,]/g, '')) || 0,
              gst_rate: product.tax_percentage || 0,
              size: product.sizes || "",
              stock: product.stock || 0,
              category: product.category || "",
              subcategory: product.subcategory || ""
            }))
            setProducts(formattedProducts)
          } else {
            // console.error('Invalid products data format:', response.data)
            setProducts([])
          }
        }
      } catch (error) {
        if (isMounted) {
          // console.error('Error fetching products:', error)
          toast.error('Failed to fetch products')
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setProductsLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true;

    const fetchVendors = async () => {
      try {
        setVendorsLoading(true)
        const response = await axios.get('/api/admin/vendors')
        
        if (isMounted) {
          if (response.data?.status === 'success' && Array.isArray(response.data.data.data)) {
            setVendors(response.data.data.data)
          } else {
            // console.error('Invalid vendors data format:', response.data)
            setVendors([])
          }
        }
      } catch (error) {
        if (isMounted) {
          if (error.response?.status === 401) {
            toast.error('Session expired. Please login again.')
            router.push('/login')
          } else if (error.response?.status === 403) {
            toast.error('You do not have permission to access this resource')
          } else if (error.response?.status === 500) {
            toast.error('Server error occurred. Please try again later')
          } else {
            toast.error('Failed to fetch vendors')
          }
          setVendors([])
        }
      } finally {
        if (isMounted) {
          setVendorsLoading(false)
        }
      }
    }

    fetchVendors()

    return () => {
      isMounted = false
    }
  }, [router])

  // Add a useEffect to monitor vendors state
  useEffect(() => {
    // console.log('Current vendors state:', vendors) // Debug vendors state
  }, [vendors])

  // Cleanup effect to clear all timers when component unmounts
  useEffect(() => {
    return () => {
      // Clear all search timers on unmount
      Object.values(skuSearchTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [skuSearchTimers]);

  const calculateSubTotal = () => {
    return purchaseItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.pricePerUnit) || 0;
      return sum + (quantity * price);
    }, 0);
  }

  const calculateGST = () => {
    return purchaseItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.pricePerUnit) || 0;
      const subtotal = quantity * price;
      const gstRate = parseFloat(item.gst) || 0;
      return sum + (subtotal * (gstRate / 100));
    }, 0);
  }

  const calculateTotal = () => {
    const subtotalAmount = calculateSubTotal();
    const gstAmount = calculateGST();
    const discountAmount = parseFloat(discount) || 0;
    return subtotalAmount + gstAmount - discountAmount;
  }

  const handleRemoveProduct = (id) => {
    setPurchaseItems(purchaseItems.filter((item) => item.id !== id))
    // Clear SKU search feedback for the removed item
    setSkuSearchFeedback(prev => {
      const newFeedback = { ...prev }
      delete newFeedback[id]
      return newFeedback
    })
    // Clear search timer for the removed item
    if (skuSearchTimers[id]) {
      clearTimeout(skuSearchTimers[id]);
    }
    setSkuSearchTimers(prev => {
      const newTimers = { ...prev }
      delete newTimers[id]
      return newTimers
    })
  }

  const handleAddProduct = () => {
    const newId = purchaseItems.length > 0 ? Math.max(...purchaseItems.map((i) => i.id)) + 1 : 1
    setPurchaseItems([
      ...purchaseItems,
      {
        id: newId,
        skuCode: "",
        productName: "",
        size: "",
        quantity: "",
        pricePerUnit: "",
        gst: "",
        totalCost: 0,
      },
    ])
    // Clear SKU search feedback for the new item
    setSkuSearchFeedback(prev => ({
      ...prev,
      [newId]: null
    }))
  }

  const handleProductChange = (id, field, value) => {
    // console.log(`handleProductChange called: id=${id}, field=${field}, value=`, value);
    
    setPurchaseItems(
      purchaseItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          
          // Calculate total cost
          if (field === "quantity" || field === "pricePerUnit" || field === "gst") {
            const quantity = parseFloat(updatedItem.quantity) || 0;
            const price = parseFloat(updatedItem.pricePerUnit) || 0;
            const subtotal = quantity * price;
            const gstRate = parseFloat(updatedItem.gst) || 0;
            const gstAmount = subtotal * (gstRate / 100);
            updatedItem.totalCost = subtotal + gstAmount;
          }
          
          // console.log("Updated item:", updatedItem);
          return updatedItem
        }
        return item
      })
    )
  }

  // Add new function to handle product selection
  const handleProductSelect = (itemId, productId) => {
    // console.log(`Product selected: itemId=${itemId}, productId=${productId}`);
    
    // Check if the special "add_new_product" option was selected
    if (productId === "add_new_product") {
      // Create the return URL
      const returnUrl = "/admin/dashboard/contact/vendors/add-purchase-entry";
      // console.log("Setting return URL to:", returnUrl);
      
      // Navigate to product creation page with autoReturn=true
      router.push(`/admin/dashboard/products/addproduct?returnUrl=${encodeURIComponent(returnUrl)}&autoReturn=true`);
      return;
    }
    
    // Find the selected product
    const selectedProduct = products.find(p => p.id === parseInt(productId));
    // console.log("Found selected product:", selectedProduct);
    
    if (!selectedProduct) {
      // console.error("Product not found!");
      return;
    }
    
    // Create a copy of the current purchase items
    const updatedItems = [...purchaseItems];
    
    // Find the item to update
    const itemIndex = updatedItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      // console.error("Item not found!");
      return;
    }
    
    // Update ONLY product name and SKU code
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      productName: selectedProduct.name,
      skuCode: selectedProduct.sku_code || "",
      // Store the selected product ID for the dropdown
      selectedProductId: productId
    };
    
    // Update the state with all changes at once
    // console.log("Setting purchase items to:", updatedItems);
    setPurchaseItems(updatedItems);
  }

  const handleVendorChange = (vendorId) => {
    try {
      // console.log('Selected vendor ID:', vendorId) // Debug log
      // console.log('Available vendors:', vendors) // Debug log
      const vendor = vendors.find(v => v.id === parseInt(vendorId))
      // console.log('Found vendor:', vendor) // Debug log
      if (vendor) {
        setSelectedVendor(vendor)
      } else {
        toast.error('Selected vendor not found')
      }
    } catch (error) {
      // console.error('Error selecting vendor:', error)
      toast.error('Error selecting vendor')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validate required fields
      if (!purchaseNumber) {
        toast.error('Please enter purchase number', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLoading(false);
        return;
      }

      if (!selectedVendor) {
        toast.error('Please select a vendor', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLoading(false);
        return;
      }

      if (purchaseItems.some(i => !i.productName || !i.quantity || !i.pricePerUnit)) {
        toast.error('Please fill in all required product details', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLoading(false);
        return;
      }

      // Prepare the data for submission
      const purchaseData = {
        vendor_id: selectedVendor.id,
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_no: purchaseNumber,
        products: purchaseItems.map(i => ({
          sku_code: i.skuCode,
          product_name: i.productName,
          size: i.size,
          quantity: i.quantity,
          unit_price: i.pricePerUnit,
          gst_rate: parseFloat(i.gst) || 0,
          total_cost: i.totalCost,
          product_id: parseInt(i.selectedProductId) || null, // Include product ID
          update_stock: true // Signal to update stock
        })),
        total_amount: calculateTotal(),
        gst_amount: calculateGST(),
        discount: parseFloat(discount) || 0,
        notes: '',
        update_inventory: true // Flag to indicate stock should be updated
      }

      const response = await axios.post('/api/admin/purchase-entries', purchaseData)
      
      if (response.data.status === 'success') {
        toast.success('Purchase entry created successfully', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        router.push('/admin/dashboard/contact/vendors');
      } else {
        throw new Error(typeof response.data.message === 'string' ? response.data.message : 'Failed to create purchase entry')
      }
    } catch (error) {
      // console.error('Error creating purchase entry:', error)
      let errorMsg = 'Failed to create purchase entry';
      if (error && typeof error.message === 'string') errorMsg = error.message;
      if (error && error.response && typeof error.response.data?.message === 'string') errorMsg = error.response.data.message;
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        router.push('/login')
      } else if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        if (validationErrors?.purchase_no) {
          toast.error(validationErrors.purchase_no[0], {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          toast.error('Please check your input data', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } else if (error.response?.status === 500) {
        toast.error('Server error occurred. Please try again later', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Add New Purchase Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Purchase Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="purchaseNumber">Purchase Number</Label>
              <Input 
                id="purchaseNumber"
                value={purchaseNumber}
                onChange={(e) => setPurchaseNumber(e.target.value)}
                placeholder="Enter Purchase Number"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input 
                id="purchaseDate" 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]}
                disabled
              />
            </div>
          </div>

          {/* Vendor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Select onValueChange={handleVendorChange} disabled={vendorsLoading}>
                <SelectTrigger id="vendorName">
                  <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Select Vendor"} />
                </SelectTrigger>
                <SelectContent>
                  {/* {console.log('Rendering vendors:', vendors)} Debug render */}
                  {vendors && vendors.length > 0 ? (
                    vendors.map((vendor) => {
                      // console.log('Rendering vendor item:', vendor) // Debug each vendor
                      return (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.vendor_name}
                        </SelectItem>
                      )
                    })
                  ) : (
                    <SelectItem value="none" disabled>
                      {vendorsLoading ? "Loading vendors..." : "No vendors available"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {selectedVendor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input 
                    id="contactPerson"
                    value={selectedVendor.contact_person_name}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input 
                    id="mobileNumber"
                    value={selectedVendor.phone_number}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailId">Email ID</Label>
                  <Input 
                    id="emailId"
                    value={selectedVendor.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input 
                    id="gstNumber"
                    value={selectedVendor.gst_number}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address"
                    value={`${selectedVendor.address_line1}, ${selectedVendor.city}, ${selectedVendor.district}, ${selectedVendor.state}, ${selectedVendor.country} - ${selectedVendor.pincode}`}
                    disabled
                  />
                </div>
              </>
            )}
          </div>

          {/* Product Details */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-pink-600 text-white rounded-t-lg">
                    <TableRow>
                      <TableHead className="text-white">SKU Code</TableHead>
                      <TableHead className="text-white">Product Name</TableHead>
                      <TableHead className="text-white">Quantity</TableHead>
                      <TableHead className="text-white">Price / Unit</TableHead>
                      <TableHead className="text-white">GST %</TableHead>
                      <TableHead className="text-white">Total Cost</TableHead>
                      <TableHead className="text-white">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-2">
                            <Input 
                              value={item.skuCode} 
                              className="w-full"
                              placeholder="Enter SKU to search"
                              onChange={(e) => {
                                const skuValue = e.target.value;
                                // Update the SKU code immediately
                                handleProductChange(item.id, 'skuCode', skuValue);
                                
                                // Clear any existing timer for this item
                                if (skuSearchTimers[item.id]) {
                                  clearTimeout(skuSearchTimers[item.id]);
                                }
                                
                                // Clear feedback when input is empty
                                if (skuValue.trim() === '') {
                                  setSkuSearchFeedback(prev => ({
                                    ...prev,
                                    [item.id]: null
                                  }));
                                  return;
                                }
                                
                                // Set a timer to search after user stops typing (500ms delay)
                                const timer = setTimeout(() => {
                                  const filtered = products.filter(product => 
                                    product.sku_code.toLowerCase() === skuValue.toLowerCase()
                                  );
                                  
                                  if (filtered.length > 0) {
                                    // Auto-select the first matching product
                                    const matchedProduct = filtered[0];
                                    handleProductSelect(item.id, matchedProduct.id.toString());
                                    // Show success feedback below input
                                    setSkuSearchFeedback(prev => ({
                                      ...prev,
                                      [item.id]: { type: 'success', message: `Product found: ${matchedProduct.name}` }
                                    }));
                                  } else {
                                    // Show no results feedback below input
                                    setSkuSearchFeedback(prev => ({
                                      ...prev,
                                      [item.id]: { type: 'error', message: 'No product found with this SKU code' }
                                    }));
                                  }
                                }, 500); // 500ms delay
                                
                                // Store the timer reference
                                setSkuSearchTimers(prev => ({
                                  ...prev,
                                  [item.id]: timer
                                }));
                              }}
                            />
                            {/* Feedback message below input */}
                            {skuSearchFeedback[item.id] && (
                              <div className={`text-xs px-2 py-1 rounded ${
                                skuSearchFeedback[item.id].type === 'success' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : skuSearchFeedback[item.id].type === 'error'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-blue-100 text-blue-700 border border-blue-200'
                              }`}>
                                {skuSearchFeedback[item.id].message}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.selectedProductId || ""}
                            onValueChange={(value) => handleProductSelect(item.id, value)}
                            disabled={productsLoading}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={productsLoading ? "Loading products..." : "Select Product"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {products && products.length > 0 ? (
                                products.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-xs text-gray-500">
                                        SKU: {product.sku_code} | Price: ₹{product.price} | Stock: {product.stock}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  {productsLoading ? "Loading products..." : "No products available"}
                                </SelectItem>
                              )}
                              <SelectItem 
                                value="add_new_product" 
                                className="text-pink-600 font-semibold border-t mt-1 pt-1"
                              >
                                + New Product
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => handleProductChange(item.id, 'quantity', e.target.value)} 
                            className="w-20"
                            placeholder="Qty"
                            min="1"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => handleProductChange(item.id, 'pricePerUnit', e.target.value)}
                            className="w-24"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            value={item.gst} 
                            onChange={(e) => handleProductChange(item.id, 'gst', e.target.value)} 
                            className="w-20"
                            placeholder="GST %"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={item.totalCost ? `₹${parseFloat(item.totalCost).toFixed(2)}` : ''} 
                            className="w-24" 
                            readOnly 
                            disabled
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 h-8 w-8"
                              onClick={() => handleRemoveProduct(item.id)}
                              disabled={purchaseItems.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleAddProduct}
                    className="border border-pink-600 text-white bg-pink-600 hover:bg-pink-700 w-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Products
                  </Button>
                </div>

                <div className="flex justify-end">
                  <Card className="w-full md:w-72">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Sub Total</span>
                          <span>₹{calculateSubTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Amount</span>
                          <span>₹{calculateGST().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discounts</span>
                          <div className="flex items-center">
                            <span className="mr-1">₹</span>
                            <Input
                              type="number"
                              value={discount}
                              onChange={(e) => setDiscount(e.target.value)}
                              className="w-20 h-8 text-right"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                          <span>Total(₹)</span>
                          <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button 
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            className="bg-pink-600 hover:bg-pink-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}

export default PurchaseEntryForm
