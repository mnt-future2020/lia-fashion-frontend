"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

const AddProfile = () => {
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-pink-200">
              {imagePreview ? (
                <AvatarImage src={imagePreview} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-pink-100">
                  <Upload className="w-8 h-8 text-pink-500" />
                </AvatarFallback>
              )}
            </Avatar>
            <Label
              htmlFor="profile-image"
              className="absolute bottom-0 right-0 p-2 bg-pink-500 rounded-full cursor-pointer hover:bg-pink-600 transition-colors"
            >
              <Upload className="w-4 h-4 text-white" />
              <span className="sr-only">Upload profile picture</span>
            </Label>
            <Input
              type="file"
              id="profile-image"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Personal Information Section */}
            <div className="flex-1">
              <CardTitle className="text-gray-400 uppercase text-lg mb-6">
                PERSONAL INFORMATION
              </CardTitle>

              <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="name" className="text-gray-500">Name</Label>
                  <Input type="text" id="name" />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="email" className="text-gray-500">Email ID</Label>
                  <Input type="email" id="email" />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="contact" className="text-gray-500">Contact</Label>
                  <Input type="tel" id="contact" />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <div>
                    <Label htmlFor="alt-contact" className="text-gray-500">Alternative</Label>
                    <p className="text-xs text-gray-400">(optional)</p>
                  </div>
                  <Input type="tel" id="alt-contact" />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="gender" className="text-gray-500">Gender</Label>
                  <Input type="text" id="gender" />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  <Label htmlFor="member-since" className="text-gray-500">Member Since</Label>
                  <Input type="text" id="member-since" />
                </div>
              </div>
            </div>

            {/* Shipping Address Section */}
            <div className="flex-1">
              <CardTitle className="text-gray-400 uppercase text-lg mb-6">
                SHIPPING ADDRESS
              </CardTitle>

              <div className="space-y-4">
                <Input 
                  type="text" 
                  placeholder="Address Line" 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Address Line1"
                  />
                  <Input
                    type="text"
                    placeholder="City/ Town/ Village"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    type="text" 
                    placeholder="District" 
                  />
                  <Input 
                    type="text" 
                    placeholder="State" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    type="text" 
                    placeholder="Country" 
                  />
                  <Input 
                    type="text" 
                    placeholder="Pincode" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
              Save
            </Button>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default AddProfile