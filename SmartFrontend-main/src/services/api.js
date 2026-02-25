import axios from 'axios'
import { useToast } from 'vue-toastification'

// Environment variables - Use relative URLs for Vite proxy
const gatewayBase = import.meta.env.VITE_API_GATEWAY_BASE_URL || '/api'
const cartServiceUrl = import.meta.env.VITE_CART_SERVICE_URL || '/api/cart'

// Toast instance
const toast = useToast()

// Error types for consistent handling
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN'
}

// Error mapping function
export function mapErrorToType(error) {
  if (!error || !error.response) {
    return ErrorTypes.NETWORK
  }

  const status = error.response.status
  switch (status) {
    case 401:
      return ErrorTypes.AUTHENTICATION
    case 403:
      return ErrorTypes.AUTHORIZATION
    case 400:
      return ErrorTypes.VALIDATION
    case 404:
      return ErrorTypes.NOT_FOUND
    case 500:
      return ErrorTypes.SERVER_ERROR
    default:
      return ErrorTypes.UNKNOWN
  }
}

// Error message mapping
export function getErrorMessage(errorType, error) {
  switch (errorType) {
    case ErrorTypes.NETWORK:
      return 'Network error. Please check your connection.'
    case ErrorTypes.AUTHENTICATION:
      return 'Authentication failed. Please log in again.'
    case ErrorTypes.AUTHORIZATION:
      return 'You do not have permission to perform this action.'
    case ErrorTypes.VALIDATION:
      return error?.response?.data?.message || 'Invalid data provided.'
    case ErrorTypes.NOT_FOUND:
      return 'The requested resource was not found.'
    case ErrorTypes.SERVER_ERROR:
      return 'Server error. Please try again later.'
    default:
      return 'An unknown error occurred.'
  }
}

// API instances
export const productApi = axios.create({
  baseURL: `${gatewayBase}/products`,
  headers: { 'Content-Type': 'application/json' }
})

export const categoryApi = axios.create({
  baseURL: `${gatewayBase}/categories`,
  headers: { 'Content-Type': 'application/json' }
})

export const reviewApi = axios.create({
  baseURL: `${gatewayBase}/products`,
  headers: { 'Content-Type': 'application/json' }
})

export const cartApi = axios.create({
  baseURL: `${gatewayBase}/cart`,
  headers: { 'Content-Type': 'application/json' }
})

export const notificationApi = axios.create({
  baseURL: `${gatewayBase}/admin/notifications`,
  headers: { 'Content-Type': 'application/json' }
})

export const generalNotificationApi = axios.create({
  baseURL: `${gatewayBase}/notifications`,
  headers: { 'Content-Type': 'application/json' }
})

export const orderApi = axios.create({
  baseURL: `${gatewayBase}/orders`,
  headers: { 'Content-Type': 'application/json' }
})

export const customerApi = axios.create({
  baseURL: `${gatewayBase}/customers`,
  headers: { 'Content-Type': 'application/json' }
})

export const authApi = axios.create({
  baseURL: `${gatewayBase}/auth`,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor to include auth token
export const setupInterceptors = () => {
  const interceptor = (config) => {
    const token = localStorage.getItem('token')
    console.log('=== REQUEST INTERCEPTOR DEBUG ===')
    console.log('Request URL:', config.url)
    console.log('Request method:', config.method)
    console.log('Token exists:', !!token)
    console.log('Token length:', token?.length)

    if (token) {
      // Validate token format before using it
      try {
        const tokenParts = token.split('.')
        console.log('Token parts count:', tokenParts.length)
        if (tokenParts.length === 3) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('Authorization header set:', config.headers.Authorization ? 'Yes' : 'No')
        } else {
          console.warn('Invalid token format, removing from localStorage')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (error) {
        console.error('Error validating token:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } else {
      console.warn('No token found in localStorage')
    }
    return config
  }

  // Apply to all API instances except auth (auth doesn't need token for login/register)
  const apis = [productApi, categoryApi, reviewApi, cartApi, notificationApi, generalNotificationApi, orderApi, customerApi]
  apis.forEach(api => api.interceptors.request.use(interceptor))
}

// Response interceptor for error handling
export const setupResponseInterceptors = () => {
  const responseInterceptor = (response) => {
    return response
  }

  // Track shown toasts to prevent duplicates
  const shownToasts = new Set()

  const errorInterceptor = (error) => {
    const errorType = mapErrorToType(error)
    const message = getErrorMessage(errorType, error)

    // Create a unique key for this error to prevent duplicates
    const errorKey = `${errorType}-${error.response?.status}-${message}`

    // Handle network errors (services offline) - don't logout
    if (errorType === ErrorTypes.NETWORK) {
      console.warn('Network error - services may be offline:', error.message)
      if (!shownToasts.has(errorKey)) {
        toast.error('Unable to connect to server. Please check if services are running.')
        shownToasts.add(errorKey)
        // Clear the toast after 5 seconds to allow future similar errors
        setTimeout(() => shownToasts.delete(errorKey), 5000)
      }
      return Promise.reject(error)
    }

    // Handle authentication errors (401) - only logout for actual auth issues
    if (errorType === ErrorTypes.AUTHENTICATION) {
      // Only logout if we have a token but it's invalid
      const token = localStorage.getItem('token')
      if (token) {
        if (!shownToasts.has(errorKey)) {
          toast.error('Your session has expired. Please log in again.')
          shownToasts.add(errorKey)
        }
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Handle authorization errors (403) - only logout for actual permission issues
    if (errorType === ErrorTypes.AUTHORIZATION) {
      // Check if user is logged in
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (!token || !user) {
        if (!shownToasts.has(errorKey)) {
          toast.error('Please log in to access this feature')
          shownToasts.add(errorKey)
        }
        window.location.href = '/login'
      } else {
        // For 403 errors, show warning but don't automatically logout
        // as it might be a temporary permission issue
        if (!shownToasts.has(errorKey)) {
          console.error(`403 Forbidden from URL: ${error.config?.url}`, error.response?.data)
          fetch('http://localhost:9999/', {
            method: 'POST',
            body: JSON.stringify({ url: error.config?.url, method: error.config?.method, status: error.response?.status, data: error.response?.data }),
            headers: { 'Content-Type': 'application/json' }
          }).catch(e => console.error('Failed to report to interceptor', e))
          console.warn('403 Authorization error - user might not have required permissions')
          toast.error('You do not have permission to perform this action.')
          shownToasts.add(errorKey)
          setTimeout(() => shownToasts.delete(errorKey), 5000)
        }
      }
      return Promise.reject(error)
    }

    // Show toast for other errors (validation, server errors, etc.) - but only once
    if (errorType !== ErrorTypes.NETWORK && !shownToasts.has(errorKey)) {
      toast.error(message)
      shownToasts.add(errorKey)
      setTimeout(() => shownToasts.delete(errorKey), 5000)
    }

    return Promise.reject(error)
  }

  // Apply to all API instances except auth
  const apis = [productApi, categoryApi, reviewApi, cartApi, notificationApi, generalNotificationApi, orderApi, customerApi]
  apis.forEach(api => api.interceptors.response.use(responseInterceptor, errorInterceptor))
}

// Success toast helper
export const showSuccessToast = (message) => {
  toast.success(message)
}

// Error toast helper
export const showErrorToast = (message) => {
  toast.error(message)
}

// Warning toast helper
export const showWarningToast = (message) => {
  toast.warning(message)
}

// Info toast helper
export const showInfoToast = (message) => {
  toast.info(message)
}

// Initialize interceptors automatically
setupInterceptors()
setupResponseInterceptors()
