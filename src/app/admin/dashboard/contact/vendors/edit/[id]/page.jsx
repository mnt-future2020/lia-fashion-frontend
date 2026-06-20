import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader"
import EditVendor from "@/components/Contacts/Vendors/EditVendor"

export default async function VendorEditPage({ params }) {
  return (
    <>
      <div className="mb-4">
        <Header headerName={"Vendor"} />
      </div>
      <EditVendor id={await params.id} />
    </>
  )
}