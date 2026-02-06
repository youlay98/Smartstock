import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { loginUser, register } from '@/services/authService'

// Mock auth service
vi.mock('@/services/authService', () => ({
  loginUser: vi.fn(),
  register: vi.fn()
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

describe('Auth Store', () => {
  let pinia

  beforeEach(() => {
    // Clear localStorage mock
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    mockLocalStorage.clear.mockClear()
    
    // Create fresh Pinia instance
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    mockLocalStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with null user and token when no localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const store = useAuthStore()
      
      expect(store.user).toBe(null)
      expect(store.token).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })

    it('should initialize with stored user and token from localStorage', () => {
      const mockUser = { id: 1, username: 'testuser' }
      const mockToken = 'mock-jwt-token'
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce(mockToken)
      
      const store = useAuthStore()
      
      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe(mockToken)
      expect(store.isAuthenticated).toBe(true)
    })

    it('should handle invalid JSON in localStorage gracefully', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('invalid-json')
        .mockReturnValueOnce('valid-token')
      
      const store = useAuthStore()
      
      expect(store.user).toBe(null)
      expect(store.token).toBe('valid-token')
    })
  })

  describe('Login', () => {
    it('should login successfully and store user data', async () => {
      const credentials = { username: 'testuser', password: 'password' }
      const mockResponse = {
        data: {
          user: { id: 1, username: 'testuser' },
          token: 'mock-jwt-token'
        }
      }
      
      loginUser.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      const result = await store.login(credentials)
      
      expect(loginUser).toHaveBeenCalledWith(credentials)
      expect(store.user).toEqual(mockResponse.data.user)
      expect(store.token).toBe(mockResponse.data.token)
      expect(store.isAuthenticated).toBe(true)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockResponse.data.token)
      expect(result).toBe(mockResponse)
    })

    it('should handle login errors', async () => {
      const credentials = { username: 'testuser', password: 'wrongpassword' }
      const mockError = new Error('Invalid credentials')
      
      loginUser.mockRejectedValue(mockError)
      
      const store = useAuthStore()
      await expect(store.login(credentials)).rejects.toThrow('Invalid credentials')
      expect(store.user).toBe(null)
      expect(store.token).toBe(null)
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('Register', () => {
    it('should register successfully', async () => {
      const userData = { username: 'newuser', email: 'new@example.com', password: 'password' }
      const mockResponse = {
        data: {
          message: 'User registered successfully',
          user: { id: 2, username: 'newuser' }
        }
      }
      
      register.mockResolvedValue(mockResponse)
      
      const store = useAuthStore()
      const result = await store.register(userData)
      
      expect(register).toHaveBeenCalledWith(userData)
      expect(result).toBe(mockResponse)
    })

    it('should handle registration errors', async () => {
      const userData = { username: 'existinguser', email: 'existing@example.com', password: 'password' }
      const mockError = new Error('User already exists')
      
      register.mockRejectedValue(mockError)
      
      const store = useAuthStore()
      await expect(store.register(userData)).rejects.toThrow('User already exists')
    })
  })

  describe('Logout', () => {
    it('should clear user data and localStorage on logout', () => {
      const store = useAuthStore()
      
      // Set initial state
      store.user = { id: 1, username: 'testuser' }
      store.token = 'mock-jwt-token'
      
      store.logout()
      
      expect(store.user).toBe(null)
      expect(store.token).toBe(null)
      expect(store.isAuthenticated).toBe(false)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('Set Token', () => {
    it('should set token and parse JWT payload correctly', () => {
      const store = useAuthStore()
      
      // Mock JWT token with valid payload
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsInJvbGVzIjpbIkNVU1RPTUVSIl19.mock-signature'
      
      store.setToken(mockToken)
      
      expect(store.token).toBe(mockToken)
      expect(store.user).toEqual({
        id: 1,
        username: 'testuser',
        roles: ['CUSTOMER']
      })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', mockToken)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify({
        id: 1,
        username: 'testuser',
        roles: ['CUSTOMER']
      }))
    })

    it('should handle invalid JWT token gracefully', () => {
      const store = useAuthStore()
      
      const invalidToken = 'invalid-jwt-token'
      
      store.setToken(invalidToken)
      
      expect(store.token).toBe(invalidToken)
      expect(store.user).toBe(null)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', invalidToken)
    })

    it('should handle JWT token with different payload structure', () => {
      const store = useAuthStore()
      
      // Mock JWT token with 'sub' instead of 'id'
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlcyI6WyJDVVNUT01FUiJdfQ.mock-signature'
      
      store.setToken(mockToken)
      
      expect(store.token).toBe(mockToken)
      expect(store.user).toEqual({
        id: 'testuser',
        username: 'testuser',
        roles: ['CUSTOMER']
      })
    })
  })

  describe('Computed Properties', () => {
    it('should return true for isAuthenticated when token exists', () => {
      const store = useAuthStore()
      store.token = 'mock-jwt-token'
      expect(store.isAuthenticated).toBe(true)
    })

    it('should return false for isAuthenticated when token is null', () => {
      const store = useAuthStore()
      store.token = null
      expect(store.isAuthenticated).toBe(false)
    })

    it('should return false for isAuthenticated when token is empty string', () => {
      const store = useAuthStore()
      store.token = ''
      expect(store.isAuthenticated).toBe(false)
    })
  })
}) 