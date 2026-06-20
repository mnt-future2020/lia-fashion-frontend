"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "../../../lib/axios"

const ViewPurchaseEntry = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const purchaseNo = searchParams.get("purchaseNo")
  // console.log('purchaseNo from URL:', purchaseNo)

  const [vendor, setVendor] = useState(null)
  const [purchase, setPurchase] = useState(null)
  const [products, setProducts] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    
    const fetchData = async () => {
  
      try {
        setLoading(true)
        const res = await axios.get(`/api/admin/purchase-entries/${purchaseNo}`)
        if (res.data.status === 'success') {
          setPurchase(res.data.data)
          setVendor(res.data.data.vendor)
          
          // Check if detailed items are available from API
          if (res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
            // Use the detailed items returned from the API
            let calculatedSubtotal = 0;
            let calculatedTaxTotal = 0;
            
            const formattedItems = res.data.items.map(item => {
              const qty = parseFloat(item.quantity) || 0;
              const price = parseFloat(item.unit_price) || 0;
              const gstRate = parseFloat(item.gst_rate) || 0;
              const itemSubtotal = qty * price;
              const itemTax = itemSubtotal * (gstRate / 100);
              
              calculatedSubtotal += itemSubtotal;
              calculatedTaxTotal += itemTax;
              
              return {
                name: item.product_name,
                size: item.size,
                quantity: qty,
                unitPrice: price,
                subtotal: itemSubtotal,
                gstRate: gstRate,
                taxAmount: itemTax,
                total: itemSubtotal + itemTax
              };
            });
            
            setProducts(formattedItems);
            setSubtotal(calculatedSubtotal);
            setTaxAmount(calculatedTaxTotal);
            
          } else {
            // Fallback to parsing comma-separated values
            const productNames = res.data.data.product_name.split(', ');
            const quantities = res.data.data.quantity.split(', ');
            const unitPrices = res.data.data.unit_price.split(', ');
            
            // Calculate subtotal and tax
            let calculatedSubtotal = 0;
            
            const parsedProducts = productNames.map((name, index) => {
              // Ensure proper conversion of strings to numbers
              const qty = parseFloat(quantities[index]) || 0;
              const price = parseFloat(unitPrices[index]) || 0;
              const itemSubtotal = qty * price;
              
              // Assume a standard GST rate if not available
              const gstRate = 18;
              const itemTax = itemSubtotal * (gstRate / 100);
              
              calculatedSubtotal += itemSubtotal;
              
              return {
                name,
                quantity: qty,
                unitPrice: price,
                subtotal: itemSubtotal,
                size: 'M', // Default size if not available
                gstRate: gstRate,
                taxAmount: itemTax,
                total: itemSubtotal + itemTax
              };
            });
            
            // Calculate the tax amount from the total and subtotal
            const discount = parseFloat(res.data.data.discount) || 0;
            const totalCost = parseFloat(res.data.data.total_cost) || 0;
            const calculatedTax = totalCost + discount - calculatedSubtotal;
            
            setProducts(parsedProducts);
            setSubtotal(calculatedSubtotal);
            setTaxAmount(calculatedTax > 0 ? calculatedTax : 0);
          }
        } else {
          setPurchase(null)
          setVendor(null)
        }
      } catch (err) {
        setPurchase(null)
        setVendor(null)
      } finally {
        setLoading(false)
      }
    }
    if (purchaseNo) fetchData()
  }, [purchaseNo])

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }
  if (!vendor || !purchase) {
    return <div className="text-center p-8 text-gray-500">Purchase entry not found</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">View Purchase Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Purchase Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Purchase Number</Label>
            <Input 
              value={purchase.purchase_no}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Input 
              value={purchase.purchase_date}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
        </div>

        {/* Vendor Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Vendor Name</Label>
            <Input 
              value={vendor.vendor_name}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input 
              value={vendor.contact_person_name}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <Input 
              value={vendor.phone_number}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label>Email ID</Label>
            <Input 
              value={vendor.email}
              disabled
              className="w-full bg-gray-50"
            />
          </div>
        </div>

        {/* Product Details */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-pink-600">
                <TableRow>
                  <TableHead className="text-white">Product Name</TableHead>
                  <TableHead className="text-white">Size</TableHead>
                  <TableHead className="text-white">Quantity</TableHead>
                  <TableHead className="text-white">Unit Price</TableHead>
                  <TableHead className="text-white">Subtotal</TableHead>
                  <TableHead className="text-white">GST Rate</TableHead>
                  <TableHead className="text-white">GST Amount</TableHead>
                  <TableHead className="text-white">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>₹{product.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>₹{product.subtotal.toFixed(2)}</TableCell>
                    <TableCell>{product.gstRate}%</TableCell>
                    <TableCell>₹{product.taxAmount.toFixed(2)}</TableCell>
                    <TableCell>₹{product.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
                  <TableCell colSpan={4}>₹{subtotal.toFixed(2)}</TableCell>
                </TableRow>
                {taxAmount > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">
                      GST Amount
                    </TableCell>
                    <TableCell colSpan={4}>₹{taxAmount.toFixed(2)}</TableCell>
                  </TableRow>
                )}
                {parseFloat(purchase.discount) > 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-medium">Discount</TableCell>
                    <TableCell colSpan={4}>-₹{parseFloat(purchase.discount).toFixed(2)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-gray-100 font-medium">
                  <TableCell colSpan={4} className="text-right font-medium">Total</TableCell>
                  <TableCell colSpan={4}>₹{parseFloat(purchase.total_cost).toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </CardContent>

      <div className="flex justify-end p-6">
        <Button 
          variant="outline"
          onClick={handleBack}
          className="border-pink-600 text-pink-600 hover:bg-pink-50"
        >
          Back
        </Button>
      </div>
    </Card>
  )
}

export default ViewPurchaseEntry