import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import Category from '@/components/Category/Category'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Category"} />
   <Category/>
</div>
  )
}

export default page