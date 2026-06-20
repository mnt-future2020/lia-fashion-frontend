"use client"

import { useEffect, useState } from "react"
import { BookUser, Phone, Mail, MapPin, Eye, SquarePen, Search, CalendarIcon, SlidersHorizontal, Plus, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "../../../lib/axios"
import { toast } from 'react-toastify'
import { format } from "date-fns"

const VendorPopoverContent = ({ vendor }) => {
  return (
    <Card className="border-none shadow-none">
      <CardContent className="space-y-4 p-4">
        {/* Vendor Profile Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{vendor.vendor_name}</h3>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-8 w-8 text-[#eb1c75] hover:bg-pink-100"
          >
            <Link href={`/admin/dashboard/contact/vendors/edit/${vendor.id}`}>
              <SquarePen className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Vendor Basic Info */}
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-[#eb1c75]">
                  {vendor.vendor_name.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-base">{vendor.vendor_name}</h4>
                <p className="text-sm text-gray-500">ID: {vendor.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="p-4">
          <CardContent className="space-y-3 p-0">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#eb1c75] flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm">{vendor.phone_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#eb1c75] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm">{vendor.email}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-[#eb1c75] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm">{vendor.address_line1}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm">{vendor.city},</p>
                    <p className="text-sm">{vendor.state},</p>
                    <p className="text-sm">{vendor.country},</p>
                    <p className="text-sm">{vendor.pincode}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Details */}
        <Card className="p-4">
          <CardContent className="p-0">
            <h4 className="text-sm font-medium mb-2">Other Details</h4>
            <div className="grid gap-4">
              <div>
                <p className="text-xs text-gray-500">Contact Person Name</p>
                <p className="text-sm">{vendor.contact_person_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">GST Number</p>
                <p className="text-sm">{vendor.gst_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm">{vendor.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm capitalize">{vendor.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

const ViewVendor = ({ id }) => {
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState({
    from: undefined,
    to: undefined
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    purchaseNo: true,
    purchaseDate: true,
    productName: true,
    quantity: true,
    totalCost: true,
    actions: true,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchVendor()
  }, [id])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/admin/vendors/${id}`)
      if (response.data.status === 'success') {
        setVendor(response.data.data)
      } else {
        toast.error('Failed to fetch vendor details')
      }
    } catch (error) {
      // console.error('Error fetching vendor:', error)
      if (error.response?.status === 404) {
        toast.error('Vendor not found')
      } else {
        toast.error('Failed to fetch vendor details')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleColumn = (columnName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }))
  }

  const handleViewPurchase = (purchase) => {
    router.push(`/admin/dashboard/contact/vendors/purchase/view/${vendor.id}?purchaseNo=${purchase.purchase_no}`)
  }

  const filterByDate = (purchase) => {
    if (!selectedDate.from) return true
    
    const purchaseDate = new Date(purchase.purchase_date)
    
    if (selectedDate.to) {
      return purchaseDate >= selectedDate.from && purchaseDate <= selectedDate.to
    } else {
      return purchaseDate.toDateString() === selectedDate.from.toDateString()
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
        <span className="ml-2">Loading vendor details...</span>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">Vendor not found</p>
        <Button onClick={handleBack} className="bg-[#eb1c75] hover:bg-pink-600 text-white">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold text-[#eb1c75] flex items-center gap-2">
            <Dialog>
              <DialogTrigger>
                <BookUser className="w-10 h-10 p-2 rounded bg-[#eb1c75] text-white cursor-pointer hover:bg-pink-500" />
              </DialogTrigger>
              <DialogContent className="w-[350px] sm:w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Vendor Profile</DialogTitle>
                </DialogHeader>
                <VendorPopoverContent vendor={vendor} />
              </DialogContent>
            </Dialog>
            {vendor.vendor_name}
          </CardTitle>
          
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-pink-600 text-pink-600 hover:bg-pink-50"
          >
            Back
          </Button>
        </CardHeader>
        <CardContent>
          {/* Controls Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                  placeholder="Search purchases..." 
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {/* <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "w-10 h-10 bg-[#eb1c75] hover:bg-pink-400 text-white",
                      selectedDate.from && "bg-pink-700"
                    )}
                  >
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={selectedDate.from}
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    numberOfMonths={2}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2000-01-01")
                    }
                  />
                </PopoverContent>
              </Popover> */}

              <Button
                variant="outline" 
                size="icon"
                onClick={() => setShowColumnFilter(!showColumnFilter)}
                className="w-10 h-10 bg-[#eb1c75] hover:bg-pink-600 text-white"
              >
                <SlidersHorizontal className="h-5 w-5 text-white" />
              </Button>
              
              {showColumnFilter && (
                <div className="absolute right-0 mt-12 sm:mt-10 w-56 bg-white rounded-md shadow-lg z-50 border">
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-600 mb-2 px-2">Show/Hide Columns</div>
                    {Object.entries(visibleColumns).map(([column, isVisible]) => (
                      <button
                        key={column}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center justify-between ${
                          isVisible ? 'text-pink-600' : 'text-gray-600'
                        }`}
                        onClick={() => toggleColumn(column)}
                      >
                        {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, ' $1')}
                        {isVisible && <CheckCircle className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader className="bg-[#eb1c75]">
              <TableRow>
                {visibleColumns.purchaseNo && <TableHead className="text-white">Purchase No</TableHead>}
                {visibleColumns.productName && <TableHead className="text-white">Product Name</TableHead>}
                {visibleColumns.purchaseDate && <TableHead className="text-white">Purchase Date</TableHead>}
                {visibleColumns.quantity && <TableHead className="text-white text-center">Quantity</TableHead>}
                {visibleColumns.totalCost && <TableHead className="text-white text-center">Total Cost</TableHead>}
                {visibleColumns.actions && <TableHead className="text-white text-center">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendor.purchase_entries && vendor.purchase_entries.length > 0 ? (
                vendor.purchase_entries
                  .filter(purchase => {
                    const matchesSearch = searchQuery === "" || 
                      purchase.product_name.toLowerCase().includes(searchQuery.toLowerCase())
                    const matchesDate = filterByDate(purchase)
                    return matchesSearch && matchesDate
                  })
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((purchase) => (
                    <TableRow key={purchase.id}>
                      {visibleColumns.purchaseNo && <TableCell>{purchase.purchase_no}</TableCell>}
                      {visibleColumns.productName && <TableCell>{purchase.product_name}</TableCell>}
                      {visibleColumns.purchaseDate && (
                        <TableCell>{format(new Date(purchase.purchase_date), 'PPP')}</TableCell>
                      )}
                      {visibleColumns.quantity && <TableCell className="text-center">{purchase.quantity}</TableCell>}
                      {visibleColumns.totalCost && (
                        <TableCell className="text-center">
                          ₹{Number(purchase.total_cost).toLocaleString('en-IN')}
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Eye 
                              className="w-4 h-4 text-[#eb1c75] cursor-pointer hover:text-pink-400" 
                              onClick={() => handleViewPurchase(purchase)}
                            />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No purchase entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {vendor.purchase_entries && vendor.purchase_entries.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, vendor.purchase_entries.length)} to{" "}
                {Math.min(currentPage * itemsPerPage, vendor.purchase_entries.length)} of{" "}
                {vendor.purchase_entries.length} entries
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </Button>
                {Array.from({ length: Math.ceil(vendor.purchase_entries.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 w-8",
                      currentPage === page && "bg-pink-500 hover:bg-pink-600"
                    )}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(vendor.purchase_entries.length / itemsPerPage)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ViewVendor