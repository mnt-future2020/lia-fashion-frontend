"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SubCategoryComponent from "./sub-category"
import { categoryService } from "@/services/categoryService"

export default function CategoryPageComponent({ categoryId }) {
  const router = useRouter()
  const [category, setCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)
        
        // Fetch category details
        const categoryData = await categoryService.getCategory(categoryId)
        if (!categoryData) {
          setNotFound(true)
          setLoading(false)
          return
        }
        
        // Fetch subcategories for this category
        const subcategoriesData = await categoryService.getSubcategories(categoryId)
        
        // Transform the data to match the expected format
        const transformedCategory = {
          ...categoryData,
          subcategories: subcategoriesData.map(sub => ({
            id: sub.id,
            name: sub.name,
            image: sub.image || "/placeholder.svg?height=200&width=200&text=" + encodeURIComponent(sub.name)
          }))
        }
        
        setCategory(transformedCategory)
        setSubcategories(subcategoriesData)
      } catch (err) {
        // console.error('Failed to fetch category data:', err)
        setError('Failed to load category data')
      } finally {
        setLoading(false)
      }
    }

    if (categoryId) {
      fetchCategoryData()
    }
  }, [categoryId])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Not found state
  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Category Not Found</h2>
          <p className="text-gray-600 mb-8">The category you&apos;re looking for doesn&apos;t exist.</p>
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

  return <SubCategoryComponent category={category} />
}
