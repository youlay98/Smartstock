import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/products'
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

// Mock product service
vi.mock('@/services/productservice', () => ({
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getProductsByCategory: vi.fn(),
  searchProducts: vi.fn()
}))

// Mock category service
vi.mock('@/services/categoryService', () => ({
  getAllCategories: vi.fn()
}))

// Mock review service
vi.mock('@/services/reviewService', () => ({
  getProductReviews: vi.fn(),
  getProductReviewSummary: vi.fn(),
  createOrUpdateReview: vi.fn(),
  deleteReview: vi.fn()
}))

describe('Product Store', () => {
  let pinia
  let store

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Create fresh Pinia instance
    pinia = createPinia()
    setActivePinia(pinia)
    store = useProductStore()
  })

  afterEach(() => {
    // Clean up after each test
  })

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      expect(store.products).toEqual([])
      expect(store.categories).toEqual([])
      expect(store.currentProduct).toBe(null)
      expect(store.productReviews).toEqual([])
      expect(store.reviewSummary).toBe(null)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should have correct initial filters', () => {
      expect(store.filters).toEqual({
        categoryId: null,
        search: '',
        page: 0,
        size: 20
      })
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Set up test data
      store.products = [
        { id: 1, name: 'Laptop', description: 'High performance laptop', categoryId: 1, stockQuantity: 10 },
        { id: 2, name: 'Mouse', description: 'Wireless mouse', categoryId: 2, stockQuantity: 3 },
        { id: 3, name: 'Keyboard', description: 'Mechanical keyboard', categoryId: 1, stockQuantity: 15 },
        { id: 4, name: 'Monitor', description: '4K monitor', categoryId: 3, stockQuantity: 2 }
      ]
      
      store.categories = [
        { id: 1, name: 'Computers' },
        { id: 2, name: 'Accessories' },
        { id: 3, name: 'Displays' }
      ]
    })

    describe('filteredProducts', () => {
      it('should return all products when no filters are applied', () => {
        expect(store.filteredProducts).toHaveLength(4)
      })

      it('should filter by category', () => {
        store.filters.categoryId = 1
        expect(store.filteredProducts).toHaveLength(2)
        expect(store.filteredProducts.every(p => p.categoryId === 1)).toBe(true)
      })

      it('should filter by search term in name', () => {
        store.filters.search = 'laptop'
        expect(store.filteredProducts).toHaveLength(1)
        expect(store.filteredProducts[0].name).toBe('Laptop')
      })

      it('should filter by search term in description', () => {
        store.filters.search = 'wireless'
        expect(store.filteredProducts).toHaveLength(1)
        expect(store.filteredProducts[0].name).toBe('Mouse')
      })

      it('should be case insensitive', () => {
        store.filters.search = 'LAPTOP'
        expect(store.filteredProducts).toHaveLength(1)
        expect(store.filteredProducts[0].name).toBe('Laptop')
      })

      it('should combine category and search filters', () => {
        store.filters.categoryId = 1
        store.filters.search = 'keyboard'
        expect(store.filteredProducts).toHaveLength(1)
        expect(store.filteredProducts[0].name).toBe('Keyboard')
      })
    })

    describe('productsByCategory', () => {
      it('should group products by category', () => {
        const grouped = store.productsByCategory
        expect(grouped[1]).toHaveLength(2) // Computers
        expect(grouped[2]).toHaveLength(1) // Accessories
        expect(grouped[3]).toHaveLength(1) // Displays
      })

      it('should handle empty categories', () => {
        store.categories = []
        expect(store.productsByCategory).toEqual({})
      })
    })

    describe('lowStockProducts', () => {
      it('should return products with stock <= 5', () => {
        const lowStock = store.lowStockProducts
        expect(lowStock).toHaveLength(2)
        expect(lowStock.every(p => p.stockQuantity <= 5)).toBe(true)
      })

      it('should return empty array when no low stock products', () => {
        store.products = store.products.map(p => ({ ...p, stockQuantity: 10 }))
        expect(store.lowStockProducts).toHaveLength(0)
      })
    })
  })

  describe('loadProducts', () => {
    it('should load products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]
      
      getAllProducts.mockResolvedValue({ data: { content: mockProducts } })
      
      await store.loadProducts()
      
      expect(getAllProducts).toHaveBeenCalledWith(store.filters)
      expect(store.products).toEqual(mockProducts)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle direct array response', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]
      
      getAllProducts.mockResolvedValue({ data: mockProducts })
      
      await store.loadProducts()
      
      expect(store.products).toEqual(mockProducts)
    })

    it('should handle empty response', async () => {
      getAllProducts.mockResolvedValue({ data: { content: [] } })
      
      await store.loadProducts()
      
      expect(store.products).toEqual([])
    })

    it('should handle server error', async () => {
      const error = new Error('Server error')
      getAllProducts.mockRejectedValue(error)
      
      await store.loadProducts()
      
      expect(store.error).toBe('Failed to load products')
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state correctly', async () => {
      getAllProducts.mockResolvedValue({ data: { content: [] } })
      
      const loadPromise = store.loadProducts()
      
      expect(store.isLoading).toBe(true)
      
      await loadPromise
      
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadCategories', () => {
    it('should load categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1' },
        { id: 2, name: 'Category 2' }
      ]
      
      getAllCategories.mockResolvedValue({ data: mockCategories })
      
      await store.loadCategories()
      
      expect(getAllCategories).toHaveBeenCalled()
      expect(store.categories).toEqual(mockCategories)
    })

    it('should handle error gracefully', async () => {
      const error = new Error('Category error')
      getAllCategories.mockRejectedValue(error)
      
      await store.loadCategories()
      
      expect(store.categories).toEqual([])
    })
  })

  describe('loadProductById', () => {
    it('should load product and reviews successfully', async () => {
      const mockProduct = { id: 1, name: 'Test Product' }
      const mockReviews = [{ id: 1, rating: 5 }]
      const mockSummary = { averageRating: 4.5 }
      
      getProductById.mockResolvedValue({ data: mockProduct })
      getProductReviews.mockResolvedValue({ data: { content: mockReviews } })
      getProductReviewSummary.mockResolvedValue({ data: mockSummary })
      
      const result = await store.loadProductById(1)
      
      expect(getProductById).toHaveBeenCalledWith(1)
      expect(getProductReviews).toHaveBeenCalledWith(1, 0, 10)
      expect(getProductReviewSummary).toHaveBeenCalledWith(1)
      expect(store.currentProduct).toEqual(mockProduct)
      expect(store.productReviews).toEqual(mockReviews)
      expect(store.reviewSummary).toEqual(mockSummary)
      expect(result).toEqual(mockProduct)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle product loading error', async () => {
      const error = new Error('Product not found')
      getProductById.mockRejectedValue(error)
      
      await expect(store.loadProductById(999)).rejects.toThrow('Product not found')
      
      expect(store.error).toBe('Failed to load product')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('loadProductReviews', () => {
    it('should load reviews successfully', async () => {
      const mockReviews = [
        { id: 1, rating: 5, comment: 'Great product' },
        { id: 2, rating: 4, comment: 'Good product' }
      ]
      
      getProductReviews.mockResolvedValue({ data: { content: mockReviews } })
      
      await store.loadProductReviews(1, 0, 10)
      
      expect(getProductReviews).toHaveBeenCalledWith(1, 0, 10)
      expect(store.productReviews).toEqual(mockReviews)
    })

    it('should handle error gracefully', async () => {
      const error = new Error('Reviews error')
      getProductReviews.mockRejectedValue(error)
      
      await store.loadProductReviews(1)
      
      expect(store.productReviews).toEqual([])
    })
  })

  describe('loadProductReviewSummary', () => {
    it('should load review summary successfully', async () => {
      const mockSummary = { averageRating: 4.5, totalReviews: 10 }
      
      getProductReviewSummary.mockResolvedValue({ data: mockSummary })
      
      await store.loadProductReviewSummary(1)
      
      expect(getProductReviewSummary).toHaveBeenCalledWith(1)
      expect(store.reviewSummary).toEqual(mockSummary)
    })

    it('should handle error gracefully', async () => {
      const error = new Error('Summary error')
      getProductReviewSummary.mockRejectedValue(error)
      
      await store.loadProductReviewSummary(1)
      
      expect(store.reviewSummary).toBe(null)
    })
  })

  describe('createNewProduct', () => {
    it('should create product successfully', async () => {
      const productData = { name: 'New Product', price: 100 }
      const file = new File([''], 'test.jpg')
      const mockProduct = { id: 5, ...productData }
      
      createProduct.mockResolvedValue({ data: mockProduct })
      
      const result = await store.createNewProduct(productData, file)
      
      expect(createProduct).toHaveBeenCalledWith(productData, file)
      expect(store.products).toHaveLength(1)
      expect(store.products[0]).toEqual(mockProduct)
      expect(result).toEqual(mockProduct)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle creation error', async () => {
      const productData = { name: 'New Product' }
      const error = new Error('Creation failed')
      createProduct.mockRejectedValue(error)
      
      await expect(store.createNewProduct(productData)).rejects.toThrow('Creation failed')
      
      expect(store.error).toBe('Failed to create product')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('updateExistingProduct', () => {
    beforeEach(() => {
      store.products = [
        { id: 1, name: 'Old Name', price: 100 },
        { id: 2, name: 'Product 2', price: 200 }
      ]
    })

    it('should update product successfully', async () => {
      const productData = { name: 'Updated Name', price: 150 }
      const file = new File([''], 'updated.jpg')
      const mockUpdatedProduct = { id: 1, ...productData }
      
      updateProduct.mockResolvedValue({ data: mockUpdatedProduct })
      
      const result = await store.updateExistingProduct(1, productData, file)
      
      expect(updateProduct).toHaveBeenCalledWith(1, productData, file)
      expect(store.products[0]).toEqual(mockUpdatedProduct)
      expect(result).toEqual(mockUpdatedProduct)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should update current product if it matches', async () => {
      store.currentProduct = { id: 1, name: 'Old Name' }
      const productData = { name: 'Updated Name' }
      const mockUpdatedProduct = { id: 1, ...productData }
      
      updateProduct.mockResolvedValue({ data: mockUpdatedProduct })
      
      await store.updateExistingProduct(1, productData)
      
      expect(store.currentProduct).toEqual(mockUpdatedProduct)
    })

    it('should handle update error', async () => {
      const productData = { name: 'Updated Name' }
      const error = new Error('Update failed')
      updateProduct.mockRejectedValue(error)
      
      await expect(store.updateExistingProduct(1, productData)).rejects.toThrow('Update failed')
      
      expect(store.error).toBe('Failed to update product')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('deleteExistingProduct', () => {
    beforeEach(() => {
      store.products = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]
    })

    it('should delete product successfully', async () => {
      deleteProduct.mockResolvedValue({})
      
      await store.deleteExistingProduct(1)
      
      expect(deleteProduct).toHaveBeenCalledWith(1)
      expect(store.products).toHaveLength(1)
      expect(store.products[0].id).toBe(2)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should clear current product if it matches deleted product', async () => {
      store.currentProduct = { id: 1, name: 'Product 1' }
      deleteProduct.mockResolvedValue({})
      
      await store.deleteExistingProduct(1)
      
      expect(store.currentProduct).toBe(null)
    })

    it('should handle deletion error', async () => {
      const error = new Error('Delete failed')
      deleteProduct.mockRejectedValue(error)
      
      await expect(store.deleteExistingProduct(1)).rejects.toThrow('Delete failed')
      
      expect(store.error).toBe('Failed to delete product')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('submitReview', () => {
    it('should submit review and refresh data', async () => {
      const reviewData = { rating: 5, comment: 'Great product' }
      const mockReview = { id: 1, ...reviewData }
      const mockReviews = [mockReview]
      const mockSummary = { averageRating: 5 }
      
      createOrUpdateReview.mockResolvedValue({ data: mockReview })
      getProductReviews.mockResolvedValue({ data: { content: mockReviews } })
      getProductReviewSummary.mockResolvedValue({ data: mockSummary })
      
      const result = await store.submitReview(1, reviewData)
      
      expect(createOrUpdateReview).toHaveBeenCalledWith(1, reviewData)
      expect(getProductReviews).toHaveBeenCalledWith(1, 0, 10)
      expect(getProductReviewSummary).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockReview)
    })

    it('should handle review submission error', async () => {
      const reviewData = { rating: 5, comment: 'Great product' }
      const error = new Error('Review submission failed')
      createOrUpdateReview.mockRejectedValue(error)
      
      await expect(store.submitReview(1, reviewData)).rejects.toThrow('Review submission failed')
    })
  })

  describe('removeReview', () => {
    it('should remove review and refresh data', async () => {
      deleteReview.mockResolvedValue({})
      getProductReviews.mockResolvedValue({ data: { content: [] } })
      getProductReviewSummary.mockResolvedValue({ data: { averageRating: 0 } })
      
      await store.removeReview(1, 1)
      
      expect(deleteReview).toHaveBeenCalledWith(1, 1)
      expect(getProductReviews).toHaveBeenCalledWith(1, 0, 10)
      expect(getProductReviewSummary).toHaveBeenCalledWith(1)
    })

    it('should handle review removal error', async () => {
      const error = new Error('Review removal failed')
      deleteReview.mockRejectedValue(error)
      
      await expect(store.removeReview(1, 1)).rejects.toThrow('Review removal failed')
    })
  })

  describe('Filters', () => {
    it('should set filters correctly', () => {
      const newFilters = { categoryId: 1, search: 'laptop' }
      
      store.setFilters(newFilters)
      
      expect(store.filters.categoryId).toBe(1)
      expect(store.filters.search).toBe('laptop')
      expect(store.filters.page).toBe(0) // Should preserve existing values
      expect(store.filters.size).toBe(20)
    })

    it('should clear filters correctly', () => {
      // Set some filters first
      store.filters.categoryId = 1
      store.filters.search = 'laptop'
      store.filters.page = 2
      
      store.clearFilters()
      
      expect(store.filters).toEqual({
        categoryId: null,
        search: '',
        page: 0,
        size: 20
      })
    })
  })

  describe('initialize', () => {
    it('should load products and categories', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1' }]
      const mockCategories = [{ id: 1, name: 'Category 1' }]
      
      getAllProducts.mockResolvedValue({ data: { content: mockProducts } })
      getAllCategories.mockResolvedValue({ data: mockCategories })
      
      await store.initialize()
      
      expect(getAllProducts).toHaveBeenCalled()
      expect(getAllCategories).toHaveBeenCalled()
      expect(store.products).toEqual(mockProducts)
      expect(store.categories).toEqual(mockCategories)
    })
  })
}) 