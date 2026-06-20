"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { PlusIcon, Pencil, Trash2, AlertTriangle, Star, Flame, TrendingUp, Gift, Crown, Award } from "lucide-react"
import axios from '../../lib/axios'  // Update to use custom axios instance
import DeleteConfirmation from "@/components/DeleteConfirmation/Confirmation";
import { toast } from 'sonner';

const Products = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    productId: null
  });
  const [displayProducts, setDisplayProducts] = useState([]);
  const [showColumnFilter, setShowColumnFilter] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    sku: true,
    inventory: true,
    sizes: true,
    colors: true,
    createdAt: true,
    status: true,
    actions: true,
  })

  const toggleColumn = (columnName) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnName]: !prev[columnName]
    }))
  }

  // Effect to restore page from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pageFromUrl = params.get('page');
      const page = pageFromUrl ? parseInt(pageFromUrl) : 1;
      if (page !== currentPage) {
        setCurrentPage(page);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/products', {
          params: {
            per_page: 'all'
          }
        });
        
        let allProducts = response.data?.data || response.data || [];
        
        // Apply filters to all products
        let filteredProducts = [...allProducts];

        // Apply status filter
        if (statusFilter !== 'all') {
          filteredProducts = filteredProducts.filter(product => {
            switch (statusFilter) {
              case 'Active':
                return product.status === 'Active' && product.stock > 0;
              case 'Inactive':
                return product.status === 'Inactive';
              case 'Out of Stock':
                return product.stock <= 0;
              case 'low-stock':
                return product.stock > 0 && product.stock <= 20;
              default:
                return true;
            }
          });
        }

        // Apply search filter
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase().trim();
          filteredProducts = filteredProducts.filter(product => 
            product.name?.toLowerCase().includes(searchLower) ||
            product.sku_code?.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower)
          );
        }

        // Update states with filtered results
        setProducts(filteredProducts);
        setTotalItems(filteredProducts.length);
        setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage));

        // Reset to first page when filters change, but not on initial load
        if (searchTerm.trim() || statusFilter !== 'all') {
          // Update URL
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.delete('page');
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.replaceState({}, '', newUrl);
          }
          setCurrentPage(1);
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayProducts(filteredProducts.slice(startIndex, endIndex));

        setError(null);
      } catch (err) {
        // console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);

  }, [router, searchTerm, statusFilter, itemsPerPage, currentPage]);

  // Add a separate useEffect for pagination
  useEffect(() => {
    if (products.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDisplayProducts(products.slice(startIndex, endIndex));
    }
  }, [currentPage, itemsPerPage, products]);

  // Cleanup localStorage when component unmounts
  useEffect(() => {
    return () => {
      // Keep the page number in localStorage for persistence
      // It will be used when the user comes back to this page
    };
  }, []);

  // Pagination controls component
  const PaginationControls = () => (
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
              onClick={() => goToPage(currentPage - 1)}
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
                  onClick={() => goToPage(pageNum)}
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
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // Update the page change handler
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      
      // Update URL with the new page number
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (page === 1) {
          params.delete('page');
        } else {
          params.set('page', page.toString());
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
      
      // If we're handling pagination client-side, update the displayed products
      if (products.length > itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayProducts(products.slice(startIndex, endIndex));
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (productId) => {
    setDeleteConfirmation({ isOpen: true, productId });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/admin/products/${deleteConfirmation.productId}`);
      
      // Update both the full products list and display products list
      const updatedProducts = products.filter(p => p.id !== deleteConfirmation.productId);
      const updatedDisplayProducts = displayProducts.filter(p => p.id !== deleteConfirmation.productId);
      
      setProducts(updatedProducts);
      setDisplayProducts(updatedDisplayProducts);
      setTotalItems(prev => prev - 1);
      setTotalPages(Math.ceil((totalItems - 1) / itemsPerPage));
      
      toast.success('Product deleted successfully');
      setDeleteConfirmation({ isOpen: false, productId: null });

      // If current page is empty after deletion, go to previous page
      if (updatedDisplayProducts.length === 0 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (err) {
      // console.error('Error deleting product:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/admin/login');
      } else {
        toast.error('Failed to delete product. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      const response = await axios.patch(`/api/admin/products/${productId}/toggle-status`);
      
      // Update both products and displayProducts arrays
      const updatedProducts = products.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              status: response.data.status,
              is_published: response.data.is_published
            }
          : product
      );
      
      setProducts(updatedProducts);
      
      // Update displayProducts if doing client-side pagination
      const updatedDisplayProducts = displayProducts.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              status: response.data.status,
              is_published: response.data.is_published
            }
          : product
      );
      
      setDisplayProducts(updatedDisplayProducts);
      
      // Show success message
      toast.success(`Product status updated to ${response.data.status}`);
    } catch (err) {
      // console.error('Error toggling status:', err);
      toast.error('Failed to update status. Please try again.');
    }
  };

  return (
    <div className="bgclrrr">
      <div className="container mx-auto py-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              {/* Updated Search and Filter Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <div className="flex gap-2 relative">
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

                  <Select  value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger  className="w-[180px] bg-[#eb1c75] text-white ">
                      <SelectValue placeholder="Status">
                        {statusFilter === 'Active' && <span className="text-white-700">Active</span>}
                        {statusFilter === 'Inactive' && <span className="text-white-800">Inactive</span>}
                        {statusFilter === 'Out of Stock' && <span className="text-white-700">Out of Stock</span>}
                        {statusFilter === 'low-stock' && <span className="text-white-700">Low Stock</span>}
                        {statusFilter === 'all' && <span>All</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="text-gray-700">All Products</span>
                      </SelectItem>
                      <SelectItem value="Active">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-green-700">Active</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="Inactive">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          <span className="text-gray-800">Inactive</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="Out of Stock">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-red-700">Out of Stock</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="low-stock">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-yellow-700">Low Stock</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    className="bg-[#eb1c75] hover:bg-pink-600 text-white"
                    onClick={() => router.push('/admin/dashboard/products/addproduct')}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              </div>

              {/* Updated Table Header */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-[#eb1c75]">
                    <TableRow>
                      {visibleColumns.product && <TableHead className="text-white text-center">Product</TableHead>}
                      {visibleColumns.sku && <TableHead className="text-white text-center">SKU</TableHead>}
                      {visibleColumns.inventory && <TableHead className="text-white text-center">Inventory</TableHead>}
                      {visibleColumns.sizes && <TableHead className="text-white text-center">Sizes</TableHead>}
                      {visibleColumns.colors && <TableHead className="text-white text-center">Colors</TableHead>}
                      {visibleColumns.createdAt && <TableHead className="text-white text-center">Created At</TableHead>}
                      {visibleColumns.status && <TableHead className="text-white text-center">Status</TableHead>}
                      {visibleColumns.actions && <TableHead className="text-white text-center">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>

                  {/* Update the TableBody to respect visible columns */}
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                            <span className="ml-2">Loading products...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-red-500 bg-red-50">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : displayProducts.length > 0 ? (
                      displayProducts.map((product) => (
                        <TableRow key={product.id} className="hover:bg-gray-50">
                          {visibleColumns.product && (
                            <TableCell className="text-center">
                              <div className="flex items-center gap-3 justify-center">
                                <div className="h-12 w-12 overflow-hidden rounded-md border bg-gray-100 relative">
                                  {product.isLowStock && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 rounded-bl p-0.5" title="Low Stock">
                                      <AlertTriangle className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  <Image
                                    src={product.image || "/placeholder.svg"}
                                    alt={product.name}
                                    width={60}
                                    height={60}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="w-[180px] text-left">
                                  <div className="font-medium truncate" title={product.name}>{product.name}</div>
                                  <div className="text-sm text-gray-500 truncate" title={product.category}>{product.category}</div>
                                  {product.badge && (
                                    <span className="flex items-center gap-1 mt-1 text-xs font-semibold rounded px-2 py-1"
                                      style={{
                                        background:
                                          product.badge === "New arrival" ? "#e6f9ec" :
                                          product.badge === "Best Seller" ? "#e6f0fa" :
                                          product.badge === "Hot Selling" ? "#fff4e6" :
                                          product.badge === "Trending" ? "#f3e6fa" :
                                          product.badge === "Limited" ? "#fae6e6" :
                                          product.badge === "Premium" ? "#fffbe6" :
                                          "#f3f4f6",
                                        color:
                                          product.badge === "New arrival" ? "#1db954" :
                                          product.badge === "Best Seller" ? "#2563eb" :
                                          product.badge === "Hot Selling" ? "#f97316" :
                                          product.badge === "Trending" ? "#a21caf" :
                                          product.badge === "Limited" ? "#dc2626" :
                                          product.badge === "Premium" ? "#eab308" :
                                          "#374151"
                                      }}
                                    >
                                      {product.badge === "New arrival" && <Gift size={14} className="inline" />}
                                      {product.badge === "Best Seller" && <Star size={14} className="inline" />}
                                      {product.badge === "Hot Selling" && <Flame size={14} className="inline" />}
                                      {product.badge === "Trending" && <TrendingUp size={14} className="inline" />}
                                      {product.badge === "Limited" && <Award size={14} className="inline" />}
                                      {product.badge === "Premium" && <Crown size={14} className="inline" />}
                                      {product.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.sku && <TableCell className="text-center">{product.sku_code}</TableCell>}
                          {visibleColumns.inventory && (
                            <TableCell className="text-center">
                              {product.stock > 0 ? `${product.stock} ` : 'Out of Stock'}
                            </TableCell>
                          )}
                          {visibleColumns.sizes && (
                            <TableCell className="text-center">
                              <div className="max-w-[150px] mx-auto">
                                {!product.sizes || (Array.isArray(product.sizes) && product.sizes.length === 0)
                                  ? '-'
                                  : typeof product.sizes === 'string'
                                    ? product.sizes || '-'
                                    : Array.isArray(product.sizes)
                                      ? product.sizes.slice(0, 2).join(', ') + (product.sizes.length > 2 ? ` +${product.sizes.length - 2} more` : '')
                                      : '-'
                                }
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.colors && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {product.colors && product.colors.length > 0 ? (
                                  <>
                                    {product.colors.slice(0, 3).map((colorObj, idx) => (
                                      <div
                                        key={idx}
                                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                                        style={{ 
                                          backgroundColor: colorObj.color || '#000000',
                                          borderColor: colorObj.color === '#FFFFFF' ? '#e2e8f0' : colorObj.color
                                        }}
                                        title={colorObj.color}
                                      />
                                    ))}
                                    {product.colors.length > 3 && (
                                      <span className="text-sm text-gray-500 ml-1">
                                        +{product.colors.length - 3}
                                      </span>
                                    )}
                                  </>
                                ) : product.color ? (
                                  <>
                                    {product.color.split(',').map((color, idx) => (
                                      <div
                                        key={idx}
                                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                                        style={{ 
                                          backgroundColor: color.trim() || '#000000',
                                          borderColor: color.trim() === '#FFFFFF' ? '#e2e8f0' : color.trim()
                                        }}
                                        title={color.trim()}
                                      />
                                    )).slice(0, 3)}
                                    {product.color.split(',').length > 3 && (
                                      <span className="text-sm text-gray-500 ml-1">
                                        +{product.color.split(',').length - 3}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div
                                    className="w-6 h-6 rounded-full border border-gray-200 shadow-sm bg-gray-200"
                                    title="No color specified"
                                  />
                                )}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.createdAt && <TableCell className="text-center">{product.created_at}</TableCell>}
                          {visibleColumns.status && (
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  product.status === "Active"
                                    ? "outline"
                                    : product.status === "Inactive"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className={
                                  product.status === "Active"
                                    ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700"
                                    : product.status === "Inactive"
                                      ? "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800"
                                      : "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700"
                                }
                              >
                                {product.status}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.actions && (
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-8 w-8 ${product.status === "Active" ? "text-green-500" : "text-gray-500"}`}
                                  onClick={() => handleToggleStatus(product.id, product.status)}
                                  disabled={product.status === "Out of Stock"}
                                  title={product.status === "Out of Stock" ? "Can't toggle status for out of stock products" : "Toggle active status"}
                                >
                                  <div className={`w-8 h-4 rounded-full ${product.status === "Active" ? "bg-green-400" : "bg-gray-300"} relative`}>
                                    <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all ${product.status === "Active" ? "right-0.5" : "left-0.5"}`}></div>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-pink-500 hover:text-pink-600"
                                  onClick={() => router.push(`/admin/dashboard/products/editproduct/${product.id}`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-pink-500 hover:text-pink-600"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No products found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {!loading && totalItems > 0 && (
                <PaginationControls />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, productId: null })}
        onDelete={confirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  )
}

export default Products