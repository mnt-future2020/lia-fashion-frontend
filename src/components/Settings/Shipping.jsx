"use client"

import { Eye, Pencil, Trash, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import axios from '../../lib/axios' 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function ShippingSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [activeTab, setActiveTab] = useState("weight")
  const [shippingRules, setShippingRules] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })
  
  const [formData, setFormData] = useState({
    type: "weight",
    from_weight: "",
    to_weight: "",
    free_shipping_amount: "",
    price: "",
    location: "",
    shipping_charge: "",
    estimated_days: "",
  })

  const locations = [
    "Tamil Nadu",
    "Puducherry",
    "Other States"
  ]

  useEffect(() => {
    fetchShippingRules()
  }, [activeTab, currentPage])

  const fetchShippingRules = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/admin/shipping-rules?type=${activeTab}&page=${currentPage}&per_page=${itemsPerPage}`)
      if (response.data.status === 'success') {
        const rulesData = Array.isArray(response.data.data) 
          ? response.data.data 
          : (response.data.data?.data || [])
        setShippingRules(rulesData)
      }
    } catch (error) {
      // console.error("Error fetching shipping rules:", error)
      toast.error(error.response?.data?.message || "Failed to load shipping rules. Please try again.")
      setShippingRules([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const payload = {
        ...formData,
        type: activeTab,
      }
      
      let response
      
      if (editMode && selectedRule) {
        response = await axios.put(`/api/admin/shipping-rules/${selectedRule.id}`, payload)
      } else {
        response = await axios.post('/api/admin/shipping-rules', payload)
      }
      
      if (response.data.status === 'success') {
        toast.success(editMode 
          ? "Shipping rule updated successfully" 
          : "Shipping rule created successfully"
        )
        resetForm()
        fetchShippingRules()
      }
    } catch (error) {
      // console.error("Error saving shipping rule:", error)
      toast.error(error.response?.data?.message || "Failed to save shipping rule. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteDialog({ open: false, id: null })
    setIsLoading(true)
    try {
      const response = await axios.delete(`/api/admin/shipping-rules/${id}`)
      if (response.data.status === 'success') {
        toast.success("Shipping rule deleted successfully")
        fetchShippingRules()
      }
    } catch (error) {
      // console.error("Error deleting shipping rule:", error)
      toast.error(error.response?.data?.message || "Failed to delete shipping rule. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (rule) => {
    setEditMode(true)
    setSelectedRule(rule)
    
    if (activeTab === "weight") {
      setFormData({
        from_weight: rule.from_weight,
        to_weight: rule.to_weight,
        free_shipping_amount: rule.free_shipping_amount,
        price: rule.price,
        type: "weight",
        location: "",
        shipping_charge: "",
        estimated_days: "",
      })
    } else {
      setFormData({
        location: rule.location,
        shipping_charge: rule.shipping_charge,
        estimated_days: rule.estimated_days,
        type: "location",
        from_weight: "",
        to_weight: "",
        free_shipping_amount: "",
        price: "",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      type: activeTab,
      from_weight: "",
      to_weight: "",
      free_shipping_amount: "",
      price: "",
      location: "",
      shipping_charge: "",
      estimated_days: "",
    })
    setEditMode(false)
    setSelectedRule(null)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetForm()
    setCurrentPage(1)
  }

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const totalPages = Math.ceil(shippingRules.length / itemsPerPage)

  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  const renderWeightPriceContent = () => (
    <>
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="free_shipping_amount">Free Shipping Above Amount</Label>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              id="free_shipping_amount"
              type="number"
              placeholder="Enter amount for free shipping"
              className="flex-1"
              value={formData.free_shipping_amount}
              onChange={(e) => handleInputChange("free_shipping_amount", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from_weight">From Weight (kg)</Label>
            <Input
              id="from_weight"
              type="number"
              step="0.01"
              placeholder="Enter weight"
              value={formData.from_weight}
              onChange={(e) => handleInputChange("from_weight", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to_weight">To Weight (kg)</Label>
            <Input
              id="to_weight"
              type="number"
              step="0.01"
              placeholder="Enter weight"
              value={formData.to_weight}
              onChange={(e) => handleInputChange("to_weight", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Shipping Price (₹)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="Enter shipping price"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm}>
            {editMode ? "Cancel" : "Reset"}
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (editMode ? "Update" : "Save")}
          </Button>
        </div>
      </form>

      {/* Weight & Price Table */}
      <div className="overflow-x-auto rounded-md border mt-6">
        <Table>
          <TableHeader className="bg-[#eb1c75] text-white text-base">
            <TableRow>
              <TableHead className="text-center text-white whitespace-nowrap">From Weight (kg)</TableHead>
              <TableHead className="text-center text-white whitespace-nowrap">To Weight (kg)</TableHead>
              <TableHead className="text-center text-white">Free Shipping Amount</TableHead>
              <TableHead className="text-center text-white whitespace-nowrap">Shipping Price (₹)</TableHead>
              <TableHead className="text-center text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : !shippingRules || shippingRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No shipping rules found</TableCell>
              </TableRow>
            ) : (
              Array.isArray(shippingRules) && shippingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-center">{rule.from_weight}</TableCell>
                  <TableCell className="text-center">{rule.to_weight}</TableCell>
                  <TableCell className="text-center">₹{rule.free_shipping_amount}</TableCell>
                  <TableCell className="text-center">₹{rule.price}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500" 
                        onClick={() => setDeleteDialog({ open: true, id: rule.id })}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )

  const renderLocationShippingContent = () => (
    <>
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => handleInputChange("location", value)}
              required
            >
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping_charge">Shipping Charge (₹)</Label>
            <Input
              id="shipping_charge"
              type="number"
              step="0.01"
              placeholder="Enter shipping charge"
              value={formData.shipping_charge}
              onChange={(e) => handleInputChange("shipping_charge", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_days">Estimated Delivery Time</Label>
          <Input
            id="estimated_days"
            type="text"
            placeholder="e.g., 2-3 days"
            value={formData.estimated_days}
            onChange={(e) => handleInputChange("estimated_days", e.target.value)}
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm}>
            {editMode ? "Cancel" : "Reset"}
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : (editMode ? "Update" : "Save")}
          </Button>
        </div>
      </form>

      {/* Location & Shipping Table */}
      <div className="overflow-x-auto rounded-md border mt-6">
        <Table>
          <TableHeader className="bg-[#eb1c75] text-white text-base">
            <TableRow>
              <TableHead className="text-center text-white">Location</TableHead>
              <TableHead className="text-center text-white whitespace-nowrap">Shipping Charge (₹)</TableHead>
              <TableHead className="text-center text-white">Estimated Delivery</TableHead>
              <TableHead className="text-center text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : !shippingRules || shippingRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No shipping rules found</TableCell>
              </TableRow>
            ) : (
              Array.isArray(shippingRules) && shippingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="text-center">{rule.location}</TableCell>
                  <TableCell className="text-center">₹{rule.shipping_charge}</TableCell>
                  <TableCell className="text-center">{rule.estimated_days}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-500" 
                        onClick={() => setDeleteDialog({ open: true, id: rule.id })}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Shipping Rules</h2>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border w-full max-w-md">
            <div className="flex space-x-1">
              <button
                className={`px-4 py-2 md:px-8 md:py-3 rounded-md text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                  activeTab === "weight"
                    ? "bg-[#eb1c75] text-white shadow-sm transform scale-100"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => handleTabChange("weight")}
                type="button"
              >
                Weight & Price
              </button>
              <button
                className={`px-4 py-2 md:px-8 md:py-3 rounded-md text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                  activeTab === "location"
                    ? "bg-[#eb1c75] text-white shadow-sm transform scale-100"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => handleTabChange("location")}
                type="button"
              >
                Location & Shipping
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "weight" ? renderWeightPriceContent() : renderLocationShippingContent()}

        {/* Pagination */}
        {shippingRules.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, shippingRules.length)} of {shippingRules.length} entries
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((number) => (
                <Button
                  key={number}
                  variant={currentPage === number ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(number)}
                  disabled={isLoading}
                >
                  {number}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, id: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shipping Rule</AlertDialogTitle>
            </AlertDialogHeader>
            <div>Are you sure you want to delete this shipping rule?</div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: null })}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)} className="bg-red-500 hover:bg-red-600 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}