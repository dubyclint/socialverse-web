import { ref, computed } from 'vue'

export const currentLang = ref('en')
export const translations = ref<Record<string, any>>({})
export const isLoadingTranslations = ref(false)

/**
 * Load translations for a given language from API.
 * Falls back to English if none are found.
 */
export async function loadTranslations(lang: string = 'en') {
  if (isLoadingTranslations.value) return
  
  isLoadingTranslations.value = true
  try {
    const { data, error } = await useFetch(`/api/admin/translations?lang=${lang}`)
    
    if (error.value) {
      console.error('Translation load failed:', error.value)
      if (lang !== 'en') {
        return loadTranslations('en')
      }
      return
    }

    let entries = data.value || []
    
    // Handle case where data is not an array
    if (!Array.isArray(entries)) {
      console.warn('Translation data is not an array, using empty array')
      entries = []
    }
    
    if (!entries.length && lang !== 'en') {
      return loadTranslations('en')
    }

    // Flatten nested translation object
    translations.value = flattenTranslations(entries)
    currentLang.value = lang
  } catch (err) {
    console.error('Translation load failed:', err)
    if (lang !== 'en') {
      await loadTranslations('en')
    }
  } finally {
    isLoadingTranslations.value = false
  }
}

/**
 * Flatten translation entries into dot-notation keys
 */
function flattenTranslations(entries: any[]): Record<string, string> {
  const result: Record<string, string> = {}
  
  // Ensure entries is an array before calling forEach
  if (!Array.isArray(entries)) {
    console.warn('flattenTranslations: entries is not an array', entries)
    return result
  }
  
  entries.forEach((entry: any) => {
    if (entry && entry.key && entry.value) {
      result[entry.key] = entry.value
    }
  })
  
  return result
}

/**
 * Translate a given key with fallback support
 */
export function t(key: string, defaultValue?: string): string {
  return translations.value[key] || defaultValue || key
}

/**
 * Get current language
 */
export function getCurrentLang(): string {
  return currentLang.value
}

/**
 * Set language and load translations
 */
export async function setLanguage(lang: string) {
  await loadTranslations(lang)
}

/**
 * Detect language from browser settings
 */
export function detectBrowserLanguage(): string {
  if (process.client) {
    return navigator.language?.split('-')[0] || 'en'
  }
  return 'en'
}

