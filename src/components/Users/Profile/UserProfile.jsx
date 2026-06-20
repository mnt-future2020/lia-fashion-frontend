"use client"

import { useState, useEffect } from "react"
import { useUserAuth } from "@/contexts/UserAuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Camera,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Save,
  UserCheck,
  Star,
  Award,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import axios from "../../../lib/axios"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

// Custom date format function
const formatDate = (date) => {
  if (!date) return ""
  return format(new Date(date), "dd/MM/yyyy")
}

export default function UserProfile() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading: authLoading } = useUserAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [date, setDate] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alt_phone: "",
    gender: "",
    dob: null,
    address1: "",
    city: "",
    district: "",
    state: "",
    country: "",
    pincode: "",
  })

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      toast.error("Please login to view your profile")
      router.push("/login")
      return
    }

    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await axios.get("/api/user/profile")

        if (!response.data) {
          throw new Error("No user data received")
        }

        const userData = response.data
        const userDetails = userData.details || {}

        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          alt_phone: userDetails.alt_phone || "",
          gender: userDetails.gender || "",
          dob: userDetails.dob ? new Date(userDetails.dob) : null,
          address1: userDetails.address1 || "",
          city: userDetails.city || "",
          district: userDetails.district || "",
          state: userDetails.state || "",
          country: userDetails.country || "",
          pincode: userDetails.pincode || "",
        })

        if (userDetails.profile_image) {
          setProfileImage(userDetails.profile_image)
          setImagePreview(userDetails.profile_image)
        }

        if (userDetails.dob) {
          setDate(new Date(userDetails.dob))
        }
      } catch (error) {
        // console.error("Error fetching user data:", error)
        if (error.response?.status === 401) {
          toast.error("Session expired. Please login again.")
          router.push("/login")
        } else {
          toast.error(error.response?.data?.message || "Failed to load user profile")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [isAuthenticated, authLoading, router])

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file")
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }

      setImageLoading(true)
      try {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)
        setProfileImageFile(file)
      } catch (error) {
        // console.error("Error processing image:", error)
        toast.error("Failed to process image")
      } finally {
        setImageLoading(false)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Validate required fields
    if (!formData.phone || !formData.alt_phone || !formData.gender) {
      toast.error("Please fill in all required fields (Phone, Alternative Phone, and Gender)")
      setSaving(false)
      return
    }

    try {
      const formDataToSend = new FormData()

      // Add user details fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          if (key === "dob" && formData[key]) {
            const dateValue = formData[key] instanceof Date ? formData[key].toISOString().split("T")[0] : formData[key]
            formDataToSend.append(key, dateValue)
          } else {
            formDataToSend.append(key, formData[key])
          }
        }
      })

      // Add profile image if it exists
      if (profileImageFile) {
        formDataToSend.append("profile_image", profileImageFile)
      }

      const response = await axios.post("/api/user/profile/update", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })

      if (response.data) {
        const userDetails = response.data.details || {}
        setFormData((prev) => ({
          ...prev,
          ...response.data,
          ...userDetails,
        }))

        if (userDetails.profile_image) {
          setProfileImage(userDetails.profile_image)
          setImagePreview(userDetails.profile_image)
        }
      }

      toast.success("Profile updated successfully")
      router.push("/")
    } catch (error) {
      // console.error("Error updating profile:", error)
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        Object.keys(errors).forEach((key) => {
          toast.error(errors[key][0])
        })
      } else {
        toast.error(error.response?.data?.message || "Failed to update profile")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex justify-center items-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-200/30 to-rose-200/30 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-pink-100 border-t-[rgb(219,39,119)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-rose-400 rounded-full animate-spin animation-delay-300"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-b-pink-300 rounded-full animate-spin animation-delay-700"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-[rgb(219,39,119)] to-rose-500 bg-clip-text text-transparent">
              Loading Your Profile
            </h3>
            <p className="text-gray-600">Preparing your personalized experience...</p>
            <div className="flex items-center justify-center gap-1 mt-4">
              <div className="w-2 h-2 bg-[rgb(219,39,119)] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[rgb(219,39,119)] rounded-full animate-bounce animation-delay-200"></div>
              <div className="w-2 h-2 bg-[rgb(219,39,119)] rounded-full animate-bounce animation-delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 relative overflow-hidden">
      {/* Home Link */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="bg-white/90 backdrop-blur-sm border-2 border-white/30 hover:border-[rgb(219,39,119)] hover:text-[rgb(219,39,119)] rounded-xl transition-all duration-300 font-semibold hover:bg-white hover:scale-105 hover:shadow-lg"
        >
          ← Back to Home
        </Button>
      </div>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-[rgb(219,39,119)]/10 to-pink-200/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-100/10 to-rose-100/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto p-4 py-12">
        {/* Enhanced Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-rose-100 rounded-full mb-6 backdrop-blur-sm border border-white/30">
            <div className="p-1 bg-[rgb(219,39,119)] rounded-full">
              <UserCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[rgb(219,39,119)]">Profile Management</span>
            <Star className="w-4 h-4 text-[rgb(219,39,119)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[rgb(219,39,119)] via-pink-500 to-rose-500 bg-clip-text text-transparent mb-4 tracking-tight">
            Your Profile
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Craft your digital identity with style. Update your information and make your profile shine with
            personality.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Enhanced Profile Header Card */}
            <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-r from-[rgb(219,39,119)] via-pink-500 to-rose-500 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <CardContent className="relative z-10 p-10">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                  {/* Enhanced Profile Image */}
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-white/30 to-white/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white group-hover:scale-105 transition-all duration-500">
                      {imageLoading ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50">
                          <Loader2 className="h-10 w-10 animate-spin text-[rgb(219,39,119)]" />
                        </div>
                      ) : imagePreview ? (
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                          <User className="w-16 h-16 text-[rgb(219,39,119)]" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profile-image"
                      className={cn(
                        "absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-xl cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:bg-gradient-to-r hover:from-white hover:to-pink-50 group",
                        imageLoading && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Camera className="w-5 h-5 text-[rgb(219,39,119)] group-hover:scale-110 transition-transform" />
                      <input
                        type="file"
                        id="profile-image"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={imageLoading}
                      />
                    </label>
                  </div>

                  {/* Enhanced Profile Info */}
                  <div className="flex-1 text-center lg:text-left space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        {formData.name || "Your Amazing Name"}
                      </h2>
                      <p className="text-pink-100 text-base mb-6">{formData.email || "your.email@example.com"}</p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      <Badge className="bg-white/20 text-white border-white/30 px-3 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors">
                        <Shield className="w-4 h-4 mr-2" />
                        Verified Member
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 px-3 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors">
                        <Award className="w-4 h-4 mr-2" />
                        Premium User
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 px-3 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30 transition-colors">
                        <Calendar className="w-4 h-4 mr-2" />
                        Since {user?.created_at ? formatDate(new Date(user.created_at)) : formatDate(new Date())}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Personal Information Card */}
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[rgb(219,39,119)] to-rose-500"></div>
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-pink-100 rounded-2xl">
                    <User className="w-6 h-6 text-[rgb(219,39,119)]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Personal Information</CardTitle>
                    <p className="text-gray-500">Tell us about yourself and keep your details current</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label htmlFor="name" className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-[rgb(219,39,119)]" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                      <Mail className="w-5 h-5 text-[rgb(219,39,119)]" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="phone" className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-[rgb(219,39,119)]" />
                      Phone Number <span className="text-[rgb(219,39,119)]">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="alt_phone" className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-[rgb(219,39,119)]" />
                      Alternative Phone <span className="text-[rgb(219,39,119)]">*</span>
                    </Label>
                    <Input
                      id="alt_phone"
                      name="alt_phone"
                      value={formData.alt_phone}
                      onChange={handleInputChange}
                      placeholder="Enter alternative phone number"
                      required
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="gender" className="text-sm font-bold text-gray-700 mb-2 block">
                      Gender <span className="text-[rgb(219,39,119)]">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl text-base px-4 group-hover:border-pink-300">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 group">
                    <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-[rgb(219,39,119)]" />
                      Date of Birth
                    </Label>
                    <Input
                      type="date"
                      value={formData.dob ? format(formData.dob, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const newDate = e.target.value ? new Date(e.target.value) : null
                        setDate(newDate)
                        setFormData((prev) => ({ ...prev, dob: newDate }))
                      }}
                      max={format(new Date(), "yyyy-MM-dd")}
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Address Information Card */}
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[rgb(219,39,119)] to-rose-500"></div>
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-pink-100 rounded-2xl">
                    <MapPin className="w-6 h-6 text-[rgb(219,39,119)]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-800 mb-2">Shipping Address</CardTitle>
                    <p className="text-gray-500">Where should we deliver your amazing orders?</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pb-10">
                <div className="space-y-3 group">
                  <Label htmlFor="address1" className="text-sm font-bold text-gray-700 mb-2 block">
                    Address Line 1
                  </Label>
                  <Input
                    id="address1"
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    placeholder="Enter your street address"
                    className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label htmlFor="city" className="text-sm font-bold text-gray-700 mb-2 block">
                      City/Town/Village
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city/town/village"
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="district" className="text-sm font-bold text-gray-700 mb-2 block">
                      District
                    </Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Enter district"
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <Label htmlFor="state" className="text-sm font-bold text-gray-700 mb-2 block">
                      State
                    </Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
                    >
                      <SelectTrigger
                        id="state"
                        className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl text-base px-4 group-hover:border-pink-300"
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                        <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                        <SelectItem value="Assam">Assam</SelectItem>
                        <SelectItem value="Bihar">Bihar</SelectItem>
                        <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                        <SelectItem value="Goa">Goa</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Haryana">Haryana</SelectItem>
                        <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                        <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Kerala">Kerala</SelectItem>
                        <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Manipur">Manipur</SelectItem>
                        <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                        <SelectItem value="Mizoram">Mizoram</SelectItem>
                        <SelectItem value="Nagaland">Nagaland</SelectItem>
                        <SelectItem value="Odisha">Odisha</SelectItem>
                        <SelectItem value="Punjab">Punjab</SelectItem>
                        <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="Sikkim">Sikkim</SelectItem>
                        <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                        <SelectItem value="Telangana">Telangana</SelectItem>
                        <SelectItem value="Tripura">Tripura</SelectItem>
                        <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                        <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                        <SelectItem value="West Bengal">West Bengal</SelectItem>
                        <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                        <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                        <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                        <SelectItem value="Delhi">Delhi</SelectItem>
                        <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                        <SelectItem value="Ladakh">Ladakh</SelectItem>
                        <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                        <SelectItem value="Puducherry">Puducherry</SelectItem>
                        <SelectItem value="Other States">Other States</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 group">
                    <Label htmlFor="country" className="text-sm font-bold text-gray-700 mb-2 block">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                      className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 group-hover:border-pink-300"
                    />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="pincode" className="text-sm font-bold text-gray-700 mb-2 block">
                    Pincode
                  </Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
                    className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base px-4 w-full lg:w-1/2 group-hover:border-pink-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-end pt-8">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-6 border-2 border-gray-300 hover:border-[rgb(219,39,119)] hover:text-[rgb(219,39,119)] rounded-2xl transition-all duration-300 text-base font-semibold hover:bg-pink-50 hover:scale-105 hover:shadow-lg"
                onClick={() => router.push("/")}
              >
                Cancel Changes
              </Button>
              <Button
                type="submit"
                className="h-12 px-8 bg-gradient-to-r from-[rgb(219,39,119)] to-rose-500 hover:from-[rgb(199,29,109)] hover:to-rose-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-base font-bold"
                disabled={saving || imageLoading}
              >
                {saving ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Saving Your Profile...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Save className="w-5 h-5" />
                    Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
