import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart as clearCartApi 
} from '@/services/cartService'
import { showSuccessToast, showWarningToast } from '@/services/api'

// Mock cart service
vi.mock('@/services/cartService', () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn()
}))

// Mock API service
vi.mock('@/services/api', () => ({
  showSuccessToast: vi.fn(),
  showWarningToast: vi.fn()
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('Cart Store', () => {
  let pinia
  let store

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    mockLocalStorage.clear.mockClear()
    
    // Create fresh Pinia instance
    pinia = createPinia()
    setActivePinia(pinia)
    store = useCartStore()
  })

  afterEach(() => {
    // Clean up after each test
    mockLocalStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with empty cart', () => {
      expect(store.items).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should have correct computed properties for empty cart', () => {
      expect(store.totalItems).toBe(0)
      expect(store.totalQuantities).toBe(0)
      expect(store.subtotal).toBe(0)
      expect(store.total).toBe(0)
      expect(store.isEmpty).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Set up cart with items for testing computed properties
      store.items = [
        { id: 1, productId: 1, quantity: 2, unitPrice: 10.50, totalPrice: 21.00 },
        { id: 2, productId: 2, quantity: 1, unitPrice: 15.00, totalPrice: 15.00 },
        { id: 3, productId: 3, quantity: 3, unitPrice: 5.00, totalPrice: 15.00 }
      ]
    })

    it('should calculate total items correctly', () => {
      expect(store.totalItems).toBe(3)
    })

    it('should calculate total quantities correctly', () => {
      expect(store.totalQuantities).toBe(6) // 2 + 1 + 3
    })

    it('should calculate subtotal using totalPrice when available', () => {
      expect(store.subtotal).toBe(51.00) // 21.00 + 15.00 + 15.00
    })

    it('should calculate subtotal using unitPrice when totalPrice is not available', () => {
      store.items = [
        { id: 1, productId: 1, quantity: 2, unitPrice: 10.50 },
        { id: 2, productId: 2, quantity: 1, unitPrice: 15.00 }
      ]
      expect(store.subtotal).toBe(36.00) // (10.50 * 2) + (15.00 * 1)
    })

    it('should handle invalid price calculations gracefully', () => {
      store.items = [
        { id: 1, productId: 1, quantity: 2, unitPrice: 'invalid' },
        { id: 2, productId: 2, quantity: 1, unitPrice: 15.00 }
      ]
      expect(store.subtotal).toBe(15.00) // Only valid price is counted
    })

    it('should calculate total correctly', () => {
      expect(store.total).toBe(51.00) // Same as subtotal
    })

    it('should return false for isEmpty when cart has items', () => {
      expect(store.isEmpty).toBe(false)
    })

    it('should return true for isEmpty when cart is empty', () => {
      store.items = []
      expect(store.isEmpty).toBe(true)
    })
  })

  describe('loadCart', () => {
    it('should load cart successfully from server', async () => {
      const mockCartData = {
        items: [
          { id: 1, productId: 1, quantity: 2, unitPrice: 10.50, totalPrice: 21.00 },
          { id: 2, productId: 2, quantity: 1, unitPrice: 15.00, totalPrice: 15.00 }
        ]
      }
      
      getCart.mockResolvedValue({ data: mockCartData })
      
      await store.loadCart()
      
      expect(getCart).toHaveBeenCalled()
      expect(store.items).toEqual(mockCartData.items)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle empty cart response', async () => {
      getCart.mockResolvedValue({ data: { items: [] } })
      
      await store.loadCart()
      
      expect(store.items).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle server error', async () => {
      const error = new Error('Server error')
      getCart.mockRejectedValue(error)
      
      await store.loadCart()
      
      expect(store.error).toBe('Failed to load cart')
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state correctly', async () => {
      getCart.mockResolvedValue({ data: { items: [] } })
      
      const loadPromise = store.loadCart()
      
      expect(store.isLoading).toBe(true)
      
      await loadPromise
      
      expect(store.isLoading).toBe(false)
    })
  })

  describe('refreshCart', () => {
    it('should refresh cart successfully', async () => {
      const mockCartData = {
        items: [
          { id: 1, productId: 1, quantity: 3, unitPrice: 10.50, totalPrice: 31.50 }
        ]
      }
      
      getCart.mockResolvedValue({ data: mockCartData })
      
      await store.refreshCart()
      
      expect(getCart).toHaveBeenCalled()
      expect(store.items).toEqual(mockCartData.items)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle refresh error', async () => {
      const error = new Error('Refresh failed')
      getCart.mockRejectedValue(error)
      
      await store.refreshCart()
      
      expect(store.error).toBe('Failed to refresh cart')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('addItem', () => {
    it('should add item successfully', async () => {
      const mockCartData = {
        items: [
          { id: 1, productId: 1, quantity: 1, unitPrice: 10.50, totalPrice: 10.50 }
        ]
      }
      
      addToCart.mockResolvedValue({})
      getCart.mockResolvedValue({ data: mockCartData })
      
      await store.addItem(1, 1)
      
      expect(addToCart).toHaveBeenCalledWith({ productId: 1, quantity: 1 })
      expect(getCart).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith('Item added to cart!')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle duplicate product error gracefully', async () => {
      const error = {
        response: {
          data: {
            error: 'Product is already in your cart'
          }
        }
      }
      
      addToCart.mockRejectedValue(error)
      
      await store.addItem(1, 1)
      
      expect(showWarningToast).toHaveBeenCalledWith('Product is already in your cart. ')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to add item')
    })

    it('should handle general add item error', async () => {
      const error = new Error('Add failed')
      addToCart.mockRejectedValue(error)
      
      await expect(store.addItem(1, 1)).rejects.toThrow('Add failed')
      
      expect(showWarningToast).toHaveBeenCalledWith('Failed to add item to cart')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to add item')
    })
  })

  describe('updateItemQuantity', () => {
    it('should update item quantity successfully', async () => {
      const mockCartData = {
        items: [
          { id: 1, productId: 1, quantity: 3, unitPrice: 10.50, totalPrice: 31.50 }
        ]
      }
      
      updateCartItem.mockResolvedValue({})
      getCart.mockResolvedValue({ data: mockCartData })
      
      await store.updateItemQuantity(1, 3)
      
      expect(updateCartItem).toHaveBeenCalledWith(1, 3)
      expect(getCart).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith('Cart updated!')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should remove item when quantity is 0', async () => {
      removeFromCart.mockResolvedValue({})
      getCart.mockResolvedValue({ data: { items: [] } })
      
      await store.updateItemQuantity(1, 0)
      
      expect(removeFromCart).toHaveBeenCalledWith(1)
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('should remove item when quantity is negative', async () => {
      removeFromCart.mockResolvedValue({})
      getCart.mockResolvedValue({ data: { items: [] } })
      
      await store.updateItemQuantity(1, -1)
      
      expect(removeFromCart).toHaveBeenCalledWith(1)
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('should handle update error', async () => {
      const error = new Error('Update failed')
      updateCartItem.mockRejectedValue(error)
      
      await expect(store.updateItemQuantity(1, 2)).rejects.toThrow('Update failed')
      
      expect(showWarningToast).toHaveBeenCalledWith('Failed to update cart')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to update cart')
    })
  })

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      const mockCartData = {
        items: [
          { id: 2, productId: 2, quantity: 1, unitPrice: 15.00, totalPrice: 15.00 }
        ]
      }
      
      removeFromCart.mockResolvedValue({})
      getCart.mockResolvedValue({ data: mockCartData })
      
      await store.removeItem(1)
      
      expect(removeFromCart).toHaveBeenCalledWith(1)
      expect(getCart).toHaveBeenCalled()
      expect(showSuccessToast).toHaveBeenCalledWith('Item removed from cart!')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle remove error', async () => {
      const error = new Error('Remove failed')
      removeFromCart.mockRejectedValue(error)
      
      await expect(store.removeItem(1)).rejects.toThrow('Remove failed')
      
      expect(showWarningToast).toHaveBeenCalledWith('Failed to remove item')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to remove item')
    })
  })

  describe('clearCart', () => {
    it('should clear cart successfully', async () => {
      clearCartApi.mockResolvedValue({})
      
      await store.clearCart()
      
      expect(clearCartApi).toHaveBeenCalled()
      expect(store.items).toEqual([])
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
      expect(showSuccessToast).toHaveBeenCalledWith('Cart cleared!')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle clear error', async () => {
      const error = new Error('Clear failed')
      clearCartApi.mockRejectedValue(error)
      
      await expect(store.clearCart()).rejects.toThrow('Clear failed')
      
      expect(showWarningToast).toHaveBeenCalledWith('Failed to clear cart')
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe('Failed to clear cart')
    })
  })

  describe('resetCart', () => {
    it('should reset cart state completely', () => {
      // Set some initial state
      store.items = [{ id: 1, productId: 1, quantity: 1 }]
      store.error = 'Some error'
      
      store.resetCart()
      
      expect(store.items).toEqual([])
      expect(store.error).toBe(null)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })
  })

  describe('Local Storage', () => {
    it('should save cart to localStorage correctly', () => {
      store.items = [
        { id: 1, productId: 1, quantity: 2, unitPrice: 10.50, totalPrice: 21.00 }
      ]
      
      store.saveToLocalStorage()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smartstock_cart',
        expect.stringContaining('"version":"1.0"')
      )
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1])
      expect(savedData.items).toEqual(store.items)
      expect(savedData.version).toBe('1.0')
      expect(savedData.timestamp).toBeDefined()
    })

    it('should load cart from localStorage successfully', () => {
      const mockCartData = {
        version: '1.0',
        items: [
          { id: 1, productId: 1, quantity: 2, unitPrice: 10.50, totalPrice: 21.00 }
        ],
        timestamp: Date.now()
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCartData))
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(true)
      expect(store.items).toEqual(mockCartData.items)
    })

    it('should handle missing localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(false)
      expect(store.items).toEqual([])
    })

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })

    it('should handle version mismatch', () => {
      const mockCartData = {
        version: '0.9',
        items: [{ id: 1, productId: 1, quantity: 1 }],
        timestamp: Date.now()
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCartData))
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })

    it('should handle expired data', () => {
      const mockCartData = {
        version: '1.0',
        items: [{ id: 1, productId: 1, quantity: 1 }],
        timestamp: Date.now() - (2 * 60 * 60 * 1000) // 2 hours old
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCartData))
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })

    it('should handle missing items array', () => {
      const mockCartData = {
        version: '1.0',
        timestamp: Date.now()
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCartData))
      
      const result = store.loadFromLocalStorage()
      
      expect(result).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })

    it('should clear localStorage correctly', () => {
      store.clearLocalStorage()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smartstock_cart')
    })
  })
}) 