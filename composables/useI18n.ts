// composables/useI18n.ts - FIXED VERSION
import { ref } from 'vue'

export const currentLang = ref('en')
export const translations = ref<Record<string, any>>({})
export const isLoadingTranslations = ref(false)

/**
 * Load translations for a given language from API.
 * Falls back to local JSON files if API fails.
 */
export async function loadTranslations(lang: string = 'en') {
  if (isLoadingTranslations.value) return
  
  isLoadingTranslations.value = true
  try {
    console.log('[i18n] Loading translations for language:', lang)
    
    try {
      // ✅ Try to load from API first
      const { data, error } = await useFetch(`/api/admin/translations?lang=${lang}`)
      
      if (error.value || !data.value) {
        console.warn('[i18n] Translation API returned no data, falling back to local files')
        await loadLocalTranslations(lang)
        return
      }

      let entries = data.value || []
      
      // ✅ Ensure entries is an array
      if (!Array.isArray(entries)) {
        console.warn('[i18n] Translation data is not an array, falling back to local files')
        await loadLocalTranslations(lang)
        return
      }
      
      // ✅ If array is empty, use local files
      if (entries.length === 0) {
        console.log('[i18n] Translation API returned empty array, using local files')
        await loadLocalTranslations(lang)
        return
      }
      
      translations.value = flattenTranslations(entries)
      currentLang.value = lang
      console.log('[i18n] Translations loaded successfully from API:', Object.keys(translations.value).length, 'keys')
    } catch (fetchErr) {
      console.warn('[i18n] Failed to fetch translations from API, falling back to local files:', fetchErr)
      await loadLocalTranslations(lang)
    }
  } catch (err) {
    console.error('[i18n] Translation load failed:', err)
    translations.value = {}
  } finally {
    isLoadingTranslations.value = false
  }
}

/**
 * Load translations from local JSON files as fallback
 */
async function loadLocalTranslations(lang: string = 'en') {
  try {
    console.log('[i18n] Loading translations from local files for language:', lang)
    
    // ✅ Import local JSON files
    const localeMap: Record<string, any> = {
      'en': () => import('~/locales/en.json'),
      'es': () => import('~/locales/es.json'),
      'fr': () => import('~/locales/fr.json'),
      'de': () => import('~/locales/de.json'),
    }
    
    const loader = localeMap[lang] || localeMap['en']
    const module = await loader()
    const data = module.default || module
    
    translations.value = flattenLocalTranslations(data)
    currentLang.value = lang
    console.log('[i18n] Local translations loaded successfully:', Object.keys(translations.value).length, 'keys')
  } catch (err) {
    console.warn('[i18n] Failed to load local translations:', err)
    translations.value = {}
  }
}

/**
 * Flatten local translation object into dot-notation keys
 */
function flattenLocalTranslations(obj: any, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {}
  
  try {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        const fullKey = prefix ? `${prefix}.${key}` : key
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively flatten nested objects
          Object.assign(result, flattenLocalTranslations(value, fullKey))
        } else {
          result[fullKey] = String(value)
        }
      }
    }
  } catch (err) {
    console.error('[i18n] Error flattening local translations:', err)
  }
  
  return result
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
 * Detect browser language
 */
export function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language?.split('-')[0] || 'en'
  const supportedLangs = ['en', 'es', 'fr', 'de']
  
  return supportedLangs.includes(browserLang) ? browserLang : 'en'
}
