import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Orders from '@/components/Orders/Orders'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Orders"} />
   <Orders />
</div>
  )
}

export default page