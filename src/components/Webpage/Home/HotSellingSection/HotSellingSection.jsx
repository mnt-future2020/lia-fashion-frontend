import ProductCard from "./ProductCard"
import Link from "next/link"
import { useState, useEffect } from "react"
import axios from '../../../../lib/axios';
const HotSellingSection = () => {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Use server-side filters and pagination to fetch only required items
        const { data } = await axios.get('/api/products', {
          params: {
            collection: 'Hot Selling',
            per_page: 4,
            page: 1
          }
        })

        // Handle both paginated and non-paginated responses
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : []

        // Fallback safeguard if backend ignored collection filter
        const hotSellingProducts = list
          .filter(product => product.badge === 'Hot Selling')
          .sort((a, b) => b.id - a.id)
          .slice(0, 4)

        setProducts(hotSellingProducts)
      } catch (error) {
        // console.error('Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Loading skeleton with title section
  if (isLoading) {
    return (
      <section className="py-6 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Hot Selling</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most coveted pieces that everyone&#39;s talking about
          </p>
          <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
        </div>
        {/* Loading skeleton grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-[300px] rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  // If no products found
  if (products.length === 0) {
    return null;
  }

  // Main content with products
  return (
    <section className="py-6 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif font-medium mb-2">Hot Selling</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover our most coveted pieces that everyone&#39;s talking about
        </p>
        <div className="w-20 h-1 bg-[#eb1c75] mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="text-center mt-10">
      <Link href="/products?collection=Hot%20Selling">
        <button className="px-8 py-3 border-2 hover:border-[#eb1c75] hover:bg-white hover:text-[#eb1c75] bg-[#eb1c75] text-white transition-colors duration-300 font-medium">
          View All Collection
        </button>
        </Link>
      </div>
    </section>
  )
}

export default HotSellingSection
