"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Search, Eye, Download } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import axios from '../../../lib/axios'  
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Add a helper function for amount formatting
const formatAmount = (amount) => {
  // console.log('Raw amount value:', amount, 'Type:', typeof amount) // Debug log
  if (amount === null || amount === undefined) return '0.00';
  
  // Handle string amounts with currency symbol
  if (typeof amount === 'string') {
    // Remove currency symbol and commas
    const cleanAmount = amount.replace(/[₹,]/g, '');
    const numAmount = parseFloat(cleanAmount);
    if (isNaN(numAmount)) return '0.00';
    return numAmount.toFixed(2);
  }
  
  // Handle number amounts
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(numAmount)) return '0.00';
  return numAmount.toFixed(2);
};

// Add a helper function for safe number formatting
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

// Add formatDate helper function at the top
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const OfflineCustomers = () => {
  // Add search state with localStorage persistence
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('offlineCustomers_searchTerm')
      return saved || ""
    }
    return ""
  })
  
  // Add pagination states with localStorage persistence
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('offlineCustomers_currentPage')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [itemsPerPage] = useState(10)

  // Add states for customer data and loading
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add states for order details dialog
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offlineCustomers_currentPage', currentPage.toString())
    }
  }, [currentPage])

  // Save search term to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('offlineCustomers_searchTerm', searchTerm)
    }
  }, [searchTerm])

  // Fetch customers data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/admin/pos/customers')
        // console.log('API Response:', response.data) // Debug log
        setCustomers(response.data)
        setError(null)
      } catch (err) {
        // console.error('Error fetching customers:', err)
        setError('Failed to load customers data')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  // Function to fetch customer orders
  const fetchCustomerOrders = async (phone) => {
    try {
      setLoadingOrders(true)
      const response = await axios.get(`/api/admin/pos/customers/${phone}/orders`)
      // console.log('Order Details Response:', response.data) // Debug log
      if (response.data.status === 'success') {
        setOrderDetails(response.data.data)
        setOrderDialogOpen(true)
      } else {
        alert('Failed to load customer orders')
      }
    } catch (err) {
      // console.error('Error fetching customer orders:', err)
      alert('Failed to load customer orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  // Function to download customer order history
  const downloadOrderHistory = (customer) => {
    if (!customer.orderItems || customer.orderItems.length === 0) {
      alert('No order history available for this customer')
      return
    }

    // Calculate totals
    const totalItems = customer.orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    const totalTax = customer.orderItems.reduce((sum, item) => sum + Number(item.tax_amount), 0)
    const totalAmount = customer.orderItems.reduce((sum, item) => 
      sum + Number(item.price) + Number(item.tax_amount), 0
    )

    // Create PDF document
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(20)
    doc.text('Customer Order History', 14, 20)
    
    // Add customer details
    doc.setFontSize(12)
    doc.text(`Customer Name: ${customer.name || 'Walk-in Customer'}`, 14, 30)
    doc.text(`Phone Number: ${customer.phone || '-'}`, 14, 35)
    
    // Add order details table
    const orderItems = customer.orderItems.map(item => [
      new Date(item.created_at).toLocaleDateString(),
      item.product_name,
      item.quantity,
      `Rs. ${formatNumber(item.price)}`,
      `Rs. ${formatNumber(item.tax_amount)}`,
      `Rs. ${formatNumber(Number(item.price) + Number(item.tax_amount))}`
    ])

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Product', 'Quantity', 'Price', 'Tax Value', 'Total']],
      body: orderItems,
      theme: 'grid',
      headStyles: { fillColor: [235, 28, 117] }, // Pink color matching the theme
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    })

    // Add purchase summary
    const summaryY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.text('Purchase Summary', 14, summaryY)
    
    doc.setFontSize(12)
    doc.text(`Total Orders: ${customer.orderItems.length}`, 14, summaryY + 10)
    doc.text(`Total Items: ${totalItems}`, 14, summaryY + 20)
    doc.text(`Total Tax Paid: Rs. ${formatNumber(totalTax)}`, 14, summaryY + 30)
    doc.text(`Total Amount: Rs. ${formatNumber(totalAmount)}`, 14, summaryY + 40)

    // Save the PDF
    doc.save(`order_history_${customer.phone || 'customer'}.pdf`)
  }

  // Filter data based on search
  const filteredCustomers = customers.filter(customer => {
    // console.log('Filtering customer:', customer) // Debug log
    return (
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatAmount(customer.amount).includes(searchTerm) ||
      customer.order_date?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const totalItems = filteredCustomers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem)

  // Handle search change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-semibold">Offline Customers</h2>
            
            {/* Search and Filter Section */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-md w-full max-w-md focus:outline-none focus:ring-1 focus:ring-[#eb1c75]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb1c75]"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-[#eb1c75]">
                    <TableRow>
                      <TableHead className="text-white font-medium text-center">Name</TableHead>
                      <TableHead className="text-white font-medium hidden md:table-cell text-center">Phone Number</TableHead>
                      <TableHead className="text-white font-medium hidden sm:table-cell text-center">Email ID</TableHead>
                      <TableHead className="text-white font-medium text-center">Total Amount (₹)</TableHead>
                      <TableHead className="text-white font-medium hidden lg:table-cell text-center">Order Date</TableHead>
                      <TableHead className="text-white font-medium text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((customer) => {
                      // console.log('Rendering customer:', customer) // Debug log
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="text-center">{customer.name || 'Walk-in Customer'}</TableCell>
                          <TableCell className="hidden md:table-cell text-center">{customer.phone || '-'}</TableCell>
                          <TableCell className="hidden sm:table-cell text-center">{customer.email || '-'}</TableCell>
                          <TableCell className="text-center">₹{formatAmount(customer.amount)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-center">
                            {customer.order_date ? formatDate(customer.order_date) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => fetchCustomerOrders(customer.phone)}
                                disabled={!customer.phone}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => downloadOrderHistory(customer)}
                                disabled={!customer.orderItems?.length}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </div>
          
                <div className="flex items-center space-x-2">
                  {totalPages > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
          
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all page numbers
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near the start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // If near the end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show current page and 2 pages before and after
                          pageNum = currentPage - 2 + i;
                        }
          
                        return (
                          <Button
                            key={i}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 ${
                              currentPage === pageNum ? "bg-pink-500 text-white" : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
          
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Customer Order History</DialogTitle>
          </DialogHeader>
          {loadingOrders ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb1c75]"></div>
            </div>
          ) : orderDetails ? (
            <div className="mt-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{orderDetails.name || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{orderDetails.phone || '-'}</p>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Tax Value</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.orderItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-right">{formatDate(item.created_at)}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{formatNumber(item.price)}</TableCell>
                        <TableCell className="text-right">₹{formatNumber(item.tax_amount)}</TableCell>
                        <TableCell className="text-right font-medium">₹{formatNumber(Number(item.price) + Number(item.tax_amount))}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-medium">
                      <TableCell colSpan={5} className="text-right">Total Amount:</TableCell>
                      <TableCell className="text-right">₹{formatNumber(
                        orderDetails.orderItems?.reduce((sum, item) => 
                          sum + Number(item.price) + Number(item.tax_amount), 0
                        ) || 0
                      )}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Customer Purchase Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Customer Purchase Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-xl font-semibold">{orderDetails.orderItems?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-xl font-semibold">
                      {orderDetails.orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Tax Paid</p>
                    <p className="text-xl font-semibold">₹{formatNumber(
                      orderDetails.orderItems?.reduce((sum, item) => sum + Number(item.tax_amount), 0) || 0
                    )}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-semibold">₹{formatNumber(
                      orderDetails.orderItems?.reduce((sum, item) => 
                        sum + Number(item.price) + Number(item.tax_amount), 0
                      ) || 0
                    )}</p>
                  </div>
                </div>

                {/* Additional Purchase Details */}
                <div className="mt-4">
                  {/* <div className="p-3 bg-white rounded-lg shadow">
                    <p className="text-sm text-gray-500 mb-2">Last Purchase Date</p>
                    <p className="text-xl font-semibold">
                      {orderDetails.orderItems?.length ? 
                        new Date(Math.max(...orderDetails.orderItems.map(item => new Date(item.created_at)))).toLocaleDateString() 
                        : 'No purchases'}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">No order history available</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OfflineCustomers
