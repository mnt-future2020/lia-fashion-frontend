"use client"
import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import { useRouter } from 'next/navigation'
import Products from '@/components/Products/Products'
const page = () => {

  return (
    <div className="bgclrrr pt-3">
      <Header headerName={"Products"} />
       <Products/>
    </div>
  )
}

export default page