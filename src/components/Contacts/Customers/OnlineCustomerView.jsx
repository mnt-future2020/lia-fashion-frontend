"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Pencil, Save, ChevronLeft, ChevronRight, ShoppingBag, CheckCircle, XCircle, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import axios from '../../../lib/axios'

export default function CustomerView({ id }) {
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [searchOrder, setSearchOrder] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [customerStats, setCustomerStats] = useState({
    totalOrder: 0,
    completedOrder: 0,
    canceled: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/admin/users/${id}`)
        if (response.data) {
          setCustomer(response.data)
        } else {
          router.push("/admin/dashboard/contact/customer")
        }
      } catch (error) {
        // console.error('Error fetching customer data:', error)
        router.push("/admin/dashboard/contact/customer")
      } finally {
        setLoading(false)
      }
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/api/admin/users/${id}/orders`);
        setOrders(res.data?.orders || []);
      } catch (error) {
        setOrders([]);
      }
    };

    const fetchStats = async () => {
      try {
        const res = await axios.get(`/api/admin/users/${id}/order-stats`);
        setCustomerStats(res.data);
      } catch {
        setCustomerStats({
          totalOrder: 0,
          completedOrder: 0,
          canceled: 0,
          totalSpent: 0
        });
      }
    };

    fetchCustomerData();
    fetchOrders();
    fetchStats();
  }, [id, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb1c75]"></div>
      </div>
    )
  }

  if (!customer) return null

  // Add this after the orders array and before pagination calculations
  const filteredOrders = orders.filter(order => {
    const searchLower = searchOrder.toLowerCase()
    return (
      order.id?.toString().toLowerCase().includes(searchLower) ||
      order.item?.toString().toLowerCase().includes(searchLower) ||
      order.amount?.toString().toLowerCase().includes(searchLower) ||
      order.payment?.toString().toLowerCase().includes(searchLower) ||
      order.status?.toString().toLowerCase().includes(searchLower)
    )
  })

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  // Generate page numbers
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Add search handler function
  const handleSearch = (e) => {
    setSearchOrder(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 p-2 sm:p-4 lg:p-6 ">
      {/* Header Card */}
      {/* <Card className="border-0">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/admin/dashboard/contact/customer")}
              className="flex items-center text-white bg-pink-600 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Active/Inactive</span>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Content Section */}
      <div className="p-2 sm:p-4 lg:p-6 space-y-6">
        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg lg:text-xl font-semibold">Statistics</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
              <div className="bg-white border border-pink-200 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-pink-500 text-xs sm:text-sm md:text-base font-medium mb-1">
                      Total Order
                    </h3>
                    <p className="text-black text-base sm:text-lg md:text-xl font-bold">
                      {customerStats.totalOrder}
                    </p>
                  </div>
                  <div className="bg-pink-100 p-2 sm:p-3 rounded-md">
                    <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-green-200 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-green-500 text-xs sm:text-sm md:text-base font-medium mb-1">
                      Completed Order
                    </h3>
                    <p className="text-black text-base sm:text-lg md:text-xl font-bold">
                      {customerStats.completedOrder}
                    </p>
                  </div>
                  <div className="bg-green-100 p-2 sm:p-3 rounded-md">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-red-200 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-red-500 text-xs sm:text-sm md:text-base font-medium mb-1">
                      Canceled
                    </h3>
                    <p className="text-black text-base sm:text-lg md:text-xl font-bold">
                      {customerStats.canceled}
                    </p>
                  </div>
                  <div className="bg-red-100 p-2 sm:p-3 rounded-md">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-pink-200 rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-pink-500 text-xs sm:text-sm md:text-base font-medium mb-1">
                      Total Spent
                    </h3>
                    <p className="text-black text-base sm:text-lg md:text-xl font-bold">
                      ₹{customerStats.totalSpent}
                    </p>
                  </div>
                  <div className="bg-pink-100 p-2 sm:p-3 rounded-md">
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile, Personal Info, and Address Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pt-6">
              <h2 className="text-lg sm:text-xl font-semibold">Profile</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-36 h-36 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  {customer.details?.profile_image ? (
                    <img 
                      src={customer.details.profile_image} 
                      alt={customer.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl font-semibold text-pink-600">
                      {customer.name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">{customer.name}</h2>
                  <p className="text-gray-600">{customer.email}</p>
                  <Badge variant="secondary">ID: {customer.id}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold">Personal Information</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium w-32 inline-block"> Contact:</span>
                  <span className="ml-2">{customer.phone}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Alternative:</span>
                  <span className="ml-2">{customer.details?.alt_phone || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Email:</span>
                  <span className="ml-2">{customer.email}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Gender:</span>
                  <span className="ml-2">{customer.details?.gender || 'Not specified'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Date of Birth:</span>
                  <span className="ml-2">{formatDate(customer.details?.dob)}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Member Since:</span>
                  <span className="ml-2">{formatDate(customer.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold">Shipping Address</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="font-medium w-32">Address:</span>
                  <span className="ml-2 break-words">{customer.details?.address1 || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">City:</span>
                  <span className="ml-2">{customer.details?.city || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">District:</span>
                  <span className="ml-2">{customer.details?.district || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">State:</span>
                  <span className="ml-2">{customer.details?.state || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Country:</span>
                  <span className="ml-2">{customer.details?.country || '-'}</span>
                </div>
                <div>
                  <span className="font-medium w-32 inline-block">Pincode:</span>
                  <span className="ml-2">{customer.details?.pincode || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order History Card */}
        <Card>
          <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <h2 className="text-lg lg:text-xl font-semibold">Order History</h2>
            <div className="relative w-full lg:w-72">
              <Input
                placeholder="Search by order id"
                value={searchOrder}
                onChange={handleSearch}
                className="pl-8"
              />
              <Search className="h-4 w-4 absolute left-2 top-3 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 lg:mx-0">
              <Table className="min-w-full">
                <TableHeader className="bg-pink-600 text-white">
                  <TableRow>
                    <TableHead className="text-center text-white">Order ID</TableHead>
                    <TableHead className="text-center text-white">Order Date</TableHead>
                    <TableHead className="text-center text-white">Items Ordered</TableHead>
                    <TableHead className="text-center text-white">Total Amount</TableHead>
                    <TableHead className="text-center text-white">Payment Method</TableHead>
                    <TableHead className="text-center text-white">Order Status</TableHead>
                    <TableHead className="text-center text-white">Delivery Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrders.map((order) => {
                    let itemName = "-";
                    let deliveryDate = order.delivered_at ? formatDate(order.delivered_at) : "-";
                    // Prefer server-related items if present
                    if (Array.isArray(order.items) && order.items.length > 0) {
                      itemName = order.items.map(i => `${i?.product?.name || 'Item'} (x${i?.quantity || 0})`).join(", ");
                    } else {
                      // Fallback to items embedded in shipping_address JSON (older orders)
                      try {
                        const shipping = order.shipping_address ? JSON.parse(order.shipping_address) : null;
                        if (shipping?.order_items?.length > 0) {
                          itemName = shipping.order_items.map(i => `${i.name} (x${i.quantity})`).join(", ");
                        }
                      } catch {}
                    }
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="text-center">{order.order_number}</TableCell>
                        <TableCell className="text-center">{formatDate(order.created_at)}</TableCell>
                        <TableCell className="text-center">{itemName}</TableCell>
                        <TableCell className="text-center">₹{order.total_amount}</TableCell>
                        <TableCell className="text-center">{order.payment_status}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{deliveryDate}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-between mt-4 gap-4">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
              </div>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    variant={currentPage === number ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 ${
                      currentPage === number ? "bg-pink-500 hover:bg-pink-600" : ""
                    }`}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </Button>
                ))}
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}