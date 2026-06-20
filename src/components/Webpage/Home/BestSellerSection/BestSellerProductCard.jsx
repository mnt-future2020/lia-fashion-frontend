"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { optimizeCloudinary } from "@/lib/utils"

const ProductCard = ({ product }) => {
  const router = useRouter()
  const { id, name, image, badge, category, size_prices } = product

  // Get the first size's price information
  const defaultSize = size_prices?.[0] || {}
  const price = defaultSize.mrp || 0
  const discountedPrice = defaultSize.price || price
  const discount = price ? Math.round(((price - discountedPrice) / price) * 100) : 0

  const handleQuickView = () => {
    router.push(`/products/${id}`)
  }

  return (
    <div className="group relative">
      {/* Product Image with Badge */}
      <div className="relative overflow-hidden mb-3">
        <Link href={`/products/${id}`}>
          <div className="aspect-[3/4] relative">
            <Image
              src={optimizeCloudinary(image)}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Badge */}
        {badge && (
          <span className="absolute top-2 left-2 bg-[#eb1c75] text-white text-xs px-2 py-1">
            {badge}
          </span>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#ed1c75] bg-opacity-90 py-3 px-2 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex justify-center space-x-2 text-white">
            <button 
              onClick={handleQuickView}
              className="text-xs md:text-sm hover:underline"
            >
              Quick View
            </button>
            {/* <span className="text-white">|</span>
            <button className="text-xs md:text-sm hover:underline">
              Add to Cart
            </button> */}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">{category}</p>
        <h3 className="text-sm md:text-base font-medium mb-1">
          <Link href={`/products/${id}`} className="hover:underline">
            {name}
          </Link>
        </h3>
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm md:text-base font-semibold">₹{discountedPrice}</span>
          {price > discountedPrice && (
            <>
              <span className="text-xs md:text-sm text-gray-500 line-through">
                ₹{price}
              </span>
              <span className="text-xs md:text-sm text-green-600">
                ({discount}% OFF)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
