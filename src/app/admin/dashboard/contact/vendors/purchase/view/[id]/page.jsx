"use client"

import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader"
import ViewPurchaseEntry from "@/components/Contacts/Vendors/ViewPurchaseEntry"

export default function ViewPurchasePage() {
  return (
    <>
      <div className="mb-4">
        <Header headerName="View Purchase" />
      </div>
      <ViewPurchaseEntry />
    </>
  )
}