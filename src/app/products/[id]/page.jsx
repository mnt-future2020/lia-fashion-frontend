import Navbar from "@/components/Webpage/Navbar/Navbar"
import ProductDetail from "@/components/Webpage/Home/HotSellingSection/ProductDetail"
import Footer from "@/components/Webpage/Footer/Footer"

export default function ProductPage({ params }) {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <ProductDetail productId={parseInt(params.id)} />
      </div>
      <Footer />
    </>
  )
}
