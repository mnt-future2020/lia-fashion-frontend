import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader";
import CreateVendor from "@/components/Contacts/Vendors/CreateVendor";

export default function DashboardPage() {
  return (
    <>
      <div className="bgclrrr pt-3">
      <Header headerName={"Dashboard"} />
      </div>
      <CreateVendor />
    </>
  )
};