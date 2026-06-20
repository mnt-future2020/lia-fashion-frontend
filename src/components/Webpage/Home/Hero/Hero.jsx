"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import axios from '../../../../lib/axios'
import { optimizeCloudinary } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HeroBanner() {
  const [currentImage, setCurrentImage] = useState(0);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/admin/banners');
        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % banners.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  const handlePrevious = () => {
    setCurrentImage((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentImage((prev) => (prev + 1) % banners.length);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-16">
          <div className="relative w-full h-auto">
            <div className="w-full h-[175px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[750px] 3xl:h-[850px]">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg sm:rounded-xl lg:rounded-2xl">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-lg sm:rounded-xl lg:rounded-2xl" 
                  style={{ backgroundSize: '200% 100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no banners, show a default banner
  if (banners.length === 0) {
    if (error) return null;
    return (
      <div className="w-full bg-white">
        <div className="max-w-[1920px] mx-auto ">
          <div className="relative w-full h-auto">
            <div className="w-full h-[175px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[750px] 3xl:h-[850px]">
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src="/assets/banner/banner.jpg" 
                  alt="Default Banner"
                  fill
                  className=""
                  sizes="(min-width: 1920px) 1920px, 100vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="max-w-[1920px] mx-auto relative">
        <div className="relative w-full h-auto">
          <div className="w-full h-[175px] sm:h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[750px] 3xl:h-[850px]">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImage ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={optimizeCloudinary(banner.image)}
                    alt={banner.title || "Banner"}
                    fill
                    className=""
                    sizes="(min-width: 1920px) 1920px, 100vw"
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-full z-20 transition-all duration-200 group"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 sm:p-2 rounded-full z-20 transition-all duration-200 group"
            aria-label="Next banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentImage ? 'bg-white w-4' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
