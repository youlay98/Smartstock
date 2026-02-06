import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart as clearCartApi 
} from '@/services/cartService'
import { showSuccessToast, showWarningToast } from '@/services/api'

const CART_STORAGE_KEY = 'smartstock_cart'
const CART_VERSION = '1.0'

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const totalItems = computed(() => items.value.length)
  
  const totalQuantities = computed(() => 
    items.value.reduce((sum, item) => sum + (item.quantity || 0), 0)
  )

  const subtotal = computed(() => 
    items.value.reduce((sum, item) => {
      // Use totalPrice from backend if available, otherwise calculate from unitPrice
      if (item.totalPrice !== undefined && item.totalPrice !== null) {
        return sum + Number(item.totalPrice)
      }
      
      // Fallback calculation
      const price = item.unitPrice || 0
      const quantity = item.quantity || 0
      const itemTotal = Number(price) * Number(quantity)
      return sum + (isNaN(itemTotal) ? 0 : itemTotal)
    }, 0)
  )

  const total = computed(() => subtotal.value)

  const isEmpty = computed(() => items.value.length === 0)

  // Actions
  async function loadCart() {
    try {
      isLoading.value = true
      error.value = null
      console.log('Loading cart from server...')
      const response = await getCart()
      items.value = response.data.items || []
      // Don't save to localStorage automatically - only save when explicitly needed
      
      // Log cart data for debugging
      console.log('Cart loaded from server:', response.data)
      console.log('Items count after loading:', items.value.length)
    } catch (err) {
      error.value = 'Failed to load cart'
      console.error('Error loading cart:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function refreshCart() {
    try {
      isLoading.value = true
      error.value = null
      const response = await getCart()
      items.value = response.data.items || []
      // Don't save to localStorage automatically - only save when explicitly needed
      
      // Log cart data for debugging
      console.log('Cart refreshed from server:', response.data)
    } catch (err) {
      error.value = 'Failed to refresh cart'
      console.error('Error refreshing cart:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function addItem(productId, quantity = 1) {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('Adding item to cart:', productId, 'quantity:', quantity)
      await addToCart({ productId, quantity })
      
      // Always load fresh data from server after adding item
      await loadCart()
      
      showSuccessToast('Item added to cart!')
    } catch (err) {
      error.value = 'Failed to add item'
      console.error('Error adding item:', err)
      
      // Check for specific error message about duplicate product
      if (err.response?.data?.error && err.response.data.error.includes('already in your cart')) {
        // Only show this message once to avoid spam
        showWarningToast('Product is already in your cart. ')
        // Don't throw the error to prevent the generic error interceptor from showing its message
        return
      } else {
        showWarningToast('Failed to add item to cart')
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  async function updateItemQuantity(itemId, quantity) {
    try {
      isLoading.value = true
      error.value = null
      
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }
      
      console.log('Updating item quantity:', itemId, 'to:', quantity)
      await updateCartItem(itemId, quantity)
      
      // Refresh cart to get updated data
      await refreshCart()
      
      showSuccessToast('Cart updated!')
    } catch (err) {
      error.value = 'Failed to update cart'
      console.error('Error updating cart:', err)
      showWarningToast('Failed to update cart')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function removeItem(itemId) {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('Removing item with ID:', itemId)
      await removeFromCart(itemId)
      
      // Refresh cart to get updated data
      await refreshCart()
      
      showSuccessToast('Item removed from cart!')
    } catch (err) {
      error.value = 'Failed to remove item'
      console.error('Error removing item:', err)
      showWarningToast('Failed to remove item')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function clearCart() {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('=== CLEARING CART ===')
      console.log('Items before clearing:', items.value.length)
      
      await clearCartApi()
      console.log('Backend cart cleared successfully')
      
      // Clear both the store and localStorage
      items.value = []
      clearLocalStorage()
      
      console.log('Frontend cart cleared, items after:', items.value.length)
      console.log('=== CART CLEARED ===')
      
      showSuccessToast('Cart cleared!')
    } catch (err) {
      error.value = 'Failed to clear cart'
      console.error('Error clearing cart:', err)
      showWarningToast('Failed to clear cart')
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Manual reset function to completely clear everything
  function resetCart() {
    items.value = []
    clearLocalStorage()
    error.value = null
    console.log('Cart manually reset')
  }

  // Local storage persistence
  function saveToLocalStorage() {
    const cartData = {
      version: CART_VERSION,
      items: items.value,
      timestamp: Date.now()
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData))
  }

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) return false

      const cartData = JSON.parse(stored)
      
      // Check version compatibility
      if (cartData.version !== CART_VERSION) {
        clearLocalStorage()
        return false
      }

      // Check if data is not too old (1 hour instead of 24 hours for better consistency)
      const isExpired = Date.now() - cartData.timestamp > 60 * 60 * 1000
      if (isExpired) {
        clearLocalStorage()
        return false
      }

      // Only load if we have valid items
      if (!cartData.items || !Array.isArray(cartData.items)) {
        clearLocalStorage()
        return false
      }

      items.value = cartData.items
      console.log('Loaded cart from localStorage:', cartData.items.length, 'items')
      return true
    } catch (err) {
      console.error('Error loading cart from localStorage:', err)
      clearLocalStorage()
      return false
    }
  }

  function clearLocalStorage() {
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  // Initialize cart from localStorage on store creation
  // loadFromLocalStorage() // Temporarily disabled to prevent stale data issues

  return {
    // State
    items,
    isLoading,
    error,
    
    // Computed
    totalItems,
    totalQuantities,
    subtotal,
    total,
    isEmpty,
    
    // Actions
    loadCart,
    refreshCart,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    resetCart,
    
    // Local storage
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
}) 