import { render } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { vi } from 'vitest'

// Mock router
const createMockRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/products', component: { template: '<div>Products</div>' } },
      { path: '/cart', component: { template: '<div>Cart</div>' } },
      { path: '/orders', component: { template: '<div>Orders</div>' } },
      { path: '/admin', component: { template: '<div>Admin</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } }
    ]
  })
}

// Mock i18n
const createMockI18n = () => {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: {
      en: {
        common: {
          loading: 'Loading...',
          error: 'Error',
          success: 'Success',
          cancel: 'Cancel',
          save: 'Save',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add'
        },
        auth: {
          login: 'Login',
          register: 'Register',
          logout: 'Logout',
          email: 'Email',
          password: 'Password',
          username: 'Username'
        },
        products: {
          products: 'Products',
          addProduct: 'Add Product',
          editProduct: 'Edit Product',
          deleteProduct: 'Delete Product',
          name: 'Name',
          description: 'Description',
          price: 'Price',
          category: 'Category',
          stock: 'Stock'
        },
        cart: {
          cart: 'Cart',
          addToCart: 'Add to Cart',
          removeFromCart: 'Remove from Cart',
          checkout: 'Checkout',
          total: 'Total',
          quantity: 'Quantity'
        },
        orders: {
          orders: 'Orders',
          orderDetails: 'Order Details',
          status: 'Status',
          totalAmount: 'Total Amount',
          orderDate: 'Order Date'
        }
      },
      de: {
        common: {
          loading: 'Laden...',
          error: 'Fehler',
          success: 'Erfolg',
          cancel: 'Abbrechen',
          save: 'Speichern',
          delete: 'Löschen',
          edit: 'Bearbeiten',
          add: 'Hinzufügen'
        }
      }
    }
  })
}

// Enhanced render function with common providers
export function renderWithProviders(component, options = {}) {
  const {
    props = {},
    slots = {},
    global = {},
    pinia = createPinia(),
    router = createMockRouter(),
    i18n = createMockI18n(),
    ...rest
  } = options

  // Set up Pinia
  setActivePinia(pinia)

  // Merge global plugins and components
  const globalConfig = {
    plugins: [pinia, router, i18n],
    ...global
  }

  return render(component, {
    props,
    slots,
    global: globalConfig,
    ...rest
  })
}

// Utility to create a test store
export function createTestStore(storeDefinition, initialState = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  
  const store = storeDefinition()
  
  // Set initial state if provided
  if (initialState) {
    Object.assign(store, initialState)
  }
  
  return { store, pinia }
}

// Mock axios responses
export const mockAxiosResponse = (data, status = 200, statusText = 'OK') => ({
  data,
  status,
  statusText,
  headers: {},
  config: {}
})

// Mock axios error
export const mockAxiosError = (message = 'Network Error', status = 500) => ({
  message,
  response: {
    data: { message },
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {}
  }
})

// Wait for next tick
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock localStorage
export const mockLocalStorage = () => {
  const store = {}
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store = {}
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    })
  }
}

// Mock window.location
export const mockWindowLocation = (url = 'http://localhost:3000') => {
  const location = new URL(url)
  
  Object.defineProperty(window, 'location', {
    value: {
      href: location.href,
      origin: location.origin,
      protocol: location.protocol,
      host: location.host,
      hostname: location.hostname,
      port: location.port,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn()
    },
    writable: true
  })
}

// Mock window.scrollTo
export const mockWindowScrollTo = () => {
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true
  })
}

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback
    }
    
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
}

// Mock ResizeObserver
export const mockResizeObserver = () => {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback
    }
    
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
}

// Mock matchMedia
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// Setup common mocks
export const setupCommonMocks = () => {
  mockWindowLocation()
  mockWindowScrollTo()
  mockIntersectionObserver()
  mockResizeObserver()
  mockMatchMedia()
  
  // Mock fetch
  global.fetch = vi.fn()
  
  // Mock console methods to reduce noise
  global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
  }
} 