import { cartApi } from './api'

// Helper function to retry API calls
async function retryApiCall(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}

// Get user's cart
export function getCart() {
  return retryApiCall(() => cartApi.get(''))
}

// Add item to cart
export function addToCart(itemData) {
  return retryApiCall(() => cartApi.post('/items', itemData))
}

// Update item quantity in cart
export function updateCartItem(itemId, quantity) {
  return retryApiCall(() => cartApi.put(`/items/${itemId}?quantity=${quantity}`))
}

// Remove item from cart
export function removeFromCart(itemId) {
  return retryApiCall(() => cartApi.delete(`/items/${itemId}`))
}

// Clear entire cart
export function clearCart() {
  return retryApiCall(() => cartApi.delete(''))
}

// Refresh cart prices
export function refreshCartPrices() {
  return retryApiCall(() => cartApi.post('/refresh-prices'))
} 