import SubCategoryProductPageComponent from "@/components/Category/sub-category-product-page"
import Footer from "@/components/Webpage/Footer/Footer"
import Navbar from "@/components/Webpage/Navbar/Navbar"


export default function SubCategoryPage({ params }) {
  return ( 
  <>
  <Navbar />
  <SubCategoryProductPageComponent categoryId={params.id} subcategoryId={params.subId} /> 
  <Footer />
  </>
  )
}
