import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Vendors from '@/components/Contacts/Vendors/Vendors'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Vendors"} />
   <Vendors />
</div>

  )
}

export default page