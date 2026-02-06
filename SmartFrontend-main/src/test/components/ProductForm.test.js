import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import { screen } from '@testing-library/vue'
import ProductForm from '@/features/products/components/ProductForm.vue'

// Mock the product store
vi.mock('@/stores/products', () => ({
  useProductStore: () => ({
    categories: [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' }
    ],
    loadCategories: vi.fn()
  })
}))

describe('ProductForm - High Priority Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Essential Rendering', () => {
    it('should render all required form fields', () => {
      renderWithProviders(ProductForm)
      
      // Essential form fields
      expect(screen.getByPlaceholderText('Enter product name')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter product description...')).toBeInTheDocument()
    })

    it('should show correct button text for create mode', () => {
      renderWithProviders(ProductForm)
      expect(screen.getByRole('button', { name: 'Create Product' })).toBeInTheDocument()
    })

    it('should show correct button text for edit mode', () => {
      renderWithProviders(ProductForm, { props: { isEdit: true } })
      expect(screen.getByRole('button', { name: 'Update Product' })).toBeInTheDocument()
    })
  })

  describe('Critical Form Validation', () => {
    it('should have required fields marked as required', () => {
      renderWithProviders(ProductForm)
      
      const nameInput = screen.getByPlaceholderText('Enter product name')
      const priceInput = screen.getByPlaceholderText('0.00')
      const stockInput = screen.getByPlaceholderText('0')
      
      expect(nameInput).toHaveAttribute('required')
      expect(priceInput).toHaveAttribute('required')
      expect(stockInput).toHaveAttribute('required')
    })

    it('should have proper input types for critical fields', () => {
      renderWithProviders(ProductForm)
      
      const priceInput = screen.getByPlaceholderText('0.00')
      const stockInput = screen.getByPlaceholderText('0')
      
      expect(priceInput).toHaveAttribute('type', 'number')
      expect(stockInput).toHaveAttribute('type', 'number')
    })
  })

  describe('Essential Form Structure', () => {
    it('should have submit and cancel buttons', () => {
      renderWithProviders(ProductForm)
      
      expect(screen.getByRole('button', { name: 'Create Product' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should have proper form sections', () => {
      renderWithProviders(ProductForm)
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Product Image')).toBeInTheDocument()
    })
  })

  describe('Critical Image Upload', () => {
    it('should have file upload functionality', () => {
      renderWithProviders(ProductForm)
      
      expect(screen.getByText('Click to upload or drag & drop')).toBeInTheDocument()
      expect(screen.getByText('PNG, JPG up to 5MB')).toBeInTheDocument()
    })

    it('should have file input with image restrictions', () => {
      renderWithProviders(ProductForm)
      
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })
  })
}) 