"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Pagination, Navigation } from "swiper/modules"
import { ChevronLeft, ChevronRight } from "lucide-react"
import axios from '../../../../lib/axios'
import { optimizeCloudinary } from "@/lib/utils"

// Import Swiper styles
import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"

export default function CategorySection() {
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Handle hydration mismatch by only rendering Swiper on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/admin/categories')
        setCategories(data)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-full bg-gray-200 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] xl:w-[150px] xl:h-[150px] mb-3 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Render category item with proper href formatting
  const renderCategoryItem = (category) => (
    <Link 
      href={`/category/${category.id || ''}`} 
      className="flex flex-col items-center"
    >
      <div className="rounded-full bg-[#FFF0F5] p-1 mb-3 transition-transform hover:scale-105">
        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] xl:w-[150px] xl:h-[150px] rounded-full overflow-hidden">
          <Image 
            src={optimizeCloudinary(category.image) || "/placeholder.svg"} 
            alt={category.name} 
            fill 
            className="object-cover" 
          />
        </div>
      </div>
      <span className="text-center text-sm sm:text-base font-medium text-gray-800">
        {category.name}
      </span>
    </Link>
  )

  return (
    <>
      <style jsx global>{`
        .category-swiper .swiper-pagination-bullet {
          background-color: #eb1c75 !important;
          opacity: 0.3;
        }
        .category-swiper .swiper-pagination-bullet-active {
          background-color: #eb1c75 !important;
          opacity: 1;
        }
        .category-prev-btn, .category-next-btn {
          opacity: 0.8;
          transition: all 0.3s ease;
        }
        .category-prev-btn:hover, .category-next-btn:hover {
          opacity: 1;
          transform: translateY(-50%) scale(1.05);
        }
        .category-prev-btn.swiper-button-disabled, 
        .category-next-btn.swiper-button-disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .category-prev-btn, .category-next-btn {
            width: 32px !important;
            height: 32px !important;
            padding: 6px !important;
            background-color: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(0, 0, 0, 0.1) !important;
          }
          .category-prev-btn svg, .category-next-btn svg {
            width: 16px !important;
            height: 16px !important;
          }
          .category-prev-btn {
            left: 8px !important;
          }
          .category-next-btn {
            right: 8px !important;
          }
        }
      `}</style>
      <section className="w-full py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Shop by Category</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our most coveted pieces that everyone&apos;s talking about
        </p>
        <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
      </div>
        {/* Swiper for all screen sizes */}
        {mounted && categories.length > 1 && (
          <div className="relative">
            {/* Navigation Buttons */}
            <button className="category-prev-btn absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-2 shadow-md transition-all duration-200 hover:shadow-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button className="category-next-btn absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-2 shadow-md transition-all duration-200 hover:shadow-lg">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>

            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={2}
              centeredSlides={false}
              centerInsufficientSlides={true}
              navigation={{
                prevEl: ".category-prev-btn",
                nextEl: ".category-next-btn",
              }}
              pagination={{
                clickable: true,
                el: ".swiper-pagination",
                dynamicBullets: true,
              }}
              breakpoints={{
                320: { slidesPerView: 2, spaceBetween: 12 },
                640: { slidesPerView: 3, spaceBetween: 20 },
                768: { slidesPerView: 4, spaceBetween: 24 },
                1024: { slidesPerView: 5, spaceBetween: 30 },
                1280: { slidesPerView: 6, spaceBetween: 48 },
                1440: { slidesPerView: 6, spaceBetween: 56 },
                1600: { slidesPerView: 6, spaceBetween: 64 },
              }}
              className="w-full max-w-[90rem] mx-auto category-swiper px-6 md:px-12"
            >
              {categories.map((category) => (
                <SwiperSlide key={category.id} className="pb-10">
                  {renderCategoryItem(category)}
                </SwiperSlide>
              ))}
              <div className="swiper-pagination mt-6"></div>
            </Swiper>
          </div>
        )}

        {/* Adjust layout based on the number of categories */}
        {categories.length === 1 && (
          <div className="flex justify-center items-center h-full">
            {renderCategoryItem(categories[0])}`
          </div>
        )}
      </div>
    </section>
    </>
  )
}