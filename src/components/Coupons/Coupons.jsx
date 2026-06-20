"use client"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import axios from '../../lib/axios'
import { Search, Filter, Plus, Edit, Trash2, Package, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import DeleteConfirmation from "@/components/DeleteConfirmation/Confirmation";
import EditCouponModal from './EditCouponModal';
import { Card, CardContent } from "@/components/ui/card"

export default function CouponManager() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    couponId: null
  });
  const [editingCoupon, setEditingCoupon] = useState(null);
  // Add displayCoupons state for client-side pagination
  const [displayCoupons, setDisplayCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons();
  }, [currentPage, activeTab, searchQuery]);

  const isLimitReached = (coupon) => {
    return coupon.usage_count >= (coupon.max_usage || 1);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/coupons', {
        params: {
          per_page: 'all' // Get all coupons for proper filtering
        }
      });

      let allCoupons = response.data?.data || response.data || [];

      // Apply filters based on activeTab
      let filteredCoupons = allCoupons.filter(coupon => {
        switch (activeTab) {
          case 'active':
            // Show coupons that are active AND not at usage limit
            return coupon.is_active && !isLimitReached(coupon);
          case 'expired':
            // Show coupons that have reached their usage limit
            return isLimitReached(coupon);
          case 'all':
          default:
            // Show all coupons
            return true;
        }
      });

      // Apply search filter if needed
      if (searchQuery?.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        filteredCoupons = filteredCoupons.filter(coupon => 
          coupon.name?.toLowerCase().includes(searchLower) ||
          coupon.code?.toLowerCase().includes(searchLower)
        );
      }

      // Update states with filtered results
      setTotalItems(filteredCoupons.length);
      setTotalPages(Math.ceil(filteredCoupons.length / itemsPerPage));
      setCoupons(filteredCoupons);

      // Apply pagination to filtered results
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setDisplayCoupons(filteredCoupons.slice(startIndex, endIndex));

      // Reset to first page if current page is out of bounds
      if (currentPage > Math.ceil(filteredCoupons.length / itemsPerPage)) {
        setCurrentPage(1);
      }

    } catch (error) {
      // console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      
      // Check if coupon has reached usage limit
      if (isLimitReached(coupon)) {
        toast.error("Cannot activate coupon that has reached usage limit");
        return;
      }

      await axios.patch(`/api/admin/coupons/${couponId}/toggle-status`);
      
      // Update local state
      const updatedCoupons = coupons.map(c => 
        c.id === couponId
          ? { 
              ...c, 
              is_active: !c.is_active 
            }
          : c
      );
      
      setCoupons(updatedCoupons);
      
      // Update display coupons
      setDisplayCoupons(prev => prev.map(c => 
        c.id === couponId
          ? { 
              ...c, 
              is_active: !c.is_active 
            }
          : c
      ));
      
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (couponId) => {
    setDeleteConfirmation({ isOpen: true, couponId });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/admin/coupons/${deleteConfirmation.couponId}`);
      // Refresh data after deletion
      fetchCoupons();
      toast.success('Coupon deleted successfully');
      setDeleteConfirmation({ isOpen: false, couponId: null });
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleEditClick = (coupon) => {
    // console.log('Edit Coupon Data:', coupon);
    // Ensure description is included and handle null case
    setEditingCoupon({
        ...coupon,
        description: coupon.description ?? '' // Use nullish coalescing
    });
  };

  const handleUpdateCoupon = (updatedCoupon) => {
    // console.log('Updated Coupon Data:', updatedCoupon);
    setCoupons(coupons.map(coupon => 
      coupon.id === updatedCoupon.id ? updatedCoupon : coupon
    ));
    
    // Also update displayCoupons
    setDisplayCoupons(displayCoupons.map(coupon => 
      coupon.id === updatedCoupon.id ? updatedCoupon : coupon
    ));
  };

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
      // console.log(`Moving to page ${page} of ${totalPages}`);
      setCurrentPage(page);
      
      // If we're handling pagination client-side, update the displayed coupons
      if (coupons.length > itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayCoupons(coupons.slice(startIndex, endIndex));
      }
      
      window.scrollTo(0, 0); // Scroll to top when page changes
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-transparent border-b w-full justify-start gap-6">
              <TabsTrigger
                value="all"
                className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none pb-2"
              >
                All Coupons
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none pb-2"
              >
                Active Coupons
              </TabsTrigger>
              <TabsTrigger
                value="expired"
                className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500 data-[state=active]:text-pink-500 rounded-none pb-2"
              >
                Usage Limit Reached
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col space-y-4">
              {/* Search and Actions Section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      placeholder="Search coupons..." 
                      className="pl-10 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="bg-[#eb1c75] hover:bg-pink-600 text-white"
                  onClick={() => router.push('/admin/dashboard/coupons/createcoupons')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </div>

              {/* Table Content */}
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-[#eb1c75]">
                    <tr>
                      <th className="py-3 px-4 text-white font-medium">Coupon Name</th>
                      <th className="py-3 px-4 text-white font-medium text-center">Usage</th>
                      <th className="py-3 px-4 text-white font-medium text-center">Status</th>
                      <th className="py-3 px-4 text-white font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                            <span className="ml-2">Loading coupons...</span>
                          </div>
                        </td>
                      </tr>
                    ) : displayCoupons.length > 0 ? (
                      displayCoupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b hover:bg-gray-50">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded flex items-center justify-center ${
                                coupon.discount_type === "amount" ? "bg-gray-200" : "bg-pink-500"
                              }`}>
                                {coupon.discount_type === "amount" ? (
                                  <Package className="h-5 w-5 text-gray-600" />
                                ) : (
                                  <Tag className="h-5 w-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{coupon.name}</div>
                                <div className="text-sm text-gray-500">{coupon.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <div className="text-sm">
                              <div>{coupon.usage_count}/{coupon.max_usage || 1} times</div>
                              {isLimitReached(coupon) && (
                                <div className="text-red-500 text-xs">Limit reached</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs ${
                              coupon.is_active && !isLimitReached(coupon) 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {coupon.is_active && !isLimitReached(coupon) ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Switch 
                                checked={coupon.is_active && !isLimitReached(coupon)} 
                                onCheckedChange={() => handleToggleStatus(coupon.id, coupon.is_active)}
                                className="data-[state=checked]:bg-pink-500" 
                                disabled={isLimitReached(coupon)}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500"
                                onClick={() => handleEditClick(coupon)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500"
                                onClick={() => handleDelete(coupon.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No coupons found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!loading && totalItems > 0 && <PaginationControls />}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, couponId: null })}
        onDelete={confirmDelete}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
      />
      <EditCouponModal 
        isOpen={!!editingCoupon}
        onClose={() => setEditingCoupon(null)}
        coupon={editingCoupon}
        onUpdate={handleUpdateCoupon}
      />
    </div>
  )
}

function CouponTable({ coupons, onToggleStatus, onDelete, onEdit }) {
  const router = useRouter();
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-500 text-sm border-b">
            <th className="pb-2 font-medium w-1/3">Coupon Name</th>
            <th className="pb-2 font-medium">Usage</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {coupons.length > 0 ? (
            coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${
                      coupon.discount_type === "amount" ? "bg-gray-200" : "bg-pink-500"
                    }`}>
                      {coupon.discount_type === "amount" ? (
                        <Package className="h-5 w-5 text-gray-600" />
                      ) : (
                        <Tag className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{coupon.name}</div>
                      <div className="text-sm text-gray-500">{coupon.code}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">{coupon.usage_count} times</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-md text-xs ${
                    coupon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-4 text-sm">
                  {coupon.start_date} - {coupon.end_date}
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Switch 
                      checked={coupon.is_active} 
                      onCheckedChange={() => onToggleStatus(coupon.id, coupon.is_active)}
                      className="data-[state=checked]:bg-pink-500" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500"
                      onClick={() => onEdit(coupon)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-500"
                      onClick={() => onDelete(coupon.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                No coupons found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
