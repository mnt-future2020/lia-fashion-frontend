import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Offers from "@/components/Offers/Offers";

const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Offers"} />
   {/* <Orders /> */}
   <Offers/>

</div>
  )
}

export default page