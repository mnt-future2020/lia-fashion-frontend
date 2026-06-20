import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import CreateCoupon from '@/components/Coupons/CreateCoupons'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Coupons"} />
   <CreateCoupon/>
</div>
  )
}

export default page