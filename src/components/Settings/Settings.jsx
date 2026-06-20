"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import General from "./General"
import PaymentGateway from "./PaymentGateway"
import Shipping from "./Shipping"
import InvoiceSettings from "./InvoiceSettings"
import Cloudinary from "./Cloudinary"
import Banner from "./Banner"
import Shiprocket from "./Shiprocket"


const Settings = () => {
  const [activeTab, setActiveTab] = useState("General")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { key: "General", title: "General" },
    { key: "Payment Gateway", title: "Payment Gateway" },
    { key: "Shipping", title: "Shipping" },
    { key: "Order Management", title: "Order Management" },
    { key: "Shiprocket", title: "Shiprocket" },
    { key: "Cloudinary", title: "Cloudinary" },
    { key: "Banners", title: "Banners" }
  ]
  const renderContent = () => {
    switch (activeTab) {
      case "General":
        return <General/>
      case "Payment Gateway":
        return <PaymentGateway />
      case "Shipping":
        return <Shipping />
      case "Order Management":
        return <InvoiceSettings />
      case "Shiprocket":
        return <Shiprocket />
      case "Cloudinary":
        return <Cloudinary />
      case "Banners":
        return <Banner />
      default:
        return <General />
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 p-3 md:p-6">
      <div className="max-w-[90%] mx-auto">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-2 md:px-6 md:py-3 rounded-md text-sm md:text-base font-medium transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-[#eb1c75] text-white shadow-sm transform scale-100"
                      : "bg-transparent text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Settings
