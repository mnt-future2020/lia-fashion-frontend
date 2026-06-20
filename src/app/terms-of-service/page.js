import Navbar from "@/components/Webpage/Navbar/Navbar"
import Hero from "@/components/Webpage/TermsOfService/Hero"
import TermsOfService from "@/components/Webpage/TermsOfService/TermsOfService"
import Footer from "@/components/Webpage/Footer/Footer"


export default function About() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <TermsOfService />
      </div>
      <Footer />
    </>
  )
};