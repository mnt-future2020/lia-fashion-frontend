import Navbar from "@/components/Webpage/Navbar/Navbar"
import Hero from "@/components/Webpage/RefundPolicy/Hero"
import RefundPolicy from "@/components/Webpage/RefundPolicy/RefundPolicy"
import Footer from "@/components/Webpage/Footer/Footer"


export default function About() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <RefundPolicy />
      </div>
      <Footer />
    </>
  )
};