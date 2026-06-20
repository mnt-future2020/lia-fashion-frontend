"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axios from "../../../lib/axios"
import { toast } from 'react-toastify'

const EditVendor = ({ id }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [vendor, setVendor] = useState({
    vendor_name: "",
    contact_person_name: "",
    phone_number: "",
    email: "",
    category: "",
    gst_number: "",
    address_line1: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    pincode: "",
    status: "active"
  })

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

  const validateForm = () => {
    const errors = []
    
    if (!vendor.vendor_name.trim()) errors.push('Vendor name is required')
    if (!vendor.contact_person_name.trim()) errors.push('Contact person name is required')
    if (!vendor.phone_number.trim()) errors.push('Phone number is required')
    if (!vendor.email.trim()) errors.push('Email is required')
    if (!vendor.address_line1.trim()) errors.push('Address is required')
    if (!vendor.city.trim()) errors.push('City is required')
    if (!vendor.state.trim()) errors.push('State is required')
    if (!vendor.pincode.trim()) errors.push('Pincode is required')
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (vendor.email && !emailRegex.test(vendor.email)) {
      errors.push('Invalid email format')
    }
    
    // Phone validation (10 digits)
    const phoneRegex = /^\d{10}$/
    if (vendor.phone_number && !phoneRegex.test(vendor.phone_number)) {
      errors.push('Phone number must be 10 digits')
    }
    
    // Pincode validation (6 digits)
    const pincodeRegex = /^\d{6}$/
    if (vendor.pincode && !pincodeRegex.test(vendor.pincode)) {
      errors.push('Pincode must be 6 digits')
    }

    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    try {
      setSubmitting(true)
      const response = await axios.put(`/api/admin/vendors/${id}`, vendor)
      
      if (response.data.status === 'success') {
        toast.success('Vendor updated successfully')
        router.push('/admin/dashboard/contact/vendors')
      } else {
        toast.error(response.data.message || 'Failed to update vendor')
      }
    } catch (error) {
      // console.error('Error updating vendor:', error)
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors
        Object.values(validationErrors).forEach(errors => {
          errors.forEach(error => toast.error(error))
        })
      } else if (error.response?.status === 404) {
        toast.error('Vendor not found')
      } else {
        toast.error('Failed to update vendor')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
        <span className="ml-2">Loading vendor details...</span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#eb1c75]">
            Edit Vendor - {vendor.vendor_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.vendor_name}
                  onChange={(e) => setVendor(prev => ({ ...prev, vendor_name: e.target.value }))}
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.contact_person_name}
                  onChange={(e) => setVendor(prev => ({ ...prev, contact_person_name: e.target.value }))}
                  placeholder="Enter contact person name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.phone_number}
                  onChange={(e) => setVendor(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Enter 10-digit phone number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input 
                  type="email"
                  value={vendor.email}
                  onChange={(e) => setVendor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GST Number</label>
                <Input 
                  value={vendor.gst_number}
                  onChange={(e) => setVendor(prev => ({ ...prev, gst_number: e.target.value }))}
                  placeholder="Enter GST number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input 
                  value={vendor.category}
                  onChange={(e) => setVendor(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Address <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.address_line1}
                  onChange={(e) => setVendor(prev => ({ ...prev, address_line1: e.target.value }))}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.city}
                  onChange={(e) => setVendor(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">District</label>
                <Input 
                  value={vendor.district}
                  onChange={(e) => setVendor(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="Enter district"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.state}
                  onChange={(e) => setVendor(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pin Code <span className="text-red-500">*</span></label>
                <Input 
                  value={vendor.pincode}
                  onChange={(e) => setVendor(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="Enter 6-digit pincode"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#eb1c75] hover:bg-pink-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditVendor