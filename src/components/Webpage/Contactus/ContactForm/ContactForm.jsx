"use client"

import { Phone, Mail, MapPin } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'react-toastify'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      toast.success("Message sent successfully!")
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        message: "",
      })
    } catch (error) {
      // console.error('Error sending message:', error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-pink-100 rounded-lg overflow-hidden shadow-lg">
          <div className="grid lg:grid-cols-2">
            {/* Left Section */}
            <div className="p-8 md:p-12">
              <h1 className="text-3xl font-bold text-[#ed1c75] mb-6">Contact With Us</h1>
              <p className="text-gray-600 mb-12">
                Whether it&#39;s a styling query, order support, or a simple hello — we&#39;re here to help with warmth and
                care.
              </p>

              <div className="space-y-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-gray-700 font-medium">+91 93841 09680</span>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-gray-700 font-medium">liafashionpondy@gmail.com</span>
                </div>

                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-gray-700 font-medium">Pondicherry</span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="p-8 md:p-12 bg-pink-100">
              <div className="bg-gray-800 p-8 md:p-12 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-pink-100 mb-2">Get in Touch</h2>
                <p className="text-pink-100 mb-6">We&#39;d love to hear from you.</p>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="First Name"
                        required
                        className="placeholder:text-white/70 bg-transparent text-white border-white/30"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Last Name"
                        required
                        className="placeholder:text-white/70 bg-transparent text-white border-white/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number"
                        required
                        className="placeholder:text-white/70 bg-transparent text-white border-white/30"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Id"
                        required
                        className="placeholder:text-white/70 bg-transparent text-white border-white/30"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Message"
                      rows={5}
                      required
                      className="placeholder:text-white/70 bg-transparent text-white border-white/30"
                    />
                  </div>

                  <div className="flex justify-center md:justify-start">
                    <Button
                      type="submit"
                      className="bg-[#ed1c75] hover:bg-[#ed1c75]/90"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="mt-8 rounded-lg overflow-hidden shadow-lg h-[400px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d976.0311244154228!2d79.80943261961782!3d11.896418311571061!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361e64b7d57dd%3A0x4e5cff4b1c4f039b!2sBharathi%20Nagar%2C%20kayanthope%2C%20Ariyankuppam%2C%20Puducherry%20605007!5e0!3m2!1sen!2sin!4v1751518918361!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Google Maps"
          ></iframe>
        </div>
      </div>
    </div>
  )
}
