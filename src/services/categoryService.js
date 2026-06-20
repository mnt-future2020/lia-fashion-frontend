import axios from 'axios'

// Create a separate axios instance for category services
const categoryAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token if available
categoryAxios.interceptors.request.use(
  (config) => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

export const categoryService = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await categoryAxios.get('/api/admin/categories')
      return response.data
    } catch (error) {
      // console.error('Error fetching categories:', error)
      throw error
    }
  },

  // Get subcategories for a specific category
  getSubcategories: async (categoryId) => {
    try {
      const response = await categoryAxios.get(`/api/admin/categories/${categoryId}/subcategories`)
      return response.data
    } catch (error) {
      // console.error('Error fetching subcategories:', error)
      throw error
    }
  },

  // Get category by ID
  getCategory: async (categoryId) => {
    try {
      const categories = await categoryService.getCategories()
      return categories.find(cat => cat.id.toString() === categoryId.toString())
    } catch (error) {
      // console.error('Error fetching category:', error)
      throw error
    }
  },

  // Get subcategory by ID
  getSubcategory: async (categoryId, subcategoryId) => {
    try {
      const subcategories = await categoryService.getSubcategories(categoryId)
      return subcategories.find(sub => sub.id.toString() === subcategoryId.toString())
    } catch (error) {
      // console.error('Error fetching subcategory:', error)
      throw error
    }
  }
}

export const productService = {
  // Get all products
  getAllProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filters.category_id) {
        params.append('category_id', filters.category_id)
      }
      if (filters.subcategory_id) {
        params.append('subcategory_id', filters.subcategory_id)
      }
      if (filters.limit) {
        params.append('limit', filters.limit)
      }
      if (filters.exclude) {
        params.append('exclude', filters.exclude)
      }

      const response = await categoryAxios.get(`/api/products?${params.toString()}`)
      return response.data
    } catch (error) {
      // console.error('Error fetching products:', error)
      throw error
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId, filters = {}) => {
    return productService.getAllProducts({
      ...filters,
      category_id: categoryId
    })
  },

  // Get products by subcategory
  getProductsBySubcategory: async (categoryId, subcategoryId, filters = {}) => {
    return productService.getAllProducts({
      ...filters,
      category_id: categoryId,
      subcategory_id: subcategoryId
    })
  },

  // Get single product
  getProduct: async (productId) => {
    try {
      const response = await categoryAxios.get(`/api/products/${productId}`)
      return response.data
    } catch (error) {
      // console.error('Error fetching product:', error)
      throw error
    }
  }
} 