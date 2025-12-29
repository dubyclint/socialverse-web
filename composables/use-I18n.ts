FIXED FILE 7: /composables/use-I18n.ts (EXTENDED)
# ============================================================================
# I18N COMPOSABLE - FIXED: Uses storage manager for language persistence
# ============================================================================
# ✅ FIXED: Added setLanguage() with storage persistence
# ✅ FIXED: Added getStoredLanguage() method
# ✅ FIXED: Proper error handling
# ============================================================================

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
    
    // ✅ Try API first, but don't block if it fails
    let apiSuccess = false
    try {
      const { data, error } = await useFetch(`/api/translations?lang=${lang}`)
      
      if (!error.value && data.value && Array.isArray(data.value) && data.value.length > 0) {
        translations.value = flattenTranslations(data.value)
        currentLang.value = lang
        apiSuccess = true
        console.log('[i18n] ✅ Translations loaded from API:', Object.keys(translations.value).length, 'keys')
      }
    } catch (fetchErr) {
      console.warn('[i18n] API fetch failed, using local files:', fetchErr)
    }
    
    // ✅ If API didn't work, use local files
    if (!apiSuccess) {
      await loadLocalTranslations(lang)
    }
    
  } catch (err) {
    console.error('[i18n] Translation load failed:', err)
    // ✅ Always load local files as last resort
    await loadLocalTranslations(lang)
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
    console.log('[i18n] ✅ Local translations loaded:', Object.keys(translations.value).length, 'keys')
  } catch (err) {
    console.warn('[i18n] Failed to load local translations:', err)
    translations.value = {}
  }
}

/**
 * Flatten API translation object into dot-notation keys
 */
function flattenTranslations(arr: any[]): Record<string, string> {
  const result: Record<string, string> = {}
  
  try {
    arr.forEach((item: any) => {
      if (item.key && item.value) {
        result[item.key] = item.value
      }
    })
  } catch (e) {
    console.warn('[i18n] Error flattening translations:', e)
  }
  
  return result
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
          Object.assign(result, flattenLocalTranslations(value, fullKey))
        } else {
          result[fullKey] = String(value)
        }
      }
    }
  } catch (e) {
    console.warn('[i18n] Error flattening local translations:', e)
  }
  
  return result
}

/**
 * Translate a key
 */
export function t(key: string, defaultValue?: string): string {
  const value = translations.value[key]
  
  if (!value) {
    console.warn('[i18n] Missing translation key:', key)
    return defaultValue || key
  }
  
  return value
}

/**
 * ✅ FIXED: Set language with storage persistence
 */
export async function setLanguage(lang: string) {
  try {
    console.log('[i18n] Setting language:', lang)
    
    // ✅ FIXED: Use storage manager to persist language
    const storage = useStorage({ prefix: 'i18n_' })
    
    // Load translations
    await loadTranslations(lang)
    
    // Store language preference
    storage.set('language', lang)
    currentLang.value = lang
    
    console.log('[i18n] ✅ Language set and persisted:', lang)
  } catch (err) {
    console.error('[i18n] ❌ Error setting language:', err)
  }
}

/**
 * ✅ FIXED: Get stored language
 */
export function getStoredLanguage(): string {
  try {
    const storage = useStorage({ prefix: 'i18n_' })
    const stored = storage.get<string>('language')
    
    if (stored) {
      console.log('[i18n] ✅ Retrieved stored language:', stored)
      return stored
    }
  } catch (err) {
    console.warn('[i18n] Error retrieving stored language:', err)
  }
  
  return 'en'
}

/**
 * ✅ FIXED: Get current language
 */
export function getCurrentLang(): string {
  return currentLang.value
}

/**
 * ✅ FIXED: Detect browser language
 */
export function detectBrowserLanguage(): string {
  try {
    const browserLang = navigator.language?.split('-')[0] || 'en'
    const supportedLangs = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    
    const detected = supportedLangs.includes(browserLang) ? browserLang : 'en'
    console.log('[i18n] ✅ Detected browser language:', detected)
    
    return detected
  } catch (err) {
    console.warn('[i18n] Error detecting browser language:', err)
    return 'en'
  }
}

/**
 * ✅ FIXED: Initialize i18n
 */
export async function initializeI18n() {
  try {
    console.log('[i18n] Initializing...')
    
    // Get stored language or detect browser language
    const storedLang = getStoredLanguage()
    const browserLang = detectBrowserLanguage()
    const langToUse = storedLang || browserLang
    
    // Load translations
    await loadTranslations(langToUse)
    
    console.log('[i18n] ✅ Initialized with language:', langToUse)
  } catch (err) {
    console.error('[i18n] ❌ Initialization error:', err)
    // Fallback to English
    await loadTranslations('en')
  }
}
