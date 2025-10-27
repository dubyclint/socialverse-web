import { ref } from 'vue'

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
    console.log('[i18n] Loading translations for language:', lang)
    
    try {
      const { data, error } = await useFetch(`/api/admin/translations?lang=${lang}`)
      
      if (error.value) {
        console.warn('[i18n] Translation API error:', error.value)
        // Set empty translations and continue - don't break the app
        translations.value = {}
        currentLang.value = lang
        return
      }

      let entries = data.value || []
      
      // Handle case where data is not an array
      if (!Array.isArray(entries)) {
        console.warn('[i18n] Translation data is not an array, using empty object')
        entries = []
      }
      
      // Flatten nested translation object
      translations.value = flattenTranslations(entries)
      currentLang.value = lang
      console.log('[i18n] Translations loaded successfully')
    } catch (fetchErr) {
      console.warn('[i18n] Failed to fetch translations:', fetchErr)
      // Set empty translations and continue
      translations.value = {}
      currentLang.value = lang
    }
  } catch (err) {
    console.error('[i18n] Translation load failed:', err)
    translations.value = {}
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
    console.warn('[i18n] flattenTranslations: entries is not an array', typeof entries)
    return result
  }
  
  try {
    entries.forEach((entry: any) => {
      if (entry && typeof entry === 'object' && entry.key && entry.value) {
        result[entry.key] = String(entry.value)
      }
    })
  } catch (err) {
    console.error('[i18n] Error flattening translations:', err)
  }
  
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
    const lang = navigator.language?.split('-')[0] || 'en'
    console.log('[i18n] Detected browser language:', lang)
    return lang
  }
  return 'en'
}
