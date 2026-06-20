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
import { categoryService } from "@/services/categoryService"
import axios from '../../lib/axios'
import { AlertDialog, AlertDialogTrigger, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function Offers() {
  const [isLoading, setIsLoading] = useState(false)
  const [offers, setOffers] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    items_count: '',
    discount_amount: '',
  })


  useEffect(() => {
    fetchCategories()
    fetchOffers()
  }, [])

  useEffect(() => {
    if (formData.category) {
      fetchSubcategories(formData.category)
    } else {
      setSubcategories([])
      setFormData((prev) => ({ ...prev, subcategory: '' }))
    }
  }, [formData.category])

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories()
      // If API returns {status, data}, use res.data; else use res directly
      setCategories(res.data ? res.data : res)
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const fetchSubcategories = async (categoryId) => {
    try {
      const res = await categoryService.getSubcategories(categoryId)
      setSubcategories(res.data ? res.data : res)
    } catch (error) {
      toast.error('Failed to load subcategories')
    }
  }

  const fetchOffers = async () => {
    setIsLoading(true)
    try {
      const res = await axios.get('/api/admin/offers')
      if (res.data.status === 'success') {
        // Sort offers by most recently added (created) first
        const sortedOffers = res.data.data.sort((a, b) => {
          // Use both created_at and id as fallback for proper sorting
          const dateA = new Date(a.created_at || 0)
          const dateB = new Date(b.created_at || 0)
          
          // If dates are the same or invalid, sort by ID (higher ID = newer)
          if (dateA.getTime() === dateB.getTime() || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            return (b.id || 0) - (a.id || 0)
          }
          
          return dateB - dateA // Descending order (newest first)
        })
        setOffers(sortedOffers)
      }
    } catch (error) {
      toast.error('Failed to load offers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      category: '',
      subcategory: '',
      items_count: '',
      discount_amount: '',
    })
    setEditMode(false)
    setSelectedOffer(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload = { ...formData }
      let res
      if (editMode && selectedOffer) {
        res = await axios.put(`/api/admin/offers/${selectedOffer.id}`, payload)
      } else {
        res = await axios.post('/api/admin/offers', payload)
      }
      if (res.data.status === 'success') {
        toast.success(editMode ? 'Offer updated successfully' : 'Offer created successfully')
        resetForm()
        
        if (!editMode && res.data.data) {
          // For new offers, add directly to the top of the list for immediate feedback
          const newOffer = res.data.data
          setOffers(prevOffers => [newOffer, ...prevOffers])
        }
        
        // Also refresh from backend to ensure consistency
        setTimeout(() => {
          fetchOffers()
        }, 100)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (offer) => {
    setEditMode(true)
    setSelectedOffer(offer)
    setFormData({
      category: offer.category_id,
      subcategory: '', // will set after subcategories load
      items_count: offer.items_count,
      discount_amount: offer.discount_amount,
    })
    // Fetch subcategories and set subcategory after loading
    await fetchSubcategories(offer.category_id)
     // Use a timeout to ensure subcategories are set before updating subcategory
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, subcategory: offer.subcategory_id?.toString() }))
    }, 0)
  }

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <h2 className="text-xl sm:text-2xl font-bold"> Create Offers</h2>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
                required
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => handleInputChange('subcategory', value)}
                required
                disabled={!formData.category}
              >
                <SelectTrigger id="subcategory" className="w-full">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="items_count">Items Count</Label>
              <Input
                id="items_count"
                type="number"
                min="1"
                placeholder="Enter items count"
                value={formData.items_count}
                onChange={(e) => handleInputChange('items_count', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_amount">Discount Amount(per Item) (₹)</Label>
              <Input
                id="discount_amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter discount amount"
                value={formData.discount_amount}
                onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm}>
              {editMode ? 'Cancel' : 'Reset'}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editMode ? 'Update' : 'Save')}
            </Button>
          </div>
        </form>

        {/* Offers Table */}
        <div className="overflow-x-auto rounded-md border mt-6">
          <Table>
            <TableHeader className="bg-[#eb1c75] text-white text-base">
              <TableRow>
                <TableHead className="text-center text-white">Category</TableHead>
                <TableHead className="text-center text-white">Subcategory</TableHead>
                <TableHead className="text-center text-white">Items Count</TableHead>
                <TableHead className="text-center text-white">Discount Amount (₹)</TableHead>
                <TableHead className="text-center text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : !offers || offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No Offers found</TableCell>
                </TableRow>
              ) : (
                Array.isArray(offers) && offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="text-center">{offer.category_name}</TableCell>
                    <TableCell className="text-center">{offer.subcategory_name}</TableCell>
                    <TableCell className="text-center">{offer.items_count}</TableCell>
                    <TableCell className="text-center">₹{offer.discount_amount}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(offer)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Trash className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to delete this offer?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  setIsLoading(true)
                                  try {
                                    const res = await axios.delete(`/api/admin/offers/${offer.id}`)
                                    if (res.data.status === 'success') {
                                      toast.success('Offer deleted successfully')
                                      fetchOffers()
                                    } else {
                                      toast.error(res.data.message || 'Failed to delete offer')
                                    }
                                  } catch (error) {
                                    toast.error(error.response?.data?.message || 'Failed to delete offer')
                                  } finally {
                                    setIsLoading(false)
                                  }
                                }}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}