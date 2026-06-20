import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Settings from '@/components/Settings/Settings'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Settings"} />
   <Settings />
</div>
  )
}

export default page