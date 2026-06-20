import Navbar from "@/components/Webpage/Navbar/Navbar"
import Hero from "@/components/Webpage/ShippingPolicy/Hero"
import ShippingPolicy from "@/components/Webpage/ShippingPolicy/ShippingPolicy"
import Footer from "@/components/Webpage/Footer/Footer"


export default function About() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <ShippingPolicy />
      </div>
      <Footer />
    </>
  )
};