// FILE: /middleware/language-check.ts (FIXED)
// ============================================================================
// LANGUAGE PREFERENCE MIDDLEWARE - FIXED
// ============================================================================

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side rendering
  if (process.server) return

  try {
    // Check if useI18n is available (it might not be in all contexts)
    let locale = 'en'
    
    try {
      const i18n = useI18n()
      locale = i18n.locale.value || 'en'
    } catch (e) {
      console.warn('[Language Middleware] useI18n not available, using default locale')
      locale = 'en'
    }

    // Supported languages
    const supportedLanguages = ['en', 'fr', 'es', 'de']

    // 1. Check for language preference in URL query parameter
    const urlLang = to.query.lang as string
    if (urlLang && supportedLanguages.includes(urlLang)) {
      console.log(`[Language Middleware] Setting language from URL: ${urlLang}`)
      try {
        const i18n = useI18n()
        i18n.setLocale(urlLang)
      } catch (e) {
        console.warn('[Language Middleware] Could not set locale')
      }
      return
    }

    // 2. Check user's saved language preference from localStorage
    const savedLang = typeof window !== 'undefined' 
      ? localStorage.getItem('user_language_preference')
      : null

    if (savedLang && supportedLanguages.includes(savedLang)) {
      console.log(`[Language Middleware] Using saved language: ${savedLang}`)
      try {
        const i18n = useI18n()
        i18n.setLocale(savedLang)
      } catch (e) {
        console.warn('[Language Middleware] Could not set locale')
      }
      return
    }

    // 3. Use browser language if supported
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0]
      if (supportedLanguages.includes(browserLang)) {
        console.log(`[Language Middleware] Using browser language: ${browserLang}`)
        try {
          const i18n = useI18n()
          i18n.setLocale(browserLang)
        } catch (e) {
          console.warn('[Language Middleware] Could not set locale')
        }
        return
      }
    }

    console.log(`[Language Middleware] Using default language: en`)
  } catch (error) {
    console.error('[Language Middleware] Error:', error)
    // Don't throw - just continue with default
  }
})
