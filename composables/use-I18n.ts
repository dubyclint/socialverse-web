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
    
    if (!apiSuccess) {
      await loadLocalTranslations(lang)
    }
    
  } catch (err) {
    console.error('[i18n] Translation load failed:', err)
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
 * Set language
 */
export async function setLanguage(lang: string) {
  try {
    console.log('[i18n] Setting language:', lang)
    await loadTranslations(lang)
    currentLang.value = lang
    console.log('[i18n] ✅ Language set:', lang)
  } catch (err) {
    console.error('[i18n] ❌ Error setting language:', err)
  }
}

/**
 * Get current language
 */
export function getCurrentLang(): string {
  return currentLang.value
}

/**
 * Detect browser language
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
 * Initialize i18n
 */
export async function initializeI18n() {
  try {
    console.log('[i18n] Initializing...')
    const browserLang = detectBrowserLanguage()
    await loadTranslations(browserLang)
    console.log('[i18n] ✅ Initialized with language:', browserLang)
  } catch (err) {
    console.error('[i18n] ❌ Initialization error:', err)
    await loadTranslations('en')
  }
}
