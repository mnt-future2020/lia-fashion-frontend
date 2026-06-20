import Navbar from "@/components/Webpage/Navbar/Navbar"
import Hero from "@/components/Webpage/PrivacyPolicy/Hero"
import PrivacyPolicy from "@/components/Webpage/PrivacyPolicy/PrivacyPolicy"
import Footer from "@/components/Webpage/Footer/Footer"


export default function About() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <PrivacyPolicy />
      </div>
      <Footer />
    </>
  )
};