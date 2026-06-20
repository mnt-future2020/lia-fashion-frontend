"use client"

import { useParams, useSearchParams } from "next/navigation"
import PurchaseEntryForm from "@/components/Contacts/Vendors/AddNewEntry"
import { initialVendors } from "@/data/vendorsData"
import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader"
import { use } from "react"

export default function ViewPurchasePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const vendorId = params?.id
  const purchaseNo = searchParams.get("purchaseNo")
  
  const vendor = initialVendors.find(v => v.id === vendorId)
  const purchase = vendor?.products.find(p => p.purchaseNo === purchaseNo)

  return (
    <>
      <div className="mb-4">
        <Header headerName="View Purchase" />
      </div>
      <PurchaseEntryForm 
        initialData={{ vendor, purchase }}
        readOnly={true}
      />
    </>
  )
}