"use client"

import { useState } from "react"
import OnlineCustomers from "./OnlineCustomers"
import OfflineCustomers from "./OfflineCustomers"

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("online")

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Tabs Section */}
        <div className="flex justify-center p-2 sm:p-4 lg:p-6">
          <div className="bg-white rounded-lg p-1 shadow-sm border w-full max-w-lg">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1">
              <button
                className={`px-3 py-2 sm:px-4 md:px-8 sm:py-3 rounded-md text-sm sm:text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                  activeTab === "online"
                    ? "bg-[#eb1c75] text-white shadow-sm transform scale-100"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("online")}
              >
                Online Customers
              </button>
              <button
                className={`px-3 py-2 sm:px-4 md:px-8 sm:py-3 rounded-md text-sm sm:text-base md:text-lg font-medium transition-all duration-200 flex-1 ${
                  activeTab === "offline"
                    ? "bg-[#eb1c75] text-white shadow-sm transform scale-100"
                    : "bg-transparent text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setActiveTab("offline")}
              >
                Offline Customers
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="w-full overflow-x-auto">
          {activeTab === "online" ? <OnlineCustomers /> : <OfflineCustomers />}
        </div>
      </div>
    </div>
  )
}
