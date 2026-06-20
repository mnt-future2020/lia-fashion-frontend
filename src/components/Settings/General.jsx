import { Upload } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-toastify"
import axios from '../../lib/axios' 

export default function GeneralSettings() {
  const [form, setForm] = useState({
    logo: "",
    store_name: "",
    gst_no: "",
    contact_first_name: "",
    contact_last_name: "",
    mobile_no: "",
    landline_no: "",
    email: "",
    door_no: "",
    street_name: "",
    pin_code: "",
    district: "",
    state: "",
    country: "",
  })
  const [companyId, setCompanyId] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Fetch company details on mount
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true)
        const res = await axios.get("/api/admin/company")
        if (res.data) {
          setForm({
            logo: res.data.logo || "",
            store_name: res.data.store_name || "",
            gst_no: res.data.gst_no || "",
            contact_first_name: res.data.contact_first_name || "",
            contact_last_name: res.data.contact_last_name || "",
            mobile_no: res.data.mobile_no || "",
            landline_no: res.data.landline_no || "",
            email: res.data.email || "",
            door_no: res.data.door_no || "",
            street_name: res.data.street_name || "",
            pin_code: res.data.pin_code || "",
            district: res.data.district || "",
            state: res.data.state || "",
            country: res.data.country || "",
          })
          setCompanyId(res.data.id)
          setProfileImage(res.data.logo || null)
        }
      } catch (error) {
        if (!error.response?.status === 404) {
          toast.error('Error fetching company details')
          // console.error('Error fetching company details:', error)
        }
        // 404 means no company yet, that's fine
      } finally {
        setLoading(false)
      }
    }
    fetchCompany()
  }, [])

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Create a FormData object
      const formData = new FormData();
      formData.append('logo', file);
      
      // Update form with the file
      setForm({ ...form, logo: file });
      // For preview
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    try {
      const formData = new FormData();
      // Append all form fields except logo to FormData
      Object.keys(form).forEach(key => {
        if (key === 'logo') {
          // Only append logo if it's a File object
          if (form[key] instanceof File) {
            formData.append('logo', form[key]);
          }
        } else {
          formData.append(key, form[key]);
        }
      });

      const res = await axios.post('/api/admin/company', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (!companyId) {
        setCompanyId(res.data.id)
      }
      setSuccess(true)
      toast.success("Company details saved successfully")
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company details')
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(false), 2000)
    }
  }

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Company Details</h2>
        {success && <div className="text-green-600 font-semibold">Saved successfully!</div>}
        <form onSubmit={handleSave}>
        <div className="grid gap-6">
          {/* Logo Upload Section */}
          <div className="w-full">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
              <div className="w-24 h-24 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile image"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Label htmlFor="profile-upload" className="cursor-pointer p-2">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    <Input
                      id="profile-upload"
                      type="file"
                      className="hidden"
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </Label>
                )}
              </div>
              {profileImage && (
                <Button 
                  variant="outline" 
                  className="text-red-500 hover:text-red-600"
                  onClick={() => { setProfileImage(null); setForm({ ...form, logo: "" }) }}
                  type="button"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Store Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store_name">Store Name</Label>
              <Input 
                id="store_name"
                type="text" 
                placeholder="Store Name" 
                value={form.store_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_no">GST No</Label>
              <Input 
                id="gst_no"
                type="text" 
                placeholder="GST No" 
                value={form.gst_no}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Contact Person Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_first_name">Contact Person</Label>
              <Input 
                id="contact_first_name"
                type="text" 
                placeholder="First Name" 
                value={form.contact_first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_last_name" className="invisible">Last Name</Label>
              <Input 
                id="contact_last_name"
                type="text" 
                placeholder="Last Name" 
                value={form.contact_last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_no">Mobile No</Label>
              <Input 
                id="mobile_no"
                type="text" 
                placeholder="Mobile No" 
                value={form.mobile_no}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landline_no">Landline No</Label>
              <Input 
                id="landline_no"
                type="text" 
                placeholder="Landline No" 
                value={form.landline_no}
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-1 space-y-2">
              <Label htmlFor="email">Email ID</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="Email ID" 
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <Label htmlFor="address">Address</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                id="door_no"
                type="text" 
                placeholder="Door No." 
                value={form.door_no}
                onChange={handleChange}
                required
              />
              <Input 
                id="street_name"
                type="text" 
                placeholder="Street Name" 
                value={form.street_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                id="pin_code"
                type="text" 
                placeholder="Pin Code" 
                value={form.pin_code}
                onChange={handleChange}
                required
              />
              <Input 
                id="district"
                type="text" 
                placeholder="District" 
                value={form.district}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                id="state"
                type="text" 
                placeholder="State" 
                value={form.state}
                onChange={handleChange}
                required
              />
              <Input 
                id="country"
                type="text" 
                placeholder="Country" 
                value={form.country}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
        </form>
      </CardContent>
    </Card>
  )
}