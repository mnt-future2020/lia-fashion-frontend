import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Coupouns from '@/components/Coupons/Coupons'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Coupons"} />
   <Coupouns/>
 
</div>
  )
}

export default page