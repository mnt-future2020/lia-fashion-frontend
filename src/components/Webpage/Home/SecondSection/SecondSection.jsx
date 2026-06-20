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
        // console.error('Failed to fetch categories:', error)
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
        <div className="relative w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] xl:w-[150px] xl:h-[150px] rounded-2xl overflow-hidden">
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
    <section className="w-full py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Shop by Category</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our most coveted pieces that everyone&#39;s talking about
        </p>
        <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
      </div>
        {/* Mobile & Tablet Swiper (hidden on large screens) */}
        {mounted && categories.length > 0 && (
          <div className="xl:hidden relative">
            <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md cursor-pointer hidden md:flex">
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </div>

            <Swiper
              modules={[Pagination, Navigation]}
              spaceBetween={16}
              slidesPerView={2.2}
              centeredSlides={false}
              pagination={{
                clickable: true,
                el: ".swiper-pagination",
              }}
              navigation={{
                prevEl: ".swiper-button-prev-custom",
                nextEl: ".swiper-button-next-custom",
              }}
              breakpoints={{
                // Mobile
                320: {
                  slidesPerView: 2.2,
                  spaceBetween: 16,
                },
                // Tablet
                640: {
                  slidesPerView: 3.5,
                  spaceBetween: 20,
                },
                // Larger Tablet
                768: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
                // Small Laptop
                1024: {
                  slidesPerView: 5,
                  spaceBetween: 24,
                },
                // Medium Laptop
                1280: {
                  slidesPerView: 6,
                  spaceBetween: 24,
                },
              }}
              className="w-full max-w-[90rem] mx-auto"
            >
              {categories.map((category) => (
                <SwiperSlide key={category.id} className="pb-10">
                  {renderCategoryItem(category)}
                </SwiperSlide>
              ))}
              <div className="swiper-pagination mt-6"></div>
            </Swiper>

            <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md cursor-pointer hidden md:flex">
              <ChevronRight className="h-6 w-6 text-gray-700" />
            </div>
          </div>
        )}

        {/* Desktop view (hidden on small screens) */}
        <div className="hidden xl:grid grid-cols-8 gap-4 2xl:gap-6 max-w-7xl mx-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex justify-center">
              {renderCategoryItem({
                name: category.name,
                image: category.image,
                href: `/category/${category.id}`
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
