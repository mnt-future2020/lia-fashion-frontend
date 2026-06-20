"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Star, SlidersHorizontal, Search, ShoppingBag, Heart, ArrowLeft } from "lucide-react"
import { categoryService, productService } from "../../services/categoryService"
import { optimizeCloudinary } from "@/lib/utils"

export default function CategoryDetail({ categoryId }) {
  const [mounted, setMounted] = useState(false)
  const [category, setCategory] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortOption, setSortOption] = useState("featured")
  const [filterOpen, setFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to get product price info (same as ProductCard)
  const getProductPricing = (product) => {
    const defaultSize = product.size_prices?.[0] || {}
    const mrp = defaultSize.mrp || 0
    const sellingPrice = defaultSize.price || mrp
    const discount = mrp ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0
    
    return {
      mrp,
      sellingPrice,
      discount,
      hasDiscount: mrp > sellingPrice
    }
  }

  // Fetch category and products data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch category details
        const categoryData = await categoryService.getCategory(categoryId)
        if (!categoryData) {
          setError('Category not found')
          return
        }
        
        // Fetch products for this category (use direct backend data)
        const productsData = await productService.getProductsByCategory(categoryId)
        
        setCategory(categoryData)
        setAllProducts(productsData)
        setFilteredProducts(productsData)
        setError(null)
      } catch (err) {
        // console.error('Failed to fetch data:', err)
        setError('Failed to load category data')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchData()
    }
  }, [categoryId])

  // Filter and sort products
  useEffect(() => {
    if (!mounted || !allProducts.length) return

    let filtered = [...allProducts]

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply price filter (using selling price)
    filtered = filtered.filter((product) => {
      const { sellingPrice } = getProductPricing(product)
      return sellingPrice >= priceRange[0] && sellingPrice <= priceRange[1]
    })

    // Apply rating filter (mock rating for now since it's not in backend)
    if (selectedRating > 0) {
      // For now, we'll use a mock rating system
      filtered = filtered.filter(() => Math.random() > 0.3) // Random filter for demo
    }

    // Apply sorting
    switch (sortOption) {
      case "price-low-high":
        filtered.sort((a, b) => {
          const priceA = getProductPricing(a).sellingPrice
          const priceB = getProductPricing(b).sellingPrice
          return priceA - priceB
        })
        break
      case "price-high-low":
        filtered.sort((a, b) => {
          const priceA = getProductPricing(a).sellingPrice
          const priceB = getProductPricing(b).sellingPrice
          return priceB - priceA
        })
        break
      case "newest":
        filtered = filtered.filter((p) => p.badge === 'New arrival').concat(filtered.filter((p) => p.badge !== 'New arrival'))
        break
      case "bestseller":
        filtered = filtered.filter((p) => p.badge === 'Best Seller').concat(filtered.filter((p) => p.badge !== 'Best Seller'))
        break
      default:
        // Featured is default
        break
    }

    setFilteredProducts(filtered)
  }, [sortOption, priceRange, selectedRating, searchQuery, mounted, allProducts])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!mounted || !category) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Link>
      </div>

      {/* Category Banner */}
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] overflow-hidden">
        <Image
          src={optimizeCloudinary(category.image) || "/placeholder.svg?height=350&width=1200&text=Category Banner"}
          alt={category.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{category.name}</h1>
            <p className="text-white/90 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4">
              Explore our collection of {category.name}
            </p>
            
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200 mr-2"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <span>Filter</span>
            </button>

            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="appearance-none bg-white pl-4 pr-10 py-2 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                <option value="featured">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="bestseller">Bestsellers</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search in this category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Filter Panel - Mobile Friendly */}
        {filterOpen && (
          <div className="bg-white p-4 rounded-md shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                  className="w-full accent-pink-500"
                />
                <input
                  type="range"
                  min="0"
                  max="15000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="font-medium mb-3">Rating</h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <input
                      type="radio"
                      id={`rating-${rating}`}
                      name="rating"
                      checked={selectedRating === rating}
                      onChange={() => setSelectedRating(rating)}
                      className="mr-2 accent-pink-500"
                    />
                    <label htmlFor={`rating-${rating}`} className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-1 text-sm text-gray-600">& Up</span>
                    </label>
                  </div>
                ))}
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="rating-all"
                    name="rating"
                    checked={selectedRating === 0}
                    onChange={() => setSelectedRating(0)}
                    className="mr-2 accent-pink-500"
                  />
                  <label htmlFor="rating-all">All Ratings</label>
                </div>
              </div>
            </div>

            {/* Apply/Clear Buttons */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-4 mt-4">
              <button
                onClick={() => {
                  setPriceRange([0, 5000])
                  setSelectedRating(0)
                  setSearchQuery("")
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Product Count */}
        <p className="text-gray-600 mb-6">Showing {filteredProducts.length} products</p>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const { mrp, sellingPrice, discount, hasDiscount } = getProductPricing(product)
            
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="relative">
                  <Link href={`/products/${product.id}`}>
                    <div className="relative h-[180px] sm:h-[200px]">
                      <Image 
                        src={optimizeCloudinary(product.image) || "/placeholder.svg"} 
                        alt={product.name} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    </div>
                  </Link>

                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#eb1c75] text-white text-xs px-2 py-1 rounded">
                        {product.badge}
                      </span>
                    </div>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {discount}% OFF
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white">
                    <Heart className="h-4 w-4 text-gray-600 hover:text-pink-500" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <h3 className="font-medium text-sm sm:text-base line-clamp-1 mb-2">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>

                  {/* Price */}
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="text-sm md:text-base font-semibold">₹{sellingPrice}</span>
                    {hasDiscount && (
                      <>
                        <span className="text-xs md:text-sm text-gray-500 line-through">
                          ₹{mrp}
                        </span>
                        <span className="text-xs md:text-sm text-green-600">
                          ({discount}% OFF)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Mock Rating */}
                  <div className="mb-3 flex items-center justify-center">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-xs text-gray-600">(156)</span>
                  </div>

                  {/* Add to Cart Button */}
                  <button className="w-full bg-pink-100 hover:bg-pink-200 text-pink-800 py-1.5 rounded-md text-sm flex items-center justify-center">
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                    Add to Cart
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No products match your current filters</p>
            <button
              onClick={() => {
                setPriceRange([0, 5000])
                setSelectedRating(0)
                setSortOption("featured")
                setSearchQuery("")
              }}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
