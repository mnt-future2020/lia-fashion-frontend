"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
import axios from "../../lib/axios"   
import { optimizeCloudinary } from "@/lib/utils"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"

// Custom styles for scrollbar and horizontal scrolling
const customStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .horizontal-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    cursor: grab;
  }
  .horizontal-scroll:active {
    cursor: grabbing;
  }
`

export default function SubCategoryComponent({ category }) {
  const [mounted, setMounted] = useState(false)
  const [otherCategories, setOtherCategories] = useState([])
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    fetchOtherCategories()
  }, [category])

  // Handle horizontal scrolling with mouse wheel
  useEffect(() => {
    const handleWheel = (e) => {
      if (scrollContainerRef.current) {
        e.preventDefault()
        scrollContainerRef.current.scrollLeft += e.deltaY
      }
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        scrollContainer.removeEventListener('wheel', handleWheel)
      }
    }
  }, [otherCategories])

  const fetchOtherCategories = async () => {
    try {
      const response = await axios.get('/api/admin/categories')
      // Filter out the current category and get other categories
      const filteredCategories = response.data.filter(cat => cat.id !== category?.id)
      setOtherCategories(filteredCategories)
    } catch (error) {
      // console.error('Failed to fetch other categories:', error)
    }
  }

  if (!mounted || !category) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx>{customStyles}</style>

      {/* Category Banner */}
      <div className="relative w-full h-[150px] sm:h-[200px] md:h-[250px] overflow-hidden">
        <Image
          src="/assets/banner/cat_image.png"
          alt={category.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{category.name}</h1>
            <p className="text-white/90 text-xs md:text-sm lg:text-base max-w-2xl mx-auto px-4 mb-4">
              Explore our collection of {category.name}
            </p>
            {/* Breadcrumb */}
            <nav className="flex justify-center" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link href="/" className="text-white/80 hover:text-white transition-colors text-xs md:text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronDown className="h-3 w-3 text-white/60 rotate-[-90deg] mx-1" />
                    <Link href="/#categories" className="text-white/80 hover:text-white transition-colors text-xs md:text-sm">
                      Categories
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronDown className="h-3 w-3 text-white/60 rotate-[-90deg] mx-1" />
                    <span className="text-white font-medium text-xs md:text-sm">{category.name}</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Subcategories Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-semibold">Browse {category.name} by Category</h2>

          {/* Category Quick Switcher - Desktop */}
          <div className="hidden lg:flex items-center space-x-2 max-w-md">
            <span className="text-sm text-gray-600 flex-shrink-0">Quick Switch:</span>
            <div 
              ref={scrollContainerRef}
              className="flex space-x-1 horizontal-scroll scrollbar-hide"
            >
              <div className="flex space-x-1 min-w-max">
                {otherCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-pink-50 hover:border-pink-200 transition-colors whitespace-nowrap flex-shrink-0"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Switcher - Mobile/Tablet Swiper */}
        {mounted && otherCategories.length > 0 && (
          <div className="lg:hidden mb-6 relative">
            <div className="flex items-center mb-3">
              <span className="text-sm text-gray-600 mr-3">Quick Switch:</span>
            </div>

            <div className="relative">
              <div className="category-swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md cursor-pointer">
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </div>

              <Swiper
                modules={[Navigation]}
                spaceBetween={8}
                slidesPerView="auto"
                navigation={{
                  prevEl: ".category-swiper-button-prev",
                  nextEl: ".category-swiper-button-next",
                }}
                className="w-full px-6"
              >
                {otherCategories.map((cat) => (
                  <SwiperSlide key={cat.id} className="!w-auto">
                    <Link
                      href={`/category/${cat.id}`}
                      className="inline-block px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:bg-pink-50 hover:border-pink-200 transition-colors whitespace-nowrap"
                    >
                      {cat.name}
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>

              <div className="category-swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-1 shadow-md cursor-pointer">
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </div>
            </div>
          </div>
        )}

        {/* Main Subcategories Grid */}
        {category.subcategories && category.subcategories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {category.subcategories
              .sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
              .map((subcategory) => (
              <Link
                key={subcategory.id}
                href={`/category/${category.id}/${subcategory.id}`}
                className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative overflow-hidden">
                  <div className="aspect-[3/4] relative">
                  <Image
                    src={optimizeCloudinary(subcategory.image) || "/placeholder.svg"}
                    alt={subcategory.name}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  </div>
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-medium text-sm sm:text-base">{subcategory.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    Shop Now
                    <ChevronRight className="inline-block w-3 h-3 ml-1" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No subcategories available for this category</p>
          </div>
        )}

        {/* Featured Collections Section */}
        <div className="mt-12 container mx-auto px-4 py-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Featured Collections</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured Collection 1 */}
            <div className="relative h-[200px] md:h-[250px] rounded-lg overflow-hidden group">
              <Image
                src="/assets/banner/image (2).jpg"
                alt="New Arrivals"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold">New Arrivals</h3>
                <p className="text-white/80 text-sm mb-3">Check out our latest collection</p>
                <Link
                  href="/#new-arrivals"
                  className="inline-block bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors w-fit"
                >
                  Explore
                </Link>
              </div>
            </div>

            {/* Featured Collection 2 */}
            <div className="relative h-[200px] md:h-[250px] rounded-lg overflow-hidden group">
              <Image
                src="/assets/banner/image (1).jpg"
                alt="Best Sellers"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold">Hot Selling</h3>
                <p className="text-white/80 text-sm mb-3">Our most popular items</p>
                <Link
                  href="/#hot-selling"
                  className="inline-block bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors w-fit"
                >
                  Shop Now
                </Link>
              </div>
            </div>

            {/* Featured Collection 3 */}
            <div className="relative h-[200px] md:h-[250px] rounded-lg overflow-hidden group">
              <Image
              src="/assets/banner/image (3).jpg"
                alt="Sale Items"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-white text-xl font-bold">Limited Products</h3>
                <p className="text-white/80 text-sm mb-3">Limited Time Offer</p>
                <Link
                  href="/#limited-products"
                  className="inline-block bg-white text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors w-fit"
                >
                  View Deals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}