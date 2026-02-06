import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getProductsByCategory,
  searchProducts
} from '@/services/productservice'
import { getAllCategories } from '@/services/categoryService'
import { 
  getProductReviews, 
  getProductReviewSummary,
  createOrUpdateReview,
  deleteReview
} from '@/services/reviewService'

export const useProductStore = defineStore('products', () => {
  // State
  const products = ref([])
  const categories = ref([])
  const currentProduct = ref(null)
  const productReviews = ref([])
  const reviewSummary = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const filters = ref({
    categoryId: null,
    search: '',
    page: 0,
    size: 20
  })

  // Computed
  const filteredProducts = computed(() => {
    let filtered = products.value

    // Filter by category
    if (filters.value.categoryId) {
      filtered = filtered.filter(p => p.categoryId === filters.value.categoryId)
    }

    // Filter by search
    if (filters.value.search) {
      const searchLower = filters.value.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  })

  const productsByCategory = computed(() => {
    const grouped = {}
    categories.value.forEach(category => {
      grouped[category.id] = products.value.filter(p => p.categoryId === category.id)
    })
    return grouped
  })

  const lowStockProducts = computed(() => 
    products.value.filter(p => p.stockQuantity <= 5)
  )

  // Actions
  async function loadProducts() {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await getAllProducts(filters.value)
      products.value = response.data.content || response.data || []
      
      console.log('=== PRODUCT STORE DEBUG ===')
      console.log('Raw response:', response)
      console.log('Products loaded:', products.value)
      
      // Debug each product's category data
      products.value.forEach((product, index) => {
        console.log(`Product ${index + 1}:`, {
          id: product.id,
          name: product.name,
          categoryId: product.categoryId,
          category: product.category,
          category_id: product.category_id,
          categoryName: product.categoryName,
          fullProduct: product
        })
      })
    } catch (err) {
      error.value = 'Failed to load products'
      console.error('Error loading products:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function loadCategories() {
    try {
      const response = await getAllCategories()
      categories.value = response.data || []
      
      console.log('=== CATEGORIES LOADED DEBUG ===')
      console.log('Categories response:', response)
      console.log('Categories loaded:', categories.value)
    } catch (err) {
      console.error('Error loading categories:', err)
      categories.value = []
    }
  }

  async function loadProductById(id) {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await getProductById(id)
      currentProduct.value = response.data
      
      // Load reviews and summary
      await Promise.all([
        loadProductReviews(id),
        loadProductReviewSummary(id)
      ])
      
      return response.data
    } catch (err) {
      error.value = 'Failed to load product'
      console.error('Error loading product:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function loadProductReviews(productId, page = 0, size = 10) {
    try {
      const response = await getProductReviews(productId, page, size)
      productReviews.value = response.data.content || response.data || []
    } catch (err) {
      console.error('Error loading product reviews:', err)
      productReviews.value = []
    }
  }

  async function loadProductReviewSummary(productId) {
    try {
      const response = await getProductReviewSummary(productId)
      reviewSummary.value = response.data
    } catch (err) {
      console.error('Error loading review summary:', err)
      reviewSummary.value = null
    }
  }

  async function createNewProduct(productData, file) {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await createProduct(productData, file)
      
      // Add to local state
      products.value.push(response.data)
      
      return response.data
    } catch (err) {
      error.value = 'Failed to create product'
      console.error('Error creating product:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateExistingProduct(productId, productData, file) {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await updateProduct(productId, productData, file)
      
      // Update local state
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = response.data
      }
      
      // Update current product if it's the one being updated
      if (currentProduct.value?.id === productId) {
        currentProduct.value = response.data
      }
      
      return response.data
    } catch (err) {
      error.value = 'Failed to update product'
      console.error('Error updating product:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteExistingProduct(productId) {
    try {
      isLoading.value = true
      error.value = null
      
      await deleteProduct(productId)
      
      // Remove from local state
      products.value = products.value.filter(p => p.id !== productId)
      
      // Clear current product if it's the one being deleted
      if (currentProduct.value?.id === productId) {
        currentProduct.value = null
      }
    } catch (err) {
      error.value = 'Failed to delete product'
      console.error('Error deleting product:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function submitReview(productId, reviewData) {
    try {
      const response = await createOrUpdateReview(productId, reviewData)
      
      // Refresh reviews and summary
      await Promise.all([
        loadProductReviews(productId),
        loadProductReviewSummary(productId)
      ])
      
      return response.data
    } catch (err) {
      console.error('Error submitting review:', err)
      throw err
    }
  }

  async function removeReview(productId, reviewId) {
    try {
      await deleteReview(productId, reviewId)
      
      // Refresh reviews and summary
      await Promise.all([
        loadProductReviews(productId),
        loadProductReviewSummary(productId)
      ])
    } catch (err) {
      console.error('Error removing review:', err)
      throw err
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      categoryId: null,
      search: '',
      page: 0,
      size: 20
    }
  }

  // Initialize
  async function initialize() {
    await Promise.all([
      loadProducts(),
      loadCategories()
    ])
  }

  return {
    // State
    products,
    categories,
    currentProduct,
    productReviews,
    reviewSummary,
    isLoading,
    error,
    filters,
    
    // Computed
    filteredProducts,
    productsByCategory,
    lowStockProducts,
    
    // Actions
    loadProducts,
    loadCategories,
    loadProductById,
    loadProductReviews,
    loadProductReviewSummary,
    createNewProduct,
    updateExistingProduct,
    deleteExistingProduct,
    submitReview,
    removeReview,
    setFilters,
    clearFilters,
    initialize
  }
}) 