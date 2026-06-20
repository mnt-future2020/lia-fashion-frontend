import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

export default function AboutMidBanner() {
  return (
    <section className="bg-primary py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] rounded-lg overflow-hidden">
          {/* Background Image */}
          <Image 
            src="/assets/bg/midbanner.png"
            alt="Background pattern"
            fill
            className="object-cover"
            priority
          />
          
          <div className="absolute inset-0 flex items-center">
            {/* Left content */}
            <div className="w-full lg:w-1/2 px-6 sm:px-8 lg:pl-12 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] font-serif font-bold text-[#ed1c75] mb-4 sm:mb-6 lg:mb-8 leading-tight max-w-xl">
                When You Walk Into A Room, Your Dress Should Speak Before You Do.
              </h2>

              <Link
                href="/products"
                className="inline-flex items-center bg-[#E91E63] text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 lg:py-4 rounded-full font-medium text-base sm:text-lg hover:bg-[#D81B60] transition-colors"
              >
                <span>Explore Your Signature Style</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>

            {/* Right image */}
            <div className="absolute right-0 h-full w-1/2 hidden lg:block">
              <Image 
                src="/assets/images/image01.png" 
                alt="Fashion model with shopping bags" 
                fill
                className="object-cover object-center"
                priority 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
