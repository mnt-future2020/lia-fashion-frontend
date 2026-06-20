import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import PaymentHistory from '@/components/Payment History/PaymentHistory'
const page = () => {
  return (
    <div className="bgclrrr pt-3">
   <Header headerName={"Transaction"} />
   <PaymentHistory />
</div>
  )
}

export default page