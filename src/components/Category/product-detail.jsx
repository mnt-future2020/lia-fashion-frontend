"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Star, SlidersHorizontal, Search, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"
import axios from "../../lib/axios"
import { optimizeCloudinary } from "@/lib/utils"
import { toast } from 'react-hot-toast'
import { useUserCart } from "@/contexts/UserCartContext"

const SIZES = ["xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "free-size"] // Convert to lowercase

export default function ProductDetail({ category, subcategory, products }) {
  const router = useRouter()
  const { updateCartData, cartData } = useUserCart()
  const [mounted, setMounted] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState([])
  const [sortOption, setSortOption] = useState("featured")
  const [filterOpen, setFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 15000])
  const [selectedRating, setSelectedRating] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [productReviews, setProductReviews] = useState({}) // Store review stats for each product
  const [selectedSizes, setSelectedSizes] = useState([]) // Add state for selected sizes
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25) // Server-side pagination size
  const [initialLoad, setInitialLoad] = useState(true)
  const [scrollRestored, setScrollRestored] = useState(false)
  const [lastViewedProduct, setLastViewedProduct] = useState(null)
  const productRefs = useRef({})
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [productsLoading, setProductsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Inline add-to-cart controls state
  const [selectedSizesMap, setSelectedSizesMap] = useState({})
  const [quantitiesMap, setQuantitiesMap] = useState({})
  const [addingMap, setAddingMap] = useState({})


  // Save filters to localStorage
  const saveFiltersToStorage = (filters) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`subcategoryFilters_${category?.id}_${subcategory?.id}`, JSON.stringify(filters))
      } catch (error) {
        console.warn('Failed to save filters to localStorage:', error)
      }
    }
  }

  // Load filters from localStorage
  const loadFiltersFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`subcategoryFilters_${category?.id}_${subcategory?.id}`)
        return saved ? JSON.parse(saved) : null
      } catch (error) {
        console.warn('Failed to load filters from localStorage:', error)
        return null
      }
    }
    return null
  }

  useEffect(() => {
    console.log('Category/product-detail.jsx: Component mounting/remounting')
    setMounted(true)
    setScrollRestored(false) // Reset scroll restoration flag
    // Server-side fetch will populate filteredProducts
    
    // Read page from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const pageFromUrl = params.get('page')
      const urlPage = pageFromUrl ? parseInt(pageFromUrl) : 1
      
      // Load saved filters from localStorage
      const savedFilters = loadFiltersFromStorage()
      
      if (savedFilters) {
        // Apply saved filters
        setPriceRange(savedFilters.priceRange || [0, 15000])
        setSelectedRating(savedFilters.selectedRating || 0)
        setSearchQuery(savedFilters.searchQuery || '')
        setSelectedSizes(savedFilters.selectedSizes || [])
        setSortOption(savedFilters.sortOption || "price-low-high")
        
        // Prioritize URL page parameter, then saved page, then default to 1
        const finalPage = pageFromUrl ? urlPage : (savedFilters.currentPage || 1)
        setCurrentPage(finalPage)
      } else {
        // Use URL page if no saved filters
        setCurrentPage(urlPage)
      }
    }
  }, [category?.id, subcategory?.id])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (mounted && category?.id && subcategory?.id) {
      const currentFilters = {
        priceRange,
        selectedRating,
        searchQuery,
        selectedSizes,
        sortOption,
        currentPage
      }
      saveFiltersToStorage(currentFilters)
    }
  }, [mounted, priceRange, selectedRating, searchQuery, selectedSizes, sortOption, currentPage, category?.id, subcategory?.id])

  // Handle navigation and localStorage cleanup
  useEffect(() => {
    // Cleanup function that runs when component unmounts (user navigates away)
    return () => {
      if (typeof window !== 'undefined') {
        // Check if user is navigating to a product page
        const isNavigatingToProduct = sessionStorage.getItem('navigatingToProduct') === 'true'
        
        if (!isNavigatingToProduct) {
          // Clear filters and scroll position if not navigating to a product page
          localStorage.removeItem(`subcategoryFilters_${category?.id}_${subcategory?.id}`)
          sessionStorage.removeItem('categoryScrollPosition')
        }
        
        // Clear the navigation flag
        sessionStorage.removeItem('navigatingToProduct')
      }
    }
  }, [category?.id, subcategory?.id])

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

  // Helpers for sizes/quantity
  const getAvailableSizes = (product) => {
    return (product.size_prices || []).filter(sp => (sp.stock ?? 0) > 0).map(sp => sp.size)
  }

  const getSelectedSizeFor = (product) => {
    const available = getAvailableSizes(product)
    const chosen = selectedSizesMap[product.id]
    return chosen && available.includes(chosen) ? chosen : (available[0] || null)
  }

  const getQuantityFor = (productId) => {
    const q = quantitiesMap[productId]
    return q && q > 0 ? q : 1
  }

  const setQuantityFor = (productId, value) => {
    const v = Math.max(1, value)
    setQuantitiesMap(prev => ({ ...prev, [productId]: v }))
  }

  const handleAddToCart = async (product) => {
    try {
      const selectedSize = getSelectedSizeFor(product)
      if (!selectedSize) return
      const sizeInfo = (product.size_prices || []).find(sp => sp.size === selectedSize) || {}
      const quantity = getQuantityFor(product.id)
      const colorName = product.colors?.[0]?.name || product.colors?.[0]?.color || "Default"

      // Stock checks
      const maxStock = typeof sizeInfo.stock === 'number' ? sizeInfo.stock : parseInt(String(sizeInfo.stock || 0)) || 0
      if (maxStock <= 0) {
        toast.error('Selected size is out of stock')
        return
      }
      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} in stock for size ${selectedSize}`)
        return
      }

      // Duplicate/aggregate cart checks
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
      try { await updateCartData() } catch {}
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add to cart')
      if (err?.response?.status === 401) {
        router.push('/login')
        return
      }
    } finally {
      setAddingMap(prev => ({ ...prev, [product.id]: false }))
    }
  }

  // Fetch review stats for currently displayed page items
  useEffect(() => {
    const fetchProductReviews = async () => {
      if (!filteredProducts || filteredProducts.length === 0) return

      const reviewPromises = filteredProducts.map(async (product) => {
        try {
          // Use the same API endpoint as ProductDetail.jsx
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

    if (mounted) {
      fetchProductReviews()
    }
  }, [mounted, filteredProducts])

  // Restore scroll position if returning from product page
  useEffect(() => {
    if (mounted && filteredProducts && filteredProducts.length > 0 && !scrollRestored) {
      // Check if we have a saved scroll position from navigating to a product
      if (typeof window !== 'undefined') {
        console.log('Category/product-detail.jsx: Checking sessionStorage for scroll position...')
        console.log('Category/product-detail.jsx: categoryScrollPosition:', sessionStorage.getItem('categoryScrollPosition'))
        console.log('Category/product-detail.jsx: productsScrollPosition:', sessionStorage.getItem('productsScrollPosition'))
        const savedScrollPosition = sessionStorage.getItem('categoryScrollPosition')
        if (savedScrollPosition) {
          console.log('Category/product-detail.jsx: Attempting to restore scroll position:', savedScrollPosition)
          
          // Wait for layout to stabilize
          const restoreScrollWithDelay = () => {
            setTimeout(() => {
              const targetPosition = parseInt(savedScrollPosition)
              console.log('Restoring scroll to position:', targetPosition, 'Current scroll:', window.pageYOffset)
              
              // First try instant scroll
              window.scrollTo({
                top: targetPosition,
                behavior: 'instant'
              })
              
              // Then verify position and adjust if needed
              setTimeout(() => {
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop
                if (Math.abs(currentScroll - targetPosition) > 50) {
                  console.log('Scroll position off, adjusting. Current:', currentScroll, 'Target:', targetPosition)
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                  })
                }
                console.log('Final scroll position:', window.pageYOffset)
              }, 100)
              
              // Clear the saved position after restoring
              sessionStorage.removeItem('categoryScrollPosition')
              setScrollRestored(true)
            }, 800) // Wait for images to load
          }
          
          restoreScrollWithDelay()
        } else {
          console.log('Category/product-detail.jsx: No scroll position to restore')
          setScrollRestored(true) // No position to restore, mark as done
        }
      }
    }
  }, [mounted, filteredProducts, scrollRestored])

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
          }, 600) // Delay to ensure page change and DOM rendering
        }
        
        const timer = setTimeout(() => {
          setLastViewedProduct(null)
          localStorage.removeItem('lastViewedProduct')
        }, 3000) // Show highlight for 3 seconds
        
        return () => clearTimeout(timer)
      }
    }
  }, [filteredProducts, mounted, itemsPerPage]) // Re-run when products change to ensure refs are available

  // Helper function to get product rating info (using real backend data)
  const getProductRating = (product) => {
    const reviewStats = productReviews[product.id]
    
    if (reviewStats && reviewStats.total > 0) {
      return {
        rating: Number(reviewStats.average) || 0,
        reviewCount: Number(reviewStats.total) || 0,
        hasRealData: true
      }
    }
    
    // Return 0 rating if no real reviews data
    return {
      rating: 0,
      reviewCount: 0,
      hasRealData: false
    }
  }

  // Server-side pagination and filtering
  useEffect(() => {
    if (!mounted) return

    const fetchServerProducts = async () => {
      setProductsLoading(true)
      try {
        const sizesParam = selectedSizes
          .map(s => (s === 'free-size' ? 'free-size' : s.toUpperCase()))
          .join(',')

        const params = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
          search: debouncedSearchQuery || '',
          category_id: String(category?.id || ''),
          subcategory_id: String(subcategory?.id || ''),
          price_min: String(priceRange[0]),
          price_max: String(priceRange[1]),
          sizes: sizesParam,
          sort: sortOption
        })

        const { data } = await axios.get(`/api/products?${params.toString()}`)
        const pageData = Array.isArray(data?.data) ? data.data : []
        setFilteredProducts(pageData)
        setTotalItems(Number(data?.total || pageData.length || 0))
        setTotalPages(Number(data?.last_page || Math.ceil((data?.total || 0) / itemsPerPage) || 1))
      } catch (error) {
        setFilteredProducts([])
        setTotalItems(0)
        setTotalPages(1)
      } finally {
        if (initialLoad) setInitialLoad(false)
        setProductsLoading(false)
      }
    }

    // If filters change and we're not restoring from URL, reset to page 1
    if (!initialLoad && currentPage !== 1 && !scrollRestored) {
      const hasPageInUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('page')
      if (!hasPageInUrl) {
        setCurrentPage(1)
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          params.delete('page')
          const newUrl = `${window.location.pathname}?${params.toString()}`
          window.history.replaceState({}, '', newUrl)
        }
      }
    }

    fetchServerProducts()
  }, [mounted, currentPage, itemsPerPage, debouncedSearchQuery, priceRange, selectedSizes, sortOption, subcategory?.id, category?.id, initialLoad, scrollRestored])

  // Pagination values come from server response (state)
  
  // Final page restoration from URL - runs after all other effects
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(window.location.search)
        const pageFromUrl = params.get('page')
        
        if (pageFromUrl) {
          const urlPage = parseInt(pageFromUrl)
          const maxPage = totalPages || 1
          
          if (urlPage > 0 && urlPage <= maxPage && urlPage !== currentPage) {
            setCurrentPage(urlPage)
          }
        }
      }, 100) // Small delay to ensure filtering is complete
      
      return () => clearTimeout(timer)
    }
  }, [mounted, totalPages, itemsPerPage])
  
  // Debounce search to reduce API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Ensure current page is valid
  useEffect(() => {
    if (mounted && totalPages > 0 && currentPage > totalPages && !scrollRestored) {
      setCurrentPage(1)
      
      // Update URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.delete('page')
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [mounted, currentPage, totalPages, scrollRestored])
  
  // Get current page items
  const getCurrentPageItems = () => {
    // Server already returned the current page items
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
      
      // Don't scroll to top if we're highlighting a last viewed product
      if (!lastViewedProduct) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // Handle view button click - navigate to product detail page
  const handleView = (productId) => {
    // Set flag to indicate we're navigating to a product page and save scroll position
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastViewedProduct', productId.toString())
      sessionStorage.setItem('navigatingToProduct', 'true')
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
      console.log('Saving scroll position from handleView:', scrollPosition)
      sessionStorage.setItem('categoryScrollPosition', scrollPosition.toString())
    }
    router.push(`/products/${productId}`)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Category Banner */}
      <div className="relative w-full h-[150px] sm:h-[200px] overflow-hidden">
        <Image
          src="/assets/banner/subban.png"
          alt={subcategory.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">{subcategory.name}</h1>
            <p className="text-white/90 text-xs md:text-sm max-w-2xl mx-auto px-4">
              Shop our collection of {subcategory.name} in {category.name}
            </p>
          </div>
        </div>
      </div>
            {/* Breadcrumb Navigation */}
            <div className="container mx-auto px-4 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link 
            href="/" 
            className="hover:text-gray-900"
            onClick={() => {
              // Clear filters when navigating to home
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('navigatingToProduct')
              }
            }}
          >
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link 
            href={`/category/${category.id}`} 
            className="hover:text-gray-900"
            onClick={() => {
              // Clear filters when navigating to category page
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('navigatingToProduct')
              }
            }}
          >
            {category.name}
          </Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-gray-900">{subcategory.name}</span>
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
                {/* <option value="featured">Featured</option> */}
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                {/* <option value="newest">Newest First</option>
                <option value="bestseller">Bestsellers</option> */}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder={`Search in ${subcategory.name}`}
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
            {/* <div>
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
                      {renderStarRating(rating, "h-4 w-4")}
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
            </div> */}
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
                      {size === "free-size" ? "Free Size" : size.toUpperCase()}
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
                setSortOption("price-low-high")
                setCurrentPage(1)
                
                // Clear localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`subcategoryFilters_${category?.id}_${subcategory?.id}`)
                  
                  // Clear URL parameters
                  const params = new URLSearchParams(window.location.search)
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
            Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
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
                      // Store the product ID to highlight when returning and save scroll position
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('lastViewedProduct', product.id.toString())
                        sessionStorage.setItem('navigatingToProduct', 'true')
                        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
                        console.log('Saving scroll position from image link:', scrollPosition)
                        sessionStorage.setItem('categoryScrollPosition', scrollPosition.toString())
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
                  {/* <button className="absolute bottom-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white">
                    <Heart className="h-4 w-4 text-gray-600 hover:text-pink-500" />
                  </button> */}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-1">{product.category}</p>
                  <h3 className="font-medium text-sm sm:text-base line-clamp-1 mb-2">
                    <Link 
                      href={`/products/${product.id}`} 
                      className="hover:underline"
                      onClick={() => {
                        // Store the product ID to highlight when returning and save scroll position
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('lastViewedProduct', product.id.toString())
                          sessionStorage.setItem('navigatingToProduct', 'true')
                          const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
                          console.log('Saving scroll position from name link:', scrollPosition)
                          sessionStorage.setItem('categoryScrollPosition', scrollPosition.toString())
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

                  {/* Rating - Dynamic like ProductDetail.jsx */}
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
                  {(() => {
                    const availableSizes = getAvailableSizes(product)
                    const selectedSize = getSelectedSizeFor(product)
                    const qty = getQuantityFor(product.id)
                    return (
                      <>
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

                        {/* Quantity + Add to Cart + View Button */}
                        <div className="space-y-2">
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
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm py-2 transition-colors"
                          >
                            <span>View</span>
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
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
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No products match your current filters</p>
            <button
              onClick={() => {
                setPriceRange([0, 15000])
                setSelectedRating(0)
                setSortOption("price-low-high")
                setSearchQuery("")
                setSelectedSizes([])
                setCurrentPage(1)
                
                // Clear localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem(`subcategoryFilters_${category?.id}_${subcategory?.id}`)
                  
                  // Clear URL parameters
                  const params = new URLSearchParams(window.location.search)
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
      </div>
    </div>
  )
}