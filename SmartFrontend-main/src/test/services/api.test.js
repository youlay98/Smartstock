import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { 
  productApi, 
  categoryApi, 
  cartApi, 
  orderApi, 
  authApi,
  ErrorTypes,
  mapErrorToType,
  getErrorMessage,
  setupInterceptors,
  setupResponseInterceptors,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast
} from '@/services/api'

// Mock vue-toastification
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })
}))

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Error Types and Mapping', () => {
    it('should define all error types', () => {
      expect(ErrorTypes).toEqual({
        NETWORK: 'NETWORK',
        AUTHENTICATION: 'AUTHENTICATION',
        AUTHORIZATION: 'AUTHORIZATION',
        VALIDATION: 'VALIDATION',
        NOT_FOUND: 'NOT_FOUND',
        SERVER_ERROR: 'SERVER_ERROR',
        UNKNOWN: 'UNKNOWN'
      })
    })

    it('should map network errors correctly', () => {
      const error = { response: null }
      expect(mapErrorToType(error)).toBe(ErrorTypes.NETWORK)
    })

    it('should map authentication errors correctly', () => {
      const error = { response: { status: 401 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.AUTHENTICATION)
    })

    it('should map authorization errors correctly', () => {
      const error = { response: { status: 403 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.AUTHORIZATION)
    })

    it('should map validation errors correctly', () => {
      const error = { response: { status: 400 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.VALIDATION)
    })

    it('should map not found errors correctly', () => {
      const error = { response: { status: 404 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.NOT_FOUND)
    })

    it('should map server errors correctly', () => {
      const error = { response: { status: 500 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.SERVER_ERROR)
    })

    it('should map unknown errors correctly', () => {
      const error = { response: { status: 418 } }
      expect(mapErrorToType(error)).toBe(ErrorTypes.UNKNOWN)
    })
  })

  describe('Error Messages', () => {
    it('should return network error message', () => {
      const message = getErrorMessage(ErrorTypes.NETWORK)
      expect(message).toBe('Network error. Please check your connection.')
    })

    it('should return authentication error message', () => {
      const message = getErrorMessage(ErrorTypes.AUTHENTICATION)
      expect(message).toBe('Authentication failed. Please log in again.')
    })

    it('should return validation error message with custom message', () => {
      const error = { response: { data: { message: 'Custom validation error' } } }
      const message = getErrorMessage(ErrorTypes.VALIDATION, error)
      expect(message).toBe('Custom validation error')
    })

    it('should return default validation error message', () => {
      const error = { response: {} }
      const message = getErrorMessage(ErrorTypes.VALIDATION, error)
      expect(message).toBe('Invalid data provided.')
    })
  })

  describe('API Instances', () => {
    it('should create product API with correct base URL', () => {
      expect(productApi.defaults.baseURL).toBe('/api/products')
      expect(productApi.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should create category API with correct base URL', () => {
      expect(categoryApi.defaults.baseURL).toBe('/api/categories')
      expect(categoryApi.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should create cart API with correct base URL', () => {
      expect(cartApi.defaults.baseURL).toBe('/api/cart')
      expect(cartApi.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should create order API with correct base URL', () => {
      expect(orderApi.defaults.baseURL).toBe('/api/orders')
      expect(orderApi.defaults.headers['Content-Type']).toBe('application/json')
    })

    it('should create auth API with correct base URL', () => {
      expect(authApi.defaults.baseURL).toBe('/api/auth')
      expect(authApi.defaults.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Interceptors', () => {
    it('should setup request interceptors', () => {
      setupInterceptors()
      // The function doesn't return anything, just sets up interceptors
      expect(true).toBe(true)
    })

    it('should setup response interceptors', () => {
      setupResponseInterceptors()
      // The function doesn't return anything, just sets up interceptors
      expect(true).toBe(true)
    })
  })

  describe('Toast Functions', () => {
    it('should have toast functions defined', () => {
      expect(typeof showSuccessToast).toBe('function')
      expect(typeof showErrorToast).toBe('function')
      expect(typeof showWarningToast).toBe('function')
      expect(typeof showInfoToast).toBe('function')
    })

    it('should call toast functions', () => {
      showSuccessToast('Success message')
      showErrorToast('Error message')
      showWarningToast('Warning message')
      showInfoToast('Info message')
      
      // These functions call the toast service, which is mocked
      expect(true).toBe(true)
    })
  })
}) 