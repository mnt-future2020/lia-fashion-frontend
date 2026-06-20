import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader";
import Vendors from "@/components/Contacts/Vendors/AddNewEntry";

export default function DashboardPage() {
  return (
    <>
      <div className="bgclrrr pt-3">
      <Header headerName={"Dashboard"} />
      </div>
      <Vendors />
    </>
  )
};