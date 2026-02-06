import { describe, it, expect, beforeEach, vi } from 'vitest'
import { cartApi } from '@/services/api'
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '@/services/cartService'

// Mock cart API
vi.mock('@/services/api', () => ({
  cartApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('Cart Service - High Priority Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Essential Cart Operations', () => {
    it('should fetch cart successfully', async () => {
      const mockCartData = {
        items: [
          { id: 1, productId: 1, quantity: 2, unitPrice: 10.50, totalPrice: 21.00 }
        ],
        totalItems: 1,
        totalAmount: 21.00
      }
      
      cartApi.get.mockResolvedValue({ data: mockCartData })
      
      const result = await getCart()
      
      expect(cartApi.get).toHaveBeenCalledWith('')
      expect(result.data.items).toHaveLength(1)
    })

    it('should add item to cart successfully', async () => {
      const itemData = { productId: 1, quantity: 2 }
      const mockResponse = { message: 'Item added to cart' }
      
      cartApi.post.mockResolvedValue({ data: mockResponse })
      
      const result = await addToCart(itemData)
      
      expect(cartApi.post).toHaveBeenCalledWith('/items', itemData)
      expect(result.data.message).toBe('Item added to cart')
    })

    it('should update cart item quantity', async () => {
      const itemId = 1
      const quantity = 3
      const mockResponse = { message: 'Cart item updated' }
      
      cartApi.put.mockResolvedValue({ data: mockResponse })
      
      const result = await updateCartItem(itemId, quantity)
      
      expect(cartApi.put).toHaveBeenCalledWith(`/items/${itemId}?quantity=${quantity}`)
      expect(result.data.message).toBe('Cart item updated')
    })

    it('should remove item from cart', async () => {
      const itemId = 1
      const mockResponse = { message: 'Item removed from cart' }
      
      cartApi.delete.mockResolvedValue({ data: mockResponse })
      
      const result = await removeFromCart(itemId)
      
      expect(cartApi.delete).toHaveBeenCalledWith(`/items/${itemId}`)
      expect(result.data.message).toBe('Item removed from cart')
    })

    it('should clear cart', async () => {
      const mockResponse = { message: 'Cart cleared successfully' }
      
      cartApi.delete.mockResolvedValue({ data: mockResponse })
      
      const result = await clearCart()
      
      expect(cartApi.delete).toHaveBeenCalledWith('')
      expect(result.data.message).toBe('Cart cleared successfully')
    })
  })

  describe('Critical Error Handling', () => {
    it('should handle server errors', async () => {
      const error = new Error('Server error')
      cartApi.get.mockRejectedValue(error)
      
      await expect(getCart()).rejects.toThrow('Server error')
    })

    it('should handle network errors', async () => {
      const error = { response: null, message: 'Network Error' }
      cartApi.get.mockRejectedValue(error)
      
      await expect(getCart()).rejects.toEqual(error)
    })

    it('should handle authentication errors', async () => {
      const error = { 
        response: { 
          status: 401, 
          data: { message: 'Unauthorized' } 
        } 
      }
      cartApi.get.mockRejectedValue(error)
      
      await expect(getCart()).rejects.toEqual(error)
    })
  })

  describe('API Structure Validation', () => {
    it('should have all required API methods', () => {
      expect(cartApi.get).toBeDefined()
      expect(cartApi.post).toBeDefined()
      expect(cartApi.put).toBeDefined()
      expect(cartApi.delete).toBeDefined()
    })

    it('should maintain consistent request structure', async () => {
      const itemData = { productId: 1, quantity: 1 }
      
      cartApi.post.mockResolvedValue({ data: { message: 'Success' } })
      
      await addToCart(itemData)
      
      expect(cartApi.post).toHaveBeenCalledWith('/items', itemData)
    })
  })
}) 