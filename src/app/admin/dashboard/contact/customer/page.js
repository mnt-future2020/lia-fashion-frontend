import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Customer from '@/components/Contacts/Customers/Customers'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Customers"} />
   <Customer/>
</div>
  )
}

export default page