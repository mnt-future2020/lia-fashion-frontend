"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from 'react-toastify'
import axios from "../../../lib/axios"
import { Loader2 } from "lucide-react"

const CreateVendorForm = () => {
  const [formData, setFormData] = useState({
    vendor_name: "",
    contact_person_name: "",
    gst_number: "",
    email: "",
    phone_number: "",
    category: "",
    address_line1: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pincode: "",
    status: "active"
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.vendor_name) newErrors.vendor_name = "Vendor name is required"
    if (!formData.contact_person_name) newErrors.contact_person_name = "Contact person name is required"
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required"
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Phone number must be 10 digits"
    }
    if (!formData.address_line1) newErrors.address_line1 = "Address is required"
    if (!formData.city) newErrors.city = "City is required"
    if (!formData.district) newErrors.district = "District is required"
    if (!formData.state) newErrors.state = "State is required"
    if (!formData.country) newErrors.country = "Country is required"
    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required"
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly")
      return
    }

    try {
      setLoading(true)
      const response = await axios.post('/api/admin/vendors', formData)
      
      toast.success("Vendor created successfully")
      router.push('/admin/dashboard/contact/vendors')
    } catch (error) {
      // console.error('Error creating vendor:', error)
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 500) {
          toast.error("Server error occurred. Please try again later or contact support.")
          // console.error('Server Error Details:', error.response.data)
        } else if (error.response.status === 422) {
          // Validation errors
          if (error.response.data.errors) {
            setErrors(error.response.data.errors)
            toast.error("Please check the form for errors")
          } else {
            toast.error(error.response.data.message || "Validation failed")
          }
        } else if (error.response.status === 401) {
          toast.error("Your session has expired. Please login again.")
          // Optionally redirect to login page
          // router.push('/login')
        } else {
          toast.error(error.response.data.message || "Failed to create vendor")
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response from server. Please check your internet connection.")
        // console.error('Network Error:', error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("An unexpected error occurred. Please try again.")
        // console.error('Error:', error.message)
      }

      // Set validation errors from API response if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create New Vendor</CardTitle>
      </CardHeader>
      <CardContent className="max-w-[90%] mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor_name">Vendor Name *</Label>
              <Input
                id="vendor_name"
                name="vendor_name"
                placeholder="Vendor Name"
                value={formData.vendor_name}
                onChange={handleChange}
                className={errors.vendor_name ? "border-red-500" : ""}
              />
              {errors.vendor_name && (
                <p className="text-sm text-red-500">{errors.vendor_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_person_name">Contact Person Name *</Label>
              <Input
                id="contact_person_name"
                name="contact_person_name"
                placeholder="Contact Person Name"
                value={formData.contact_person_name}
                onChange={handleChange}
                className={errors.contact_person_name ? "border-red-500" : ""}
              />
              {errors.contact_person_name && (
                <p className="text-sm text-red-500">{errors.contact_person_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                placeholder="GST Number"
                value={formData.gst_number}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email ID *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email ID"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone_number">Mobile Number *</Label>
              <Input
                id="phone_number"
                name="phone_number"
                placeholder="Mobile Number"
                value={formData.phone_number}
                onChange={handleChange}
                className={errors.phone_number ? "border-red-500" : ""}
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="Category"
                value={formData.category}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="pt-2">
            <Label className="text-lg font-semibold">Address</Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1 *</Label>
                <Input
                  id="address_line1"
                  name="address_line1"
                  placeholder="Address Line 1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  className={errors.address_line1 ? "border-red-500" : ""}
                />
                {errors.address_line1 && (
                  <p className="text-sm text-red-500">{errors.address_line1}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  name="district"
                  placeholder="District"
                  value={formData.district}
                  onChange={handleChange}
                  className={errors.district ? "border-red-500" : ""}
                />
                {errors.district && (
                  <p className="text-sm text-red-500">{errors.district}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={handleChange}
                  className={errors.state ? "border-red-500" : ""}
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  className={errors.country ? "border-red-500" : ""}
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className={errors.pincode ? "border-red-500" : ""}
                />
                {errors.pincode && (
                  <p className="text-sm text-red-500">{errors.pincode}</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-4 border-t pt-6 mt-6">
        <Button variant="outline" onClick={handleBack} disabled={loading}>
          Cancel
        </Button>
        <Button 
          className="bg-pink-600 hover:bg-pink-700" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default CreateVendorForm
