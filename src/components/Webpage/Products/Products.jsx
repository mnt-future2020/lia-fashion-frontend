"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, Star, SlidersHorizontal, Search, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"
import axios from '../../../lib/axios'
import { toast } from 'react-hot-toast'
import { optimizeCloudinary } from "@/lib/utils"
import { useUserCart } from "@/contexts/UserCartContext"

import { useRouter, useSearchParams } from 'next/navigation'

export default function Products() {
  const router = useRouter()
  const { updateCartData, cartData } = useUserCart()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [sortOption, setSortOption] = useState("featured")
  const [filterOpen, setFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 15000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [productReviews, setProductReviews] = useState({})
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCollection, setSelectedCollection] = useState("all")
  const [categories, setCategories] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25// Fetch 50 products per page from API
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [initialLoad, setInitialLoad] = useState(true)
  const [lastViewedProduct, setLastViewedProduct] = useState(null)
  const productRefs = useRef({})

  // Inline add-to-cart controls state
  const [selectedSizesMap, setSelectedSizesMap] = useState({})
  const [quantitiesMap, setQuantitiesMap] = useState({})
  const [addingMap, setAddingMap] = useState({})

  
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL", "free-size"]

  // Save filters to localStorage
  const saveFiltersToStorage = (filters) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('productsPageFilters', JSON.stringify(filters))
      } catch (error) {
        console.warn('Failed to save filters to localStorage:', error)
      }
    }
  }

  // Load filters from localStorage
  const loadFiltersFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('productsPageFilters')
        return saved ? JSON.parse(saved) : null
      } catch (error) {
        console.warn('Failed to load filters from localStorage:', error)
        return null
      }
    }
    return null
  }

  // Update loading state when all data is fetched
  useEffect(() => {
    if (!productsLoading && !categoriesLoading && !reviewsLoading && mounted) {
      setLoading(false)
    }
  }, [productsLoading, categoriesLoading, reviewsLoading, mounted])



  // Fetch products with pagination
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true)
        
        // Build query parameters for pagination and filtering
        const params = new URLSearchParams({
          page: currentPage.toString(),
          per_page: itemsPerPage.toString(),
          search: searchQuery || '',
          category: selectedCategory === 'all' ? '' : selectedCategory,
          collection: selectedCollection === 'all' ? '' : selectedCollection,
          price_min: priceRange[0].toString(),
          price_max: priceRange[1].toString(),
          rating: selectedRating.toString(),
          sizes: selectedSizes.join(','),
          sort: sortOption
        })

        const { data } = await axios.get(`/api/products?${params}`)
        
        // Handle both paginated and non-paginated responses
        if (data.data && data.total !== undefined) {
          // Paginated response
          setProducts(data.data)
          setFilteredProducts(data.data)
          setTotalItems(data.total)
          setTotalPages(data.last_page || Math.ceil(data.total / itemsPerPage))
        } else {
          // Non-paginated response (fallback)
          setProducts(data)
          setFilteredProducts(data)
          setTotalItems(data.length)
          setTotalPages(Math.ceil(data.length / itemsPerPage))
        }
      } catch (error) {
        // console.error('Failed to fetch products:', error)
        setProducts([])
        setFilteredProducts([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        setProductsLoading(false)
      }
    }
    
    fetchProducts()
  }, [currentPage, debouncedSearchQuery, selectedCategory, selectedCollection, priceRange, selectedRating, selectedSizes, sortOption])

  // Add categories fetch
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/categories')
        setCategories(data)
      } catch (error) {
        // console.error('Failed to fetch categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Fetch review stats for products
  useEffect(() => {
    const fetchProductReviews = async () => {
      if (!products || products.length === 0) {
        setReviewsLoading(false)
        return
      }

      const reviewPromises = products.map(async (product) => {
        try {
          const response = await fetch(`/api/products/${product.id}/reviews`)
          if (response.ok) {
            const data = await response.json()
            return {
              productId: product.id,
              stats: {
                average: data.stats?.average || 0,
                total: data.stats?.total || 0
              }
            }
          }
        } catch (error) {
          // console.error(`Failed to fetch reviews for product ${product.id}:`, error)
        }
        return {
          productId: product.id,
          stats: { average: 0, total: 0 }
        }
      })

      try {
        const reviewResults = await Promise.all(reviewPromises)
        const reviewsMap = {}
        reviewResults.forEach(({ productId, stats }) => {
          reviewsMap[productId] = stats
        })
        setProductReviews(reviewsMap)
      } catch (error) {
        // console.error('Failed to fetch product reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }

    if (mounted && products && products.length > 0) {
      fetchProductReviews()
    }
  }, [mounted, products])

  // Check for last viewed product on mount and auto-scroll
  useEffect(() => {
    if (typeof window !== 'undefined' && filteredProducts.length > 0 && mounted) {
      const storedLastViewedId = localStorage.getItem('lastViewedProduct')
      if (storedLastViewedId) {
        const productId = parseInt(storedLastViewedId)
        setLastViewedProduct(productId)
        
        // Find which page the product is on
        const productIndex = filteredProducts.findIndex(p => p.id === productId)
        if (productIndex !== -1) {
          const productPage = Math.ceil((productIndex + 1) / itemsPerPage)
          
          // Navigate to the correct page if needed
          if (productPage !== currentPage) {
            setCurrentPage(productPage)
            // Update URL
            const params = new URLSearchParams(window.location.search)
            if (productPage === 1) {
              params.delete('page')
            } else {
              params.set('page', productPage.toString())
            }
            const newUrl = `${window.location.pathname}?${params.toString()}`
            window.history.replaceState({}, '', newUrl)
          }
          
          // Auto-scroll to the product with a delay to ensure rendering
          setTimeout(() => {
            const productElement = productRefs.current[storedLastViewedId]
            if (productElement) {
              productElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              })
            }
          }, 600) // Increased delay to ensure page change and DOM rendering
        }
        
        const timer = setTimeout(() => {
          setLastViewedProduct(null)
          localStorage.removeItem('lastViewedProduct')
        }, 3000) // Show highlight for 3 seconds
        
        return () => clearTimeout(timer)
      }
    }
  }, [filteredProducts, mounted, itemsPerPage]) // Re-run when products change to ensure refs are available

  // On mount, set searchQuery and collection from URL params if present
  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const search = params.get('search') || ''
      const collection = params.get('collection') || 'all'
      const pageFromUrl = params.get('page')
      const page = pageFromUrl ? parseInt(pageFromUrl) : 1
      
      // Load saved filters from localStorage
      const savedFilters = loadFiltersFromStorage()
      
      if (savedFilters) {
        // Apply saved filters, but prioritize URL params for search, collection, and page
        setPriceRange(savedFilters.priceRange || [0, 15000])
        setSelectedRating(savedFilters.selectedRating || 0)
        setSearchQuery(search || savedFilters.searchQuery || '')
        setSelectedSizes(savedFilters.selectedSizes || [])
        setSortOption(savedFilters.sortOption || "featured")
        setSelectedCategory(savedFilters.selectedCategory || "all")
        setSelectedCollection(collection || savedFilters.selectedCollection || 'all')
        
        // Prioritize URL page parameter, then saved page, then default to 1
        const finalPage = pageFromUrl ? page : (savedFilters.currentPage || 1)
        setCurrentPage(finalPage)
        console.log('Setting page from URL/localStorage:', finalPage, 'URL page:', pageFromUrl, 'Saved page:', savedFilters.currentPage)
      } else {
        // Use URL params if no saved filters
        setSearchQuery(search)
        setSelectedCollection(collection)
        setCurrentPage(page)
        // console.log('Setting page from URL (no saved filters):', page)
      }
    }
  }, [])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (mounted) {
      const currentFilters = {
        priceRange,
        selectedRating,
        searchQuery,
        selectedSizes,
        sortOption,
        selectedCategory,
        selectedCollection,
        currentPage
      }
      saveFiltersToStorage(currentFilters)
    }
  }, [mounted, priceRange, selectedRating, searchQuery, selectedSizes, sortOption, selectedCategory, selectedCollection, currentPage])

  // Handle navigation and localStorage cleanup
  useEffect(() => {
    // Cleanup function that runs when component unmounts (user navigates away)
    return () => {
      if (typeof window !== 'undefined') {
        // Check if user is navigating to a product page
        const isNavigatingToProduct = sessionStorage.getItem('navigatingToProduct') === 'true'
        
        if (!isNavigatingToProduct) {
          // Clear filters if not navigating to a product page
          localStorage.removeItem('productsPageFilters')
        }
        
        // Clear the navigation flag
        sessionStorage.removeItem('navigatingToProduct')
      }
    }
  }, [])

  // Helper function to get product price info
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

  const getAvailableSizes = (product) => {
    return (product.size_prices || []).filter(sp => (sp.stock ?? 0) > 0).map(sp => sp.size)
  }

  const getSelectedSizeFor = (product) => {
    const available = getAvailableSizes(product)
    const chosen = selectedSizesMap[product.id]
    return chosen && available.includes(chosen) ? chosen : (available[0] || null)
  }

  const getQuantityFor = (productId) => {
    return quantitiesMap[productId] && quantitiesMap[productId] > 0 ? quantitiesMap[productId] : 1
  }

  const setQuantityFor = (productId, value) => {
    setQuantitiesMap(prev => ({ ...prev, [productId]: Math.max(1, value) }))
  }

  const handleAddToCart = async (product) => {
    try {
      const selectedSize = getSelectedSizeFor(product)
      if (!selectedSize) return
      const sizeInfo = (product.size_prices || []).find(sp => sp.size === selectedSize) || {}
      const quantity = getQuantityFor(product.id)
      const colorName = product.colors?.[0]?.name || product.colors?.[0]?.color || "Default"

      // Prevent adding beyond stock
      const maxStock = typeof sizeInfo.stock === 'number' ? sizeInfo.stock : parseInt(String(sizeInfo.stock || 0)) || 0
      if (maxStock <= 0) {
        toast.error('Selected size is out of stock')
        return
      }
      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} in stock for size ${selectedSize}`)
        return
      }

      // Prevent duplicate add-to-cart for same product+size when already in cart at stock limit
      const existingQty = (() => {
        const items = cartData?.items || []
        const found = items.find(it => it.product_id === product.id && (it.size || '') === selectedSize)
        return found ? (typeof found.quantity === 'number' ? found.quantity : parseInt(String(found.quantity || 0)) || 0) : 0
      })()
      if (existingQty >= maxStock) {
        toast.error(`You already have ${existingQty} of size ${selectedSize} in cart (max ${maxStock})`)
        return
      }
      if (existingQty + quantity > maxStock) {
        toast.error(`Adding ${quantity} exceeds stock. You can add up to ${maxStock - existingQty} more`)
        return
      }

      setAddingMap(prev => ({ ...prev, [product.id]: true }))

      await axios.post('/api/cart/add', {
        product_id: product.id,
        quantity,
        size: selectedSize,
        color: colorName,
        price: sizeInfo.price || sizeInfo.mrp || 0
      })

      toast.success('Added to cart')
      // Refresh global cart state for navbar icon
      try { await updateCartData() } catch {}
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add to cart')
      // If unauthorized, redirect to login
      if (err?.response?.status === 401) {
        router.push('/login')
        return
      }
      // console.error('Add to cart failed', err)
    } finally {
      setAddingMap(prev => ({ ...prev, [product.id]: false }))
    }
  }

  // Helper function to get product rating info
  const getProductRating = (product) => {
    const reviewStats = productReviews[product.id]
    
    if (reviewStats && reviewStats.total > 0) {
      return {
        rating: Number(reviewStats.average) || 0,
        reviewCount: Number(reviewStats.total) || 0,
        hasRealData: true
      }
    }
    
    return {
      rating: 0,
      reviewCount: 0,
      hasRealData: false
    }
  }

  // Helper function to render star rating
  const renderStarRating = (rating, size = "h-3 w-3") => {
    const fullStars = Math.floor(rating)
    const partialStar = rating - fullStars
    const hasPartialStar = partialStar > 0
    
    return (
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className={`${size} text-yellow-400 fill-yellow-400`} />
          } else if (i === fullStars && hasPartialStar) {
            const percentage = Math.round(partialStar * 100)
            return (
              <div key={i} className="relative inline-block">
                <Star className={`${size} text-gray-300`} />
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${percentage}%` }}>
                  <Star className={`${size} text-yellow-400 fill-yellow-400`} />
                </div>
              </div>
            )
          } else {
            return <Star key={i} className={`${size} text-gray-300`} />
          }
        })}
      </div>
    )
  }

  // Update filter effect
  useEffect(() => {
    if (!mounted) return

    let sorted = [...products]

    // Apply search filter (search by name or SKU code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      sorted = sorted.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        (product.sku_code && product.sku_code.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      sorted = sorted.filter((product) => product.category === selectedCategory)
    }

    // Apply size filter
    if (selectedSizes.length > 0) {
      sorted = sorted.filter((product) => {
        return product.size_prices.some(size => selectedSizes.includes(size.size) && (size.stock > 0))
      })
    }

    // Apply collection filter based on badges
    if (selectedCollection !== "all") {
      sorted = sorted.filter((p) => p.badge === selectedCollection)
    }

    // Apply price filter
    sorted = sorted.filter((product) => {
      const { sellingPrice } = getProductPricing(product)
      return sellingPrice >= priceRange[0] && sellingPrice <= priceRange[1]
    })

    // Apply rating filter
    if (selectedRating > 0) {
      sorted = sorted.filter((product) => {
        const { rating } = getProductRating(product)
        return rating >= selectedRating
      })
    }

    // Apply sorting
    switch (sortOption) {
      case "price-low-high":
        sorted.sort((a, b) => {
          const priceA = getProductPricing(a).sellingPrice
          const priceB = getProductPricing(b).sellingPrice
          // Add fallback sort by ID (newest first) for consistent ordering when prices are equal
          return priceA - priceB || b.id - a.id
        })
        break
      case "price-high-low":
        sorted.sort((a, b) => {
          const priceA = getProductPricing(a).sellingPrice
          const priceB = getProductPricing(b).sellingPrice
          // Add fallback sort by ID (newest first) for consistent ordering when prices are equal
          return priceB - priceA || b.id - a.id
        })
        break
      default:
        // Featured is default - sort by ID (newest first) for recently added products to appear first
        sorted.sort((a, b) => b.id - a.id)
        break
    }

    // Note: Client-side filtering removed - now handled by server-side API calls
    
    // Reset to first page when filters change (but not on initial load or if URL has page param)
    if (!initialLoad && currentPage !== 1) {
      // Check if there's a page parameter in URL - if so, don't reset
      const hasPageInUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page')
      
      if (!hasPageInUrl) {
        console.log('Resetting page to 1 due to filter change, currentPage was:', currentPage)
        setCurrentPage(1)
        
        // Update URL to remove page parameter when resetting to page 1
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          params.delete('page')
          const newUrl = `${window.location.pathname}?${params.toString()}`
          window.history.replaceState({}, '', newUrl)
        }
      }
    }
    
    // Mark initial load as complete
    if (initialLoad) {
      setInitialLoad(false)
    }
  }, [sortOption, priceRange, selectedRating, searchQuery, selectedCategory, selectedCollection, selectedSizes, mounted, products, initialLoad])

  // Pagination values are now managed by state variables
  
  // Final page restoration from URL - runs after all other effects
  useEffect(() => {
    if (mounted && !productsLoading && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const pageFromUrl = params.get('page')
      
      console.log('Final page restoration effect running. URL page:', pageFromUrl, 'current page:', currentPage)
      
      if (pageFromUrl) {
        const urlPage = parseInt(pageFromUrl)
        const maxPage = Math.ceil(filteredProducts.length / itemsPerPage) || 1
        
        if (urlPage > 0 && urlPage <= maxPage && urlPage !== currentPage) {
          console.log('Restoring page from URL:', urlPage, 'current page:', currentPage)
          setTimeout(() => setCurrentPage(urlPage), 25) // Small delay to ensure other effects complete
        }
      }
    }
  }, [mounted, productsLoading, filteredProducts.length, itemsPerPage]) // Don't include currentPage to avoid loops

  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Ensure current page is valid
  useEffect(() => {
    if (mounted && totalPages > 0 && currentPage > totalPages) {
      // console.log('Current page', currentPage, 'exceeds total pages', totalPages, '. Resetting to page 1.')
      setCurrentPage(1)
      
      // Update URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.delete('page')
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [mounted, currentPage, totalPages])
  
  // Get current page items - now directly from filteredProducts since API handles pagination
  const getCurrentPageItems = () => {
    return filteredProducts
  }

  // Pagination navigation
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      
      // Update URL with the new page number
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (page === 1) {
          params.delete('page')
        } else {
          params.set('page', page.toString())
        }
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleView = (productId) => {
    // Store the product ID to highlight when returning
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastViewedProduct', productId.toString())
      sessionStorage.setItem('navigatingToProduct', 'true')
    }
    router.push(`/products/${productId}`)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb Navigation */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="font-medium text-gray-900">All Products</span>
          </div>
        </div>

        {/* Category Banner */}
        <div className="relative w-full h-[150px] sm:h-[200px] overflow-hidden">
          <Image
            src="/assets/banner/cat_image.png"
            alt="All Products"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Our Products</h1>
              <p className="text-white/90 text-xs md:text-sm max-w-2xl mx-auto px-4">
                Discover our complete collection of products
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#eb1c75] rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb Navigation */}
      {/* <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-gray-900">All Products</span>
        </div>
      </div> */}

      {/* Category Banner */}
      <div className="relative w-full h-[150px] sm:h-[200px] overflow-hidden">
        <Image
          src="/assets/banner/cat_image2.png"
          alt="All Products"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Our Products</h1>
            <p className="text-white/90 text-xs md:text-sm max-w-2xl mx-auto px-4">
              Discover our complete collection of products
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
          <>
            {/* Filters and Sorting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center bg-white px-4 py-2 rounded-md shadow-sm border border-gray-200"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <span>Filter</span>
                </button>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-white pl-4 pr-10 py-2 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Collection Filter */}
                <div className="relative">
                  <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="appearance-none bg-white pl-4 pr-10 py-2 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  >
                    <option value="all">All Collections</option>
                    <option value="New arrival">New Arrival</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Hot Selling">Hot Selling</option>
                    <option value="Trending">Trending</option>
                    <option value="Limited">Limited</option>
                    <option value="Premium">Premium</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Price Sort */}
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="appearance-none bg-white pl-4 pr-10 py-2 rounded-md shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
                  >
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  // Update URL param for search (shallow routing)
                  if (typeof window !== 'undefined') {
                    const params = new URLSearchParams(window.location.search)
                    if (e.target.value) {
                      params.set('search', e.target.value)
                    } else {
                      params.delete('search')
                    }
                    const newUrl = `${window.location.pathname}?${params.toString()}`
                    window.history.replaceState({}, '', newUrl)
                  }
                }}
                className="w-full md:w-64 pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery !== debouncedSearchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              </div>
            </div>

            {/* Filter Panel */}
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

                {/* Size Filter */}
                <div>
                  <h3 className="font-medium mb-3">Size</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((size) => (
                      <div key={size} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`size-${size}`}
                          checked={selectedSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSizes([...selectedSizes, size])
                            } else {
                              setSelectedSizes(selectedSizes.filter(s => s !== size))
                            }
                          }}
                          className="mr-2 accent-pink-500"
                        />
                        <label htmlFor={`size-${size}`} className="text-sm">
                          {size === "free-size" ? "Free Size" : size}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apply/Clear Buttons */}
                <div className="md:col-span-2 lg:col-span-4 flex justify-end space-x-4 mt-4">
                  <button
                    onClick={() => {
                      setPriceRange([0, 15000])
                      setSelectedRating(0)
                      setSearchQuery("")
                      setSelectedSizes([])
                      setSelectedCategory("all")
                      setSelectedCollection("all")
                      setSortOption("featured")
                      setCurrentPage(1)
                      
                      // Clear localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('productsPageFilters')
                        
                        // Clear URL parameters
                        const params = new URLSearchParams(window.location.search)
                        params.delete('search')
                        params.delete('collection')
                        params.delete('page')
                        const newUrl = `${window.location.pathname}?${params.toString()}`
                        window.history.replaceState({}, '', newUrl)
                      }
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {totalItems} products
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-500">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-pink-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#eb1c75] rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="text-gray-600 mt-4">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {getCurrentPageItems().map((product) => {
                const { mrp, sellingPrice, discount, hasDiscount } = getProductPricing(product)
                const { rating, reviewCount, hasRealData } = getProductRating(product)
                const availableSizes = getAvailableSizes(product)
                const selectedSize = getSelectedSizeFor(product)
                const qty = getQuantityFor(product.id)
                
                return (
                  <div
                    key={product.id}
                    ref={el => productRefs.current[product.id] = el}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-500 ${
                      lastViewedProduct === product.id 
                        ? 'ring-2 ring-pink-500 shadow-xl transform scale-105' 
                        : ''
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative overflow-hidden">
                      <Link 
                        href={`/products/${product.id}`}
                        onClick={() => {
                          // Store the product ID to highlight when returning
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('lastViewedProduct', product.id.toString())
                            sessionStorage.setItem('navigatingToProduct', 'true')
                          }
                        }}
                      >
                        <div className="aspect-[3/4] relative">
                          <Image 
                            src={optimizeCloudinary(product.image) || "/placeholder.svg"} 
                            alt={product.name} 
                            fill 
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          />
                        </div>
                      </Link>

                      {/* Badge */}
                      {product.badge && (
                        <div className="absolute top-2 left-2">
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background:
                                product.badge === "New arrival" ? "#e6f9ec" :
                                product.badge === "Best Seller" ? "#e6f0fa" :
                                product.badge === "Hot Selling" ? "#fff4e6" :
                                product.badge === "Trending" ? "#f3e6fa" :
                                product.badge === "Limited" ? "#fae6e6" :
                                product.badge === "Premium" ? "#fffbe6" : "#f3f4f6",
                              color:
                                product.badge === "New arrival" ? "#1db954" :
                                product.badge === "Best Seller" ? "#2563eb" :
                                product.badge === "Hot Selling" ? "#f97316" :
                                product.badge === "Trending" ? "#a21caf" :
                                product.badge === "Limited" ? "#dc2626" :
                                product.badge === "Premium" ? "#eab308" : "#374151"
                            }}
                          >
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
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                      <h3 className="font-medium text-sm sm:text-base line-clamp-1 mb-2">
                        <Link 
                          href={`/products/${product.id}`} 
                          className="hover:underline"
                          onClick={() => {
                            // Store the product ID to highlight when returning
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('lastViewedProduct', product.id.toString())
                              sessionStorage.setItem('navigatingToProduct', 'true')
                            }
                          }}
                        >
                          {product.name}
                        </Link>
                      </h3>

                      {/* Price */}
                      <div className="mb-2 flex items-center justify-start gap-2">
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

                      {/* Rating */}
                      <div className="mb-3 flex items-center justify-start gap-2">
                        {rating > 0 && (
                          <>
                            <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">
                              <span>{rating.toFixed(1)}</span>
                              <Star className="h-2.5 w-2.5 fill-white" />
                            </div>
                            <span className="text-xs text-gray-600">
                              ({reviewCount})
                            </span>
                            {!hasRealData && (
                              <span className="text-xs text-gray-400 italic">*</span>
                            )}
                          </>
                        )}
                        {rating === 0 && (
                          <div className="flex items-center gap-1 bg-gray-400 text-white px-1.5 py-0.5 rounded text-xs">
                            <span>0</span>
                            <Star className="h-2.5 w-2.5 fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Inline Size Selector */}
                      {availableSizes.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-gray-600 mb-1">Size:</div>
                          <div className="flex flex-wrap gap-2">
                            {availableSizes.map(sz => (
                              <button
                                key={sz}
                                onClick={() => setSelectedSizesMap(prev => ({ ...prev, [product.id]: sz }))}
                                className={`px-2 py-0.5 border rounded text-xs ${selectedSize === sz ? 'border-pink-500 text-pink-600' : 'border-gray-300 text-gray-700'} hover:border-pink-400`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quantity + Add to Cart */}
                      <div className="flex items-stretch gap-2">
                        <div className="flex items-center border rounded w-[110px] justify-between">
                          <button onClick={() => setQuantityFor(product.id, qty - 1)} className="px-2 py-1 text-lg text-gray-600">-</button>
                          <span className="px-2 text-sm">{qty}</span>
                          <button
                            onClick={() => {
                              const sizeInfo = (product.size_prices || []).find(sp => sp.size === selectedSize) || {}
                              const maxStock = typeof sizeInfo.stock === 'number' ? sizeInfo.stock : parseInt(String(sizeInfo.stock || 0)) || 0
                              if (qty + 1 > maxStock) {
                                toast.error(`Only ${maxStock} in stock for size ${selectedSize}`)
                                return
                              }
                              setQuantityFor(product.id, qty + 1)
                            }}
                            className="px-2 py-1 text-lg text-gray-600"
                          >+
                          </button>
                        </div>
                        <button
                          disabled={!selectedSize || addingMap[product.id]}
                          onClick={() => handleAddToCart(product)}
                          className={`flex-1 flex items-center justify-center rounded text-sm ${addingMap[product.id] ? 'bg-gray-200 text-gray-500' : 'bg-pink-100 hover:bg-pink-200 text-pink-800'} py-1.5`}
                        >
                          <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                          {addingMap[product.id] ? 'Adding...' : 'Add'}
                        </button>
                      </div>

                      {/* View Button */}
                      <button 
                        onClick={() => handleView(product.id)} 
                        className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 rounded-md text-sm flex items-center justify-center"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                )
              })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && totalItems > itemsPerPage && (
              <div className="flex items-center justify-center mt-8 gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-md border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all page numbers
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // If near the start, show first 5 pages
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If near the end, show last 5 pages
                      pageNum = totalPages - 4 + i;
                    } else {
                      // Show current page and 2 pages before and after
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 rounded-md border ${
                          currentPage === pageNum
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-md border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Empty State */}
            {!productsLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No products match your current filters</p>
                <button
                  onClick={() => {
                    setPriceRange([0, 15000])
                    setSelectedRating(0)
                    setSortOption("featured")
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setSelectedCollection("all")
                    setSelectedSizes([])
                    setCurrentPage(1)
                    
                    // Clear localStorage
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('productsPageFilters')
                      
                      // Clear URL parameters
                      const params = new URLSearchParams(window.location.search)
                      params.delete('search')
                      params.delete('collection')
                      params.delete('page')
                      const newUrl = `${window.location.pathname}?${params.toString()}`
                      window.history.replaceState({}, '', newUrl)
                    }
                  }}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
      </div>
    </div>
  )
}
