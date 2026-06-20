"use client"

import { useState, useEffect } from "react"
import { Eye, Edit, ChevronLeft, ChevronRight, Search, ChevronDown, SlidersHorizontal, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import axios from '../../../lib/axios'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu"

const OnlineCustomers = () => {
  // Add states for search and filter with localStorage persistence
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onlineCustomers_searchTerm')
      return saved || ""
    }
    return ""
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [showFilter, setShowFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('onlineCustomers_currentPage')
      return saved ? parseInt(saved) : 1
    }
    return 1
  })
  const [itemsPerPage] = useState(10)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onlineCustomers_currentPage', currentPage.toString())
    }
  }, [currentPage])

  // Save search term to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onlineCustomers_searchTerm', searchTerm)
    }
  }, [searchTerm])

  // Fetch customers data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/admin/users')
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

  // Filter data based on search and status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && customer.email_verified_at) ||
      (statusFilter === "inactive" && !customer.email_verified_at)

    return matchesSearch && matchesStatus
  })

  // Calculate pagination with filtered data
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const totalItems = filteredCustomers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem)

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Handle search change
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }



  return (
   <div className="bg-gray-100 min-h-screen p-4">
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-semibold">Online Customers</h2>
          
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
            {/* <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    size="default"
                    className="bg-[#eb1c75] hover:bg-pink-400 text-white flex items-center gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Status
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                  <DropdownMenuItem 
                    className={`flex items-center justify-between ${
                      statusFilter === 'all' ? 'text-pink-600' : ''
                    }`}
                    onClick={() => {
                      setStatusFilter('all')
                      setCurrentPage(1)
                    }}
                  >
                    All
                    {statusFilter === 'all' && <CheckCircle className="h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`flex items-center justify-between ${
                      statusFilter === 'active' ? 'text-pink-600' : ''
                    }`}
                    onClick={() => {
                      setStatusFilter('active')
                      setCurrentPage(1)
                    }}
                  >
                    Active
                    {statusFilter === 'active' && <CheckCircle className="h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`flex items-center justify-between ${
                      statusFilter === 'inactive' ? 'text-pink-600' : ''
                    }`}
                    onClick={() => {
                      setStatusFilter('inactive')
                      setCurrentPage(1)
                    }}
                  >
                    Inactive
                    {statusFilter === 'inactive' && <CheckCircle className="h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div> */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                    <TableHead className="text-white font-medium text-center">Customer ID</TableHead>
                    <TableHead className="text-white font-medium text-center">Name</TableHead>
                    <TableHead className="text-white font-medium hidden md:table-cell text-center">Phone Number</TableHead>
                    <TableHead className="text-white font-medium hidden sm:table-cell text-center">Email</TableHead>
                    <TableHead className="text-white font-medium hidden sm:table-cell text-center">Status</TableHead>
                    <TableHead className="text-white font-medium text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium text-center">{customer.id}</TableCell>
                      <TableCell className="text-center">{customer.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-center">{customer.phone}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center">{customer.email}</TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <span 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            customer.email_verified_at 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {customer.email_verified_at ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/dashboard/contact/customer/view/${customer.id}`}>
                              <Eye className="h-4 w-4 text-pink-400" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                      onClick={() => handlePageChange(currentPage - 1)}
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
                          onClick={() => handlePageChange(pageNum)}
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
                      onClick={() => handlePageChange(currentPage + 1)}
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
   </div>
  )
}

export default OnlineCustomers
