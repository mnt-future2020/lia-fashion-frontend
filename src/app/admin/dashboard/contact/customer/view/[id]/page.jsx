import Header from "@/components/Dashboard/DashboardHeader/DashboardHeader"
import CustomerView from "@/components/Contacts/Customers/OnlineCustomerView"

export default function CustomerViewPage({ params }) {
  return (
    <>
      <Header />
      <CustomerView id={params.id} />
    </>
  )
}