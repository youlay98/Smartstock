import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useI18nFormatters() {
  const { locale } = useI18n()

  // Number formatter
  const formatNumber = (value, options = {}) => {
    const defaultOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }
    
    return new Intl.NumberFormat(locale.value, defaultOptions).format(value)
  }

  // Currency formatter (EUR)
  const formatCurrency = (value, options = {}) => {
    const defaultOptions = {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    }
    
    return new Intl.NumberFormat(locale.value, defaultOptions).format(value)
  }

  // Date formatter
  const formatDate = (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat(locale.value, defaultOptions).format(dateObj)
  }

  // Time formatter
  const formatTime = (date, options = {}) => {
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat(locale.value, defaultOptions).format(dateObj)
  }

  // DateTime formatter
  const formatDateTime = (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    const dateObj = date instanceof Date ? date : new Date(date)
    return new Intl.DateTimeFormat(locale.value, defaultOptions).format(dateObj)
  }

  // Plural formatter
  const formatPlural = (count, singular, plural) => {
    return count === 1 ? singular : plural
  }

  // Computed properties for reactive formatting
  const numberFormatter = computed(() => (value, options) => formatNumber(value, options))
  const currencyFormatter = computed(() => (value, options) => formatCurrency(value, options))
  const dateFormatter = computed(() => (date, options) => formatDate(date, options))
  const timeFormatter = computed(() => (date, options) => formatTime(date, options))
  const dateTimeFormatter = computed(() => (date, options) => formatDateTime(date, options))

  return {
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,
    formatPlural,
    numberFormatter,
    currencyFormatter,
    dateFormatter,
    timeFormatter,
    dateTimeFormatter
  }
} 