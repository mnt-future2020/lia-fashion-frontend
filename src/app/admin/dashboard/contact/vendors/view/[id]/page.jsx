import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader"
import ViewVendor from "@/components/Contacts/Vendors/ViewVendor"

export default function VendorViewPage({ params }) {
  return (
    <>
      <div className="mb-4">
        <Header headerName={"Vendor Details"} />
      </div>
      <ViewVendor id={params.id} />
    </>
  )
}