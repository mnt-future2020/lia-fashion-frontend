import React from 'react'
import Header from '@/components/Dashboard/DashboardHeader/DashboardHeader'
import AddProducts from '@/components/Products/AddProducts'

const AddProductPage = () => {
  return (
    <div className="bgclrrr pt-3">
      <Header headerName={"Add Product"} />
      <AddProducts />
    </div>
  )
}

export default AddProductPage