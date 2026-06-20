import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import axios from '../../../../lib/axios'
import { optimizeCloudinary } from "@/lib/utils"

const SubcategoriesSection = () => {
  const [subcategories, setSubcategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        // Fetch public subcategories (optionally limit to 12 on backend or slice here)
        const response = await axios.get('/api/subcategories')
        const featuredSubcategories = response.data.slice(0, 12)
        setSubcategories(featuredSubcategories)
      } catch (error) {
        // console.error('Failed to fetch subcategories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubcategories()
  }, [])

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="py-12 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Shop by Collections</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our curated collections designed for every style and occasion
          </p>
          <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
        </div>
        {/* Loading skeleton grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-[200px] rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // If no subcategories found
  if (subcategories.length === 0) {
    return null;
  }

  // Main content with subcategories
  return (
    <section className="py-12 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Shop by Collections</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore our curated collections designed for every style and occasion
        </p>
        <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {subcategories.map((subcategory) => (
          <Link 
            key={subcategory.id} 
            href={`/category/${subcategory.category_id}/${subcategory.id}`}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/5] transition-all duration-300 group-hover:scale-105 shadow-sm group-hover:shadow-lg">
              <Image
                src={optimizeCloudinary(subcategory.image) || "/placeholder.svg"}
                alt={subcategory.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* Gradient overlay always visible for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              
              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-center text-sm md:text-base tracking-wide">
                  {subcategory.name}
                </h3>
              </div>
              
              {/* Subtle border on hover */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-200 rounded-xl transition-colors duration-300"></div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-10">
        <Link href="/products">
          <button className="px-8 py-3 border-2 hover:border-[#eb1c75] hover:bg-white hover:text-[#eb1c75] bg-[#eb1c75] text-white transition-colors duration-300 font-medium">
            View All Products
          </button>
        </Link>
      </div>
    </section>
  )
}

export default SubcategoriesSection 