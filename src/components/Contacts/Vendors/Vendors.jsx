"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Eye, CirclePlus, CheckCircle ,ChevronLeft,ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import axios from "../../../lib/axios"
import { toast } from 'react-toastify'

const Vendors = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVendors, setSelectedVendors] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState({
    vendorName: true,
    contactPerson: true,
    phoneNumber: true,
    category: true,
    lastPurchaseDate: true,
    totalOrders: true,
    totalAmount: true,
    actions: true,
  })
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchVendors()
  }, [currentPage, searchQuery, statusFilter])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/admin/vendors', {
        params: {
          page: currentPage,
          per_page: itemsPerPage,
          search: searchQuery || null,
          status: statusFilter === 'all' ? null : statusFilter
        }
      })

      if (response.data.status === 'success') {
        setVendors(response.data.data.data)
        setTotalPages(response.data.data.last_page)
      } else {
        toast.error('Failed to fetch vendors')
      }
    } catch (error) {
      // console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
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

  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), "PPP")
  }

  // Page change handler
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search vendors..." 
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <div className="flex gap-2 relative">
            <Button
              variant="outline" 
              size="icon"
              onClick={() => setShowColumnFilter(!showColumnFilter)}
              className="w-10 h-10 bg-[#eb1c75] text-white"
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
       
          <Link href="/admin/dashboard/contact/vendors/create-vendor" className="flex items-center gap-2">
            <Button className="bg-[#eb1c75] hover:bg-pink-600 text-white w-full sm:w-auto">
              Create Vendor <CirclePlus size={18} className="mr-2" /> 
            </Button>
          </Link>
          <Link href="/admin/dashboard/contact/vendors/add-purchase-entry" className="flex items-center gap-2">
            <Button className="bg-[#eb1c75] hover:bg-pink-600 text-white w-full sm:w-auto">
              <CirclePlus size={18} className="mr-2" /> Add Purchase Entry
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-[#eb1c75]">
            <TableRow>
              {visibleColumns.vendorName && <TableHead className="text-white text-center">Vendor Name</TableHead>}
              {visibleColumns.contactPerson && <TableHead className="text-white text-center">Contact Person</TableHead>}
              {visibleColumns.phoneNumber && <TableHead className="text-white text-center">Phone Number</TableHead>}
              {visibleColumns.category && <TableHead className="text-white text-center">Category</TableHead>}
              {visibleColumns.lastPurchaseDate && <TableHead className="text-white text-center">Last Purchase Date</TableHead>}
              {visibleColumns.totalOrders && <TableHead className="text-white text-center">Total Orders</TableHead>}
              {visibleColumns.totalAmount && <TableHead className="text-white text-center">Total Amount Spent</TableHead>}
              {visibleColumns.actions && <TableHead className="text-white text-center">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                    <span className="ml-2">Loading vendors...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : vendors.length > 0 ? (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  {visibleColumns.vendorName && <TableCell className="text-center">{vendor.vendor_name}</TableCell>}
                  {visibleColumns.contactPerson && <TableCell className="text-center">{vendor.contact_person_name}</TableCell>}
                  {visibleColumns.phoneNumber && <TableCell className="text-center">{vendor.phone_number}</TableCell>}
                  {visibleColumns.category && <TableCell className="text-center">{vendor.category || 'N/A'}</TableCell>}
                  {visibleColumns.lastPurchaseDate && (
                    <TableCell className="text-center">{formatDate(vendor.last_purchase_date)}</TableCell>
                  )}
                  {visibleColumns.totalOrders && (
                    <TableCell className="text-center">
                      {parseInt(vendor.total_orders || 0)}
                    </TableCell>
                  )}
                  {visibleColumns.totalAmount && (
                    <TableCell className="text-center">
                      ₹{(vendor.total_amount || 0).toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                        useGrouping: true
                      })}
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/dashboard/contact/vendors/view/${vendor.id}`}>
                            <Eye className="h-6 w-6 text-pink-400" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/dashboard/contact/vendors/edit/${vendor.id}`}>
                            <Pencil className="h-6 w-6 text-pink-600" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No vendors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendors