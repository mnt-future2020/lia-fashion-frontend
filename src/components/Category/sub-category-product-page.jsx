"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import ProductDetail from "./product-detail"
import { categoryService, productService } from "@/services/categoryService"

// This is a mock database of categories and their subcategories
const categories = [
  {
    id: "ethnic-wear",
    name: "Ethnic Wear",
    subcategories: [
      { id: "sarees", name: "Sarees" },
      { id: "kurtas", name: "Kurtas & Kurtis" },
      { id: "lehengas", name: "Lehengas" },
      { id: "ethnic-sets", name: "Ethnic Sets" },
      { id: "ethnic-bottoms", name: "Ethnic Bottoms" },
      { id: "blouses", name: "Blouses" },
      { id: "dupattas", name: "Dupattas" },
      { id: "ethnic-gowns", name: "Ethnic Gowns" },
    ],
  },
  {
    id: "western-dresses",
    name: "Western Dresses",
    subcategories: [
      { id: "casual-dresses", name: "Casual Dresses" },
      { id: "formal-dresses", name: "Formal Dresses" },
      { id: "maxi-dresses", name: "Maxi Dresses" },
      { id: "mini-dresses", name: "Mini Dresses" },
      { id: "party-dresses", name: "Party Dresses" },
      { id: "bodycon-dresses", name: "Bodycon Dresses" },
    ],
  },
  {
    id: "menswear",
    name: "Menswear",
    subcategories: [
      { id: "shirts", name: "Shirts" },
      { id: "t-shirts", name: "T-Shirts" },
      { id: "jeans", name: "Jeans" },
      { id: "trousers", name: "Trousers" },
      { id: "suits", name: "Suits" },
      { id: "ethnic-wear-men", name: "Ethnic Wear" },
      { id: "activewear-men", name: "Activewear" },
    ],
  },
  {
    id: "footwear",
    name: "Footwear",
    subcategories: [
      { id: "casual-shoes", name: "Casual Shoes" },
      { id: "formal-shoes", name: "Formal Shoes" },
      { id: "sports-shoes", name: "Sports Shoes" },
      { id: "sandals", name: "Sandals" },
      { id: "heels", name: "Heels" },
      { id: "flats", name: "Flats" },
      { id: "boots", name: "Boots" },
    ],
  },
  {
    id: "home-decor",
    name: "Home Decor",
    subcategories: [
      { id: "bedding", name: "Bedding" },
      { id: "curtains", name: "Curtains" },
      { id: "cushions", name: "Cushions" },
      { id: "wall-decor", name: "Wall Decor" },
      { id: "lamps", name: "Lamps" },
      { id: "vases", name: "Vases" },
    ],
  },
  {
    id: "beauty",
    name: "Beauty",
    subcategories: [
      { id: "makeup", name: "Makeup" },
      { id: "skincare", name: "Skincare" },
      { id: "haircare", name: "Haircare" },
      { id: "fragrances", name: "Fragrances" },
      { id: "bath-body", name: "Bath & Body" },
    ],
  },
  {
    id: "accessories",
    name: "Accessories",
    subcategories: [
      { id: "bags", name: "Bags" },
      { id: "jewelry", name: "Jewelry" },
      { id: "watches", name: "Watches" },
      { id: "sunglasses", name: "Sunglasses" },
      { id: "belts", name: "Belts" },
      { id: "scarves", name: "Scarves" },
    ],
  },
  {
    id: "grocery",
    name: "Grocery",
    subcategories: [
      { id: "fruits-vegetables", name: "Fruits & Vegetables" },
      { id: "dairy", name: "Dairy" },
      { id: "bakery", name: "Bakery" },
      { id: "snacks", name: "Snacks" },
      { id: "beverages", name: "Beverages" },
      { id: "household", name: "Household" },
    ],
  },
]

// Generate mock products for each subcategory
const generateProducts = (categoryId, subcategoryId, count = 12) => {
  const category = categories.find((cat) => cat.id === categoryId)
  if (!category) return []

  const subcategory = category.subcategories.find((sub) => sub.id === subcategoryId)
  if (!subcategory) return []

  return Array.from({ length: count }, (_, i) => ({
    id: `${subcategoryId}-product-${i + 1}`,
    name: `${subcategory.name} Product ${i + 1}`,
    price: Math.floor(Math.random() * 5000) + 500,
    image: `/placeholder.svg?height=300&width=300&text=${subcategory.name} ${i + 1}`,
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviews: Math.floor(Math.random() * 500),
    isNew: i < 3,
    isBestseller: i >= 3 && i < 6,
    discount: i % 3 === 0 ? Math.floor(Math.random() * 30) + 10 : 0,
  }))
}

export default function SubCategoryProductPageComponent({ categoryId, subcategoryId }) {
  const router = useRouter()
  const [category, setCategory] = useState(null)
  const [subcategory, setSubcategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        
        // Fetch category data
        const categoryData = await categoryService.getCategory(categoryId)
        if (!categoryData) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Fetch subcategory data
        const subcategoryData = await categoryService.getSubcategory(categoryId, subcategoryId)
        if (!subcategoryData) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Fetch products for this subcategory (use direct backend data)
        const productsData = await productService.getProductsBySubcategory(categoryId, subcategoryId)
        
        setCategory(categoryData)
        setSubcategory(subcategoryData)
        setProducts(productsData)
      } catch (err) {
        // console.error('Failed to fetch data:', err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId && subcategoryId) {
      fetchData()
    }
  }, [categoryId, subcategoryId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Not found state
  if (notFound || (!category || !subcategory)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Category Not Found</h2>
          <p className="text-gray-600 mb-8">The category or subcategory you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={() => router.push('/')} 
            className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            Go Home
          </button>
        </div>
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

  return <ProductDetail category={category} subcategory={subcategory} products={products} />
}
