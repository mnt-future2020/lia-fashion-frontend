import Navbar from "@/components/Webpage/Navbar/Navbar"
import Hero from "@/components/Webpage/AboutUs/Hero/Hero"
import OurStory from "@/components/Webpage/AboutUs/OurStory/OurStory"
import EasyToBuy from "@/components/Webpage/AboutUs/EasyToBuy/EasyToBuy"
import LastSection from "@/components/Webpage/AboutUs/LastSection/LastSection"
import Footer from "@/components/Webpage/Footer/Footer"


export default function About() {
  return (
    <>
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <OurStory />
        <EasyToBuy />
      </div>
      <LastSection />
      <Footer />
    </>
  )
};