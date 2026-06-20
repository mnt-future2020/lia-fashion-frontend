import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import POS from '@/components/POS/POS'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"POS"} />
   <POS />
</div>
  )
}

export default page