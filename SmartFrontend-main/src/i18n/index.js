import { createI18n } from 'vue-i18n'

// Import all locale messages directly for now to fix the loading issue
import enMessages from '../locales/en/index.js'
import deMessages from '../locales/de/index.js'

// Locale detection function
function detectLocale() {
  // Check for saved preference first
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['en', 'de'].includes(savedLocale)) {
    return savedLocale
  }

  // Check browser language preferences
  const browserLanguages = navigator.languages || [navigator.language]
  for (const lang of browserLanguages) {
    const langCode = lang.toLowerCase().split('-')[0]
    if (langCode === 'de') {
      return 'de'
    }
  }

  // Default to English
  return 'en'
}

// Create i18n instance with all messages loaded
const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: {
    en: enMessages,
    de: deMessages
  },
  missingWarn: true, // Always show missing key warnings
  fallbackWarn: true, // Always show fallback warnings
  silentTranslationWarn: false, // Don't silence translation warnings
  globalInjection: true, // Inject $t globally
  useI18nComponentName: false, // Don't use i18n component name
  allowComposition: true, // Allow composition API
})

// Export locale switching function
export async function setLocale(locale) {
  if (!['en', 'de'].includes(locale)) {
    console.warn(`Invalid locale: ${locale}`)
    return
  }

  try {
    i18n.global.locale.value = locale
    localStorage.setItem('locale', locale)
    
    // Update document title and lang attribute
    document.documentElement.lang = locale
    document.title = i18n.global.t('brand.name')
  } catch (error) {
    console.error(`Failed to set locale ${locale}:`, error)
  }
}

// Export current locale getter
export function getCurrentLocale() {
  return i18n.global.locale.value
}

// Export available locales
export const availableLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
]

export default i18n 