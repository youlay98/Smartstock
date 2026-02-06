import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Intl.NumberFormat and Intl.DateTimeFormat
const mockNumberFormat = vi.fn()
const mockDateTimeFormat = vi.fn()

global.Intl.NumberFormat = mockNumberFormat
global.Intl.DateTimeFormat = mockDateTimeFormat

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'en' }
  })
}))

// Import after mocking
import { useI18nFormatters } from '@/composables/useI18nFormatters'

describe('useI18nFormatters', () => {
  let formatters

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create a simple test environment
    const TestComponent = {
      setup() {
        return useI18nFormatters()
      }
    }
    
    // Mock the composable directly
    formatters = useI18nFormatters()
  })

  describe('Number Formatting', () => {
    it('should format numbers with default options', () => {
      const mockFormat = vi.fn().mockReturnValue('1,234.56')
      mockNumberFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatNumber(1234.56)
      
      expect(mockNumberFormat).toHaveBeenCalledWith('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
      expect(mockFormat).toHaveBeenCalledWith(1234.56)
      expect(result).toBe('1,234.56')
    })

    it('should format numbers with custom options', () => {
      const mockFormat = vi.fn().mockReturnValue('1,235')
      mockNumberFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatNumber(1234.56, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
      
      expect(mockNumberFormat).toHaveBeenCalledWith('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
      expect(result).toBe('1,235')
    })
  })

  describe('Currency Formatting', () => {
    it('should format currency with default EUR options', () => {
      const mockFormat = vi.fn().mockReturnValue('€1,234.56')
      mockNumberFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatCurrency(1234.56)
      
      expect(mockNumberFormat).toHaveBeenCalledWith('en', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      expect(mockFormat).toHaveBeenCalledWith(1234.56)
      expect(result).toBe('€1,234.56')
    })

    it('should format currency with custom options', () => {
      const mockFormat = vi.fn().mockReturnValue('$1,234.56')
      mockNumberFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatCurrency(1234.56, {
        currency: 'USD'
      })
      
      expect(mockNumberFormat).toHaveBeenCalledWith('en', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
      expect(result).toBe('$1,234.56')
    })
  })

  describe('Date Formatting', () => {
    it('should format dates with default options', () => {
      const mockFormat = vi.fn().mockReturnValue('January 1, 2024')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const testDate = new Date('2024-01-01')
      const result = formatters.formatDate(testDate)
      
      expect(mockDateTimeFormat).toHaveBeenCalledWith('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      expect(mockFormat).toHaveBeenCalledWith(testDate)
      expect(result).toBe('January 1, 2024')
    })

    it('should format date strings', () => {
      const mockFormat = vi.fn().mockReturnValue('January 1, 2024')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatDate('2024-01-01')
      
      expect(mockFormat).toHaveBeenCalledWith(expect.any(Date))
      expect(result).toBe('January 1, 2024')
    })
  })

  describe('Time Formatting', () => {
    it('should format time with default options', () => {
      const mockFormat = vi.fn().mockReturnValue('14:30')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const testDate = new Date('2024-01-01T14:30:00')
      const result = formatters.formatTime(testDate)
      
      expect(mockDateTimeFormat).toHaveBeenCalledWith('en', {
        hour: '2-digit',
        minute: '2-digit'
      })
      expect(mockFormat).toHaveBeenCalledWith(testDate)
      expect(result).toBe('14:30')
    })
  })

  describe('DateTime Formatting', () => {
    it('should format datetime with default options', () => {
      const mockFormat = vi.fn().mockReturnValue('01/01/2024, 14:30')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const testDate = new Date('2024-01-01T14:30:00')
      const result = formatters.formatDateTime(testDate)
      
      expect(mockDateTimeFormat).toHaveBeenCalledWith('en', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      expect(mockFormat).toHaveBeenCalledWith(testDate)
      expect(result).toBe('01/01/2024, 14:30')
    })
  })

  describe('Plural Formatting', () => {
    it('should return singular for count of 1', () => {
      const result = formatters.formatPlural(1, 'item', 'items')
      expect(result).toBe('item')
    })

    it('should return plural for count of 0', () => {
      const result = formatters.formatPlural(0, 'item', 'items')
      expect(result).toBe('items')
    })

    it('should return plural for count greater than 1', () => {
      const result = formatters.formatPlural(5, 'item', 'items')
      expect(result).toBe('items')
    })

    it('should handle negative numbers', () => {
      const result = formatters.formatPlural(-1, 'item', 'items')
      expect(result).toBe('items')
    })
  })

  describe('Computed Properties', () => {
    it('should have computed formatters', () => {
      expect(formatters.numberFormatter).toBeDefined()
      expect(formatters.currencyFormatter).toBeDefined()
      expect(formatters.dateFormatter).toBeDefined()
      expect(formatters.timeFormatter).toBeDefined()
      expect(formatters.dateTimeFormatter).toBeDefined()
    })

    it('should use computed formatters', () => {
      const mockFormat = vi.fn().mockReturnValue('1,234.56')
      mockNumberFormat.mockReturnValue({ format: mockFormat })
      
      // The computed formatters return functions, so we need to call them
      const numberFormatter = formatters.numberFormatter.value
      const result = numberFormatter(1234.56)
      
      expect(mockNumberFormat).toHaveBeenCalledWith('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
      expect(result).toBe('1,234.56')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid date strings gracefully', () => {
      const mockFormat = vi.fn().mockReturnValue('Invalid Date')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatDate('invalid-date')
      
      expect(mockFormat).toHaveBeenCalledWith(expect.any(Date))
      expect(result).toBe('Invalid Date')
    })

    it('should handle null values', () => {
      const mockFormat = vi.fn().mockReturnValue('Invalid Date')
      mockDateTimeFormat.mockReturnValue({ format: mockFormat })
      
      const result = formatters.formatDate(null)
      
      expect(mockFormat).toHaveBeenCalledWith(expect.any(Date))
      expect(result).toBe('Invalid Date')
    })
  })
}) 